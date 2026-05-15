// Render the mobile Home screen.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { LanguageSelector } from "../components/LanguageSelector";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { getBackendHealth } from "../lib/api/health";
import { getPlants } from "../lib/api/plants";
import { storageKeys } from "../lib/storage/keys";
import { predictImage } from "../lib/api/predict";
import { appendImageAsset } from "../lib/api/upload";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { FeedbackEntry } from "../types/app";
import type { Plant } from "../types/plants";
import { formatPredictionConfidence } from "../utils/predict";

type ModelState = {
  loaded: boolean;
  status: "checking" | "ready" | "offline";
};

type DiagnosisState = {
  title: string;
  message: string;
  protection?: string;
  workingTime?: string;
  tone: "healthy" | "warning" | "error";
};

type DiseaseCareInfo = {
  protection: string;
  workingTime: string;
};

type SearchResult = {
  id: string;
  type: "page" | "plant";
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route?: string;
  action?: "scan";
  historyValue: string;
  score: number;
};

const MIN_SUPPORTED_PREDICTION_CONFIDENCE = 72;
const MIN_SUPPORTED_PREDICTION_MARGIN = 15;
const MAX_HOME_SEARCH_HISTORY = 5;
const SUPPORTED_PREDICTION_LABELS = new Set([
  "Botrytis",
  "Fresh Leaf",
  "Leaf Spot",
  "Powdery Mildew",
  "Rust",
  "Healthy",
]);

function isUnsupportedPredictionLabel(prediction: string) {
  const normalized = prediction.trim().toLowerCase();
  return (
    normalized === "needs closer inspection" ||
    normalized.includes("not recognized") ||
    normalized.includes("not supported") ||
    normalized.includes("unsupported") ||
    normalized.includes("unrecognized")
  );
}

function isUnsupportedDiagnosisMessage(message: string | undefined) {
  if (!message) {
    return false;
  }

  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("not recognized") ||
    normalized.includes("not supported") ||
    normalized.includes("unsupported") ||
    normalized.includes("unrecognized") ||
    normalized.includes("unable to classify") ||
    normalized.includes("outside the trained") ||
    normalized.includes("trained model") ||
    normalized.includes("needs closer inspection")
  );
}

function parsePredictionConfidence(confidence: number | string) {
  if (typeof confidence === "number") {
    return confidence > 1 ? confidence : confidence * 100;
  }

  const parsed = Number(confidence);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed > 1 ? parsed : parsed * 100;
}

function isSupportedPredictionLabel(prediction: string) {
  return SUPPORTED_PREDICTION_LABELS.has(prediction.trim());
}

function getPredictionMargin(topPredictions: Array<{ label: string; confidence: number }> | undefined) {
  if (!topPredictions || topPredictions.length < 2) {
    return null;
  }

  return (topPredictions[0].confidence - topPredictions[1].confidence) * 100;
}

function resolveModelState(aiModel?: { loaded?: boolean; status?: string | null }): ModelState {
  // Normalize backend health data into the small state model used by the dashboard.
  return {
    loaded: Boolean(aiModel?.loaded),
    status: aiModel?.status === "ready" ? "ready" : aiModel?.status === "offline" ? "offline" : "checking",
  };
}

function formatRelativeTime(
  dateString: string | null | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (!dateString) {
    return t("just_now");
  }

  const created = new Date(dateString).getTime();
  if (Number.isNaN(created)) {
    return t("just_now");
  }

  const diffMs = Date.now() - created;
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) {
    return t("just_now");
  }

  if (diffMin < 60) {
    return t("min_ago", { count: diffMin });
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return t("hr_ago", { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  return t("day_ago", { count: diffDays });
}

function isHealthyPrediction(prediction: string) {
  const normalized = prediction.trim().toLowerCase();
  return normalized.includes("healthy") || normalized.includes("fresh leaf");
}

function normalizeDiseaseKey(prediction: string) {
  // Collapse backend labels into predictable lookup keys for local care advice.
  return prediction
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function buildSearchBlob(parts: Array<string | null | undefined | false>) {
  return parts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function queryMatches(searchBlob: string, queryTokens: string[]) {
  return queryTokens.every((token) => searchBlob.includes(token));
}

function scoreSearchMatch(title: string, searchBlob: string, normalizedQuery: string) {
  const normalizedTitle = normalizeSearchValue(title);

  if (normalizedTitle === normalizedQuery) {
    return 120;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 90;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 75;
  }

  if (searchBlob.includes(normalizedQuery)) {
    return 60;
  }

  return 40;
}

// Lightweight local care guidance used when the prediction response does not include treatment text.
const diseaseCareInfo: Record<string, DiseaseCareInfo> = {
  appledisease: {
    protection: "Spray a copper-based fungicide early in the season and remove infected leaves.",
    workingTime: "Start immediately; check new growth over 7-14 days.",
  },
  applehealthy: {
    protection: "Maintain good airflow, proper watering, and regular nutrient balance.",
    workingTime: "Keep this routine weekly; visible health stays stable over 1-2 weeks.",
  },
  botrytis: {
    protection: "Reduce humidity and remove infected plant parts immediately.",
    workingTime: "Act the same day; improvement usually appears in 3-7 days.",
  },
  freshleaf: {
    protection: "Avoid overwatering and protect from pests with neem oil spray.",
    workingTime: "Apply care weekly; fresh leaves should remain healthy within 7 days.",
  },
  healthy: {
    protection: "Maintain good airflow, proper watering, and regular nutrient balance.",
    workingTime: "Keep this routine weekly; visible health stays stable over 1-2 weeks.",
  },
  healthyplant: {
    protection: "Maintain good airflow, proper watering, and regular nutrient balance.",
    workingTime: "Keep this routine weekly; visible health stays stable over 1-2 weeks.",
  },
  healthyleafrose: {
    protection: "Ensure full sunlight and regular pruning for airflow.",
    workingTime: "Maintain weekly; rose leaves usually stay strong through the next growth cycle.",
  },
  leafspot: {
    protection: "Avoid wetting leaves; use fungicide if it spreads.",
    workingTime: "Remove spotted leaves now; monitor for 7-10 days.",
  },
  powderymildew: {
    protection: "Spray sulfur or baking soda solution and improve air circulation.",
    workingTime: "Treat every 7 days; powdery patches should reduce in 1-2 weeks.",
  },
  rust: {
    protection: "Remove infected leaves and apply fungicide regularly.",
    workingTime: "Start today; repeat treatment weekly for 2-3 weeks.",
  },
  roserust: {
    protection: "Remove infected leaves and apply fungicide regularly.",
    workingTime: "Start today; repeat treatment weekly for 2-3 weeks.",
  },
  rosesawfly: {
    protection: "Spray insecticidal soap or neem oil on affected leaves.",
    workingTime: "Apply in the evening; check damage and larvae again in 2-4 days.",
  },
  roseslug: {
    protection: "Spray insecticidal soap or neem oil on affected leaves.",
    workingTime: "Apply in the evening; check damage and larvae again in 2-4 days.",
  },
};

function getDiseaseCareInfo(prediction: string) {
  return diseaseCareInfo[normalizeDiseaseKey(prediction)];
}

function getDiagnosisToneColors(tone: DiagnosisState["tone"]) {
  // Pair each diagnosis tone with a small palette so the alert card reads clearly at a glance.
  if (tone === "healthy") {
    return {
      bg: "#E0F5E9",
      iconBg: "#CBEAD8",
      iconColor: "#1C6B47",
      title: "#1F5A3F",
      body: "#2F7251",
    };
  }

  if (tone === "warning") {
    return {
      bg: "#FFF0E2",
      iconBg: "#FFE0BD",
      iconColor: "#A65A16",
      title: "#7F4410",
      body: "#95531A",
    };
  }

  return {
    bg: "#FBE5EA",
    iconBg: "#F6CED7",
    iconColor: "#8F2D56",
    title: "#742245",
    body: "#8F2D56",
  };
}

function FeedbackCard({ feedback }: { feedback: FeedbackEntry }) {
  const { t } = useLanguage();

  // Render one feedback item for the home carousel.
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackContent}>
        <Text style={styles.feedbackMessage}>{feedback.message}</Text>
        {feedback.rating ? (
          <View style={styles.feedbackStars}>
            <Text style={styles.feedbackStarsText}>{"*".repeat(feedback.rating)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.feedbackDate}>{formatRelativeTime(feedback.createdAt, t)}</Text>
    </View>
  );
}

export function HomeScreen() {
  const { user, authNotice, setAuthNotice } = useAuth();
  const { feedbacks, refreshFeedbacks } = useSettings();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trackedPlants, setTrackedPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisState | null>(null);
  const [modelState, setModelState] = useState<ModelState>({ loaded: false, status: "checking" });
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const greeting = user?.full_name ? t("hello_user", { name: user.full_name }) : t("hello_guest");
  const normalizedSearch = normalizeSearchValue(search);
  const searchTokens = normalizedSearch.split(/\s+/).filter(Boolean);

  const loadSearchResources = async () => {
    const [savedHistory, savedPlants] = await Promise.all([
      AsyncStorage.getItem(storageKeys.searchHistory),
      getPlants().catch(() => [] as Plant[]),
    ]);

    try {
      const parsedHistory = JSON.parse(savedHistory || "[]");
      if (Array.isArray(parsedHistory)) {
        setSearchHistory(parsedHistory.filter((item): item is string => typeof item === "string").slice(0, MAX_HOME_SEARCH_HISTORY));
      }
    } catch {
      setSearchHistory([]);
    }

    const validPlants = (savedPlants || []).filter((plant) => plant && plant.tracking !== false && plant.name?.trim());
    setTrackedPlants(validPlants);
  };

  const storeSearchHistory = async (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    const nextHistory = [normalizedValue, ...searchHistory.filter((item) => normalizeSearchValue(item) !== normalizeSearchValue(normalizedValue))].slice(
      0,
      MAX_HOME_SEARCH_HISTORY
    );

    setSearchHistory(nextHistory);
    await AsyncStorage.setItem(storageKeys.searchHistory, JSON.stringify(nextHistory));
  };

  const clearSearchHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(storageKeys.searchHistory);
  };

  const refreshModelState = async () => {
    try {
      // Ping backend health so the diagnose card can reflect whether the AI model is actually available.
      const response = await getBackendHealth();
      setModelState(resolveModelState(response.ai_model));
    } catch {
      setModelState({ loaded: false, status: "offline" });
    }
  };

  const modelLabel = useMemo(() => {
    if (modelState.loaded) {
      return t("model_live");
    }

    return modelState.status === "checking" ? t("checking") : t("model_offline");
  }, [modelState.loaded, modelState.status, t]);

  useEffect(() => {
    // Fade the screen content in once the component mounts for a softer dashboard entrance.
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    let active = true;

    const syncSearchResources = async () => {
      try {
        await loadSearchResources();
      } catch {
        if (!active) {
          return;
        }

        setSearchHistory([]);
        setTrackedPlants([]);
      }
    };

    void syncSearchResources();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Show one-time auth success messages after redirects from login or registration flows.
    if (!authNotice) {
      return;
    }

    setStatusMessage(authNotice);
    if (statusTimer.current) {
      clearTimeout(statusTimer.current);
    }

    statusTimer.current = setTimeout(() => {
      setStatusMessage("");
    }, 3200);

    setAuthNotice(null);
  }, [authNotice, setAuthNotice]);

  useEffect(() => {
    let active = true;

    const syncModelState = async () => {
      try {
        const response = await getBackendHealth();

        if (!active) {
          return;
        }

        setModelState(resolveModelState(response.ai_model));
      } catch {
        if (!active) {
          return;
        }

        setModelState({ loaded: false, status: "offline" });
      }
    };

    // Re-check the backend model periodically so the dashboard reflects outages or reloads quickly.
    void syncModelState();
    const intervalId = setInterval(() => {
      void syncModelState();
    }, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // Refresh user feedback in the background so the carousel stays current while the screen is open.
    void refreshFeedbacks();
    const intervalId = setInterval(() => {
      void refreshFeedbacks();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refreshFeedbacks]);

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (feedbacks.length === 0) {
      setFeedbackIndex(0);
    } else if (feedbackIndex >= feedbacks.length) {
      setFeedbackIndex(feedbacks.length - 1);
    }
  }, [feedbackIndex, feedbacks]);

  const nextFeedback = () => {
    setFeedbackIndex((current) => (current < feedbacks.length - 1 ? current + 1 : 0));
  };

  const prevFeedback = () => {
    setFeedbackIndex((current) => (current > 0 ? current - 1 : feedbacks.length - 1));
  };

  const feedbackPanResponder = useMemo(
    // Support swipe gestures in addition to the arrow buttons for the feedback carousel.
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -50 && feedbackIndex < feedbacks.length - 1) {
            setFeedbackIndex((current) => current + 1);
            return;
          }

          if (gestureState.dx >= 50 && feedbackIndex > 0) {
            setFeedbackIndex((current) => current - 1);
          }
        },
      }),
    [feedbackIndex, feedbacks.length]
  );

  const handleScan = async () => {
    // Request media access lazily so the permission prompt only appears when the user starts a scan.
    const permission =
      hasMediaPermission == null
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : { granted: hasMediaPermission };

    if (hasMediaPermission == null) {
      setHasMediaPermission(permission.granted);
    }

    if (!permission.granted) {
      const message = t("media_permission_message");
      setDiagnosis({
        title: t("diagnosis_unavailable"),
        message,
        tone: "error",
      });
      Alert.alert(t("permission_required"), message);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const file = result.assets[0];
    const formData = new FormData();
    setLoading(true);

    try {
      // Upload the selected leaf image and ask the backend model for the top diagnosis.
      await appendImageAsset(formData, "file", file, "scan");
      const response = await predictImage(formData);
      const confidenceValue = parsePredictionConfidence(response.confidence);
      const predictionMargin = getPredictionMargin(response.top_predictions);

      if (
        response.status === "unsupported" ||
        isUnsupportedPredictionLabel(response.prediction) ||
        !isSupportedPredictionLabel(response.prediction) ||
        confidenceValue == null ||
        confidenceValue < MIN_SUPPORTED_PREDICTION_CONFIDENCE ||
        (predictionMargin != null && predictionMargin < MIN_SUPPORTED_PREDICTION_MARGIN)
      ) {
        setDiagnosis({
          title: t("diagnosis_unavailable"),
          message: t("diagnosis_image_unsupported"),
          tone: "error",
        });
        return;
      }

      const healthy = isHealthyPrediction(response.prediction);
      const confidence = formatPredictionConfidence(response.confidence);
      const alternatePrediction = response.top_predictions?.find((item) => item.label !== response.prediction);
      const careInfo =
        getDiseaseCareInfo(response.prediction) ??
        (alternatePrediction ? getDiseaseCareInfo(alternatePrediction.label) : undefined);
      const message =
        response.prediction === "Needs closer inspection" && alternatePrediction
          ? `${response.prediction} - Best guess: ${alternatePrediction.label} (${formatPredictionConfidence(alternatePrediction.confidence)}% confidence)`
          : `${response.prediction} - ${confidence}% confidence`;

      setDiagnosis({
        title: healthy ? t("healthy_plant") : t("disease_detected"),
        message,
        protection: careInfo?.protection,
        workingTime: careInfo?.workingTime,
        tone: healthy ? "healthy" : "warning",
      });
      // A successful prediction confirms the backend model is reachable and working.
      setModelState({ loaded: true, status: "ready" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("diagnosis_failed");
      setDiagnosis({
        title: t("diagnosis_unavailable"),
        message: isUnsupportedDiagnosisMessage(errorMessage) ? t("diagnosis_image_unsupported") : errorMessage,
        tone: "error",
      });
      void refreshModelState();
    } finally {
      setLoading(false);
    }
  };

  const pageSearchResults = useMemo<SearchResult[]>(
    () => [
      {
        id: "page-home",
        type: "page",
        title: t("nav_home"),
        subtitle: t("home_search_open_screen"),
        icon: "home-filled",
        route: "/home",
        historyValue: t("nav_home"),
        score: 0,
      },
      {
        id: "page-diagnose",
        type: "page",
        title: t("diagnose"),
        subtitle: t("tap_to_scan_leaf"),
        icon: "photo-camera",
        action: "scan",
        historyValue: t("diagnose"),
        score: 0,
      },
      {
        id: "page-catalog",
        type: "page",
        title: t("nav_catalog"),
        subtitle: t("home_search_open_screen"),
        icon: "inventory-2",
        route: "/catalog",
        historyValue: t("nav_catalog"),
        score: 0,
      },
      {
        id: "page-cart",
        type: "page",
        title: t("nav_cart"),
        subtitle: t("home_search_open_screen"),
        icon: "shopping-cart",
        route: "/cart",
        historyValue: t("nav_cart"),
        score: 0,
      },
      {
        id: "page-profile",
        type: "page",
        title: t("profile_title"),
        subtitle: t("home_search_open_screen"),
        icon: "person",
        route: "/profile",
        historyValue: t("profile_title"),
        score: 0,
      },
      {
        id: "page-myplants",
        type: "page",
        title: t("my_plants_title"),
        subtitle: t("home_search_open_screen"),
        icon: "spa",
        route: "/myplants",
        historyValue: t("my_plants_title"),
        score: 0,
      },
      {
        id: "page-register",
        type: "page",
        title: t("register_new_plant"),
        subtitle: t("home_search_open_screen"),
        icon: "add-circle-outline",
        route: "/plant-register",
        historyValue: t("register_new_plant"),
        score: 0,
      },
      {
        id: "page-care",
        type: "page",
        title: t("care_title"),
        subtitle: t("home_search_open_screen"),
        icon: "event-note",
        route: "/care",
        historyValue: t("care_title"),
        score: 0,
      },
      {
        id: "page-quicktip",
        type: "page",
        title: t("quick_tip_card"),
        subtitle: t("home_search_open_screen"),
        icon: "auto-awesome",
        route: "/quicktip",
        historyValue: t("quick_tip_card"),
        score: 0,
      },
      {
        id: "page-feedback",
        type: "page",
        title: t("feedback_title"),
        subtitle: t("home_search_open_screen"),
        icon: "forum",
        route: "/feedback",
        historyValue: t("feedback_title"),
        score: 0,
      },
      {
        id: "page-settings",
        type: "page",
        title: t("settings_title"),
        subtitle: t("home_search_open_screen"),
        icon: "settings",
        route: "/settings",
        historyValue: t("settings_title"),
        score: 0,
      },
      {
        id: "page-about",
        type: "page",
        title: t("about_title"),
        subtitle: t("home_search_open_screen"),
        icon: "info-outline",
        route: "/about",
        historyValue: t("about_title"),
        score: 0,
      },
      {
        id: "page-help",
        type: "page",
        title: t("help_title"),
        subtitle: t("home_search_open_screen"),
        icon: "help-outline",
        route: "/help",
        historyValue: t("help_title"),
        score: 0,
      },
    ],
    [t]
  );

  const searchResults = useMemo(() => {
    if (!normalizedSearch || searchTokens.length === 0) {
      return [];
    }

    const matchedPages = pageSearchResults.reduce<SearchResult[]>((results, entry) => {
        const searchBlob = buildSearchBlob([
          entry.title,
          entry.subtitle,
          entry.historyValue,
          "scan diagnose disease leaf camera plant shop buy sell feedback help support account profile settings reminders care quick tip",
        ]);

        if (!queryMatches(searchBlob, searchTokens)) {
          return results;
        }

        results.push({
          ...entry,
          score: scoreSearchMatch(entry.title, searchBlob, normalizedSearch),
        });

        return results;
      }, []);

    const matchedPlants = trackedPlants.reduce<SearchResult[]>((results, plant) => {
        const plantId = plant.id || plant._id || plant.name;
        const searchBlob = buildSearchBlob([
          plant.name,
          plant.species,
          plant.location,
          plant.specificLocation,
          plant.info,
          plant.flowerCatalog,
          plant.wateringFrequency,
          ...(plant.badges || []),
        ]);

        if (!plantId || !queryMatches(searchBlob, searchTokens)) {
          return results;
        }

        results.push({
          id: `plant-${plantId}`,
          type: "plant" as const,
          title: plant.name,
          subtitle: [plant.species, plant.location].filter(Boolean).join(" - ") || t("home_search_saved_plant"),
          icon: "local-florist" as const,
          route: `/flower/${encodeURIComponent(plantId)}`,
          historyValue: plant.name,
          score: scoreSearchMatch(plant.name, searchBlob, normalizedSearch),
        });

        return results;
      }, []);

    return [...matchedPlants, ...matchedPages].sort((left, right) => right.score - left.score).slice(0, 6);
  }, [normalizedSearch, pageSearchResults, searchTokens, t, trackedPlants]);

  const executeSearchResult = async (result: SearchResult, sourceQuery: string) => {
    await storeSearchHistory(sourceQuery || result.historyValue);

    if (result.action === "scan") {
      setSearch("");
      await handleScan();
      return;
    }

    if (result.route) {
      setSearch("");
      router.push(result.route);
    }
  };

  const handleSearch = async () => {
    const query = search.trim();
    if (!query) {
      return;
    }

    const topResult = searchResults[0];
    if (!topResult) {
      Alert.alert(t("search_action"), t("home_search_no_results"));
      return;
    }

    await executeSearchResult(topResult, query);
  };

  const diagnosisColors = diagnosis ? getDiagnosisToneColors(diagnosis.tone) : null;

  return (
    // Render the dashboard cards, model status, scan result, and feedback carousel in one scrollable screen.
    <Screen contentStyle={styles.screenContent}>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Image source={brandAssets.logo} style={styles.logo} />
            <Text style={styles.headerTitle}>{greeting}</Text>
          </View>

          <View style={styles.headerActions}>
            <LanguageSelector />
            <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
              <MaterialIcons name="menu" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder={t("search_placeholder")}
            placeholderTextColor="#907FAD"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              void handleSearch();
            }}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => {
              void handleSearch();
            }}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>{t("search_action")}</Text>
          </Pressable>
        </View>

        {normalizedSearch ? (
          <View style={styles.searchPanel}>
            <View style={styles.searchPanelHeader}>
              <Text style={styles.searchPanelTitle}>{t("home_search_results_title")}</Text>
            </View>

            {searchResults.length === 0 ? (
              <View style={styles.searchEmptyState}>
                <MaterialIcons name="search-off" size={18} color={colors.textMuted} />
                <Text style={styles.searchEmptyText}>{t("home_search_no_results")}</Text>
              </View>
            ) : (
              searchResults.map((result) => (
                <Pressable
                  key={result.id}
                  onPress={() => {
                    void executeSearchResult(result, search.trim());
                  }}
                  style={styles.searchResultRow}
                >
                  <View style={styles.searchResultIcon}>
                    <MaterialIcons name={result.icon} size={18} color={colors.primaryDark} />
                  </View>

                  <View style={styles.searchResultCopy}>
                    <Text style={styles.searchResultTitle}>{result.title}</Text>
                    <Text style={styles.searchResultSubtitle}>{result.subtitle}</Text>
                  </View>

                  <View style={[styles.searchTypePill, result.type === "plant" ? styles.searchTypePillPlant : null]}>
                    <Text style={[styles.searchTypePillText, result.type === "plant" ? styles.searchTypePillTextPlant : null]}>
                      {result.type === "plant" ? t("home_search_plants_label") : t("home_search_pages_label")}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : searchHistory.length > 0 ? (
          <View style={styles.searchPanel}>
            <View style={styles.searchPanelHeader}>
              <Text style={styles.searchPanelTitle}>{t("home_search_recent_title")}</Text>
              <Pressable
                onPress={() => {
                  void clearSearchHistory();
                }}
                style={styles.searchClearButton}
              >
                <Text style={styles.searchClearButtonText}>{t("home_search_clear_recent")}</Text>
              </Pressable>
            </View>

            {searchHistory.map((entry) => (
              <Pressable key={entry} onPress={() => setSearch(entry)} style={styles.searchHistoryRow}>
                <MaterialIcons name="history" size={18} color={colors.textMuted} />
                <Text style={styles.searchHistoryText}>{entry}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {statusMessage ? (
          <View style={styles.statusBanner}>
            <MaterialIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.statusBannerText}>{statusMessage}</Text>
          </View>
        ) : null}

        {diagnosis && diagnosisColors ? (
          <View style={[styles.diagnosisAlert, { backgroundColor: diagnosisColors.bg }]}>
            <View style={styles.diagnosisCopyRow}>
              <MaterialIcons
                name={diagnosis.tone === "healthy" ? "verified" : "warning-amber"}
                size={26}
                color={diagnosisColors.iconColor}
              />
              <View style={styles.diagnosisCopy}>
                <Text style={[styles.diagnosisTitle, { color: diagnosisColors.title }]}>{diagnosis.title}</Text>
                <Text style={[styles.diagnosisBody, { color: diagnosisColors.body }]}>{diagnosis.message}</Text>
                {diagnosis.protection ? (
                  <Text style={styles.diagnosisProtectionText}>
                    <Text style={styles.diagnosisProtectionLabel}>{t("home_protection_label")} </Text>
                    {diagnosis.protection}
                  </Text>
                ) : null}
                {diagnosis.workingTime ? (
                  <Text style={styles.diagnosisWorkingText}>
                    <Text style={styles.diagnosisWorkingLabel}>{t("home_working_time_label")} </Text>
                    {diagnosis.workingTime}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable onPress={() => setDiagnosis(null)} style={styles.diagnosisClose}>
              <MaterialIcons name="close" size={16} color={diagnosisColors.iconColor} />
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t("todays_insights")}</Text>

        <View style={styles.cardsGrid}>
          <Pressable onPress={() => void handleScan()} style={[styles.insightCard, styles.yellowCard]}>
            <View style={styles.cardIconRow}>
              <View style={styles.cardIcon}>
                <MaterialIcons name="eco" size={18} color={colors.text} />
              </View>
              <View style={[styles.modelPill, modelState.loaded ? styles.modelPillReady : styles.modelPillOffline]}>
                <MaterialIcons name="show-chart" size={14} color={colors.white} />
                <Text style={styles.modelPillText}>{modelLabel}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{t("diagnose")}</Text>
            <Text style={styles.cardText}>{loading ? t("analyzing_realtime") : t("tap_to_scan_leaf")}</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/feedback")} style={[styles.insightCard, styles.purpleCard]}>
            <Text style={styles.cardTitle}>{t("feedback_card")}</Text>
            <Text style={styles.cardText}>{t("reviews", { count: feedbacks.length })}</Text>
          </Pressable>

            <Pressable onPress={() => router.push("/care")} style={[styles.insightCard, styles.greenCard]}>
              <Text style={styles.cardTitle}>{t("care_reminder_card")}</Text>
              <Text style={styles.cardText}>{t("home_care_hint")}</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/quicktip")} style={[styles.insightCard, styles.blueCard]}>
              <Text style={styles.cardTitle}>{t("quick_tip_card")}</Text>
              <Text style={styles.cardText}>{t("home_quick_tip_hint")}</Text>
            </Pressable>
        </View>

        <View style={styles.feedbackSection}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackHeading}>{t("user_feedback")}</Text>
            {feedbacks.length > 0 ? (
              <Text style={styles.feedbackCount}>
                {feedbackIndex + 1}/{feedbacks.length}
              </Text>
            ) : null}
          </View>

          {feedbacks.length === 0 ? (
            <View style={styles.emptyFeedbackBox}>
              <Text style={styles.emptyFeedbackText}>{t("no_feedback_yet")}</Text>
            </View>
          ) : (
            <View style={styles.feedbackSlideshow}>
              <Pressable onPress={prevFeedback} disabled={feedbacks.length <= 1} style={styles.slideButton}>
                <Text style={styles.slideButtonText}>{"<"}</Text>
              </Pressable>

              <View style={styles.slideshowContainer}>
                <View style={styles.feedbackTrack} {...feedbackPanResponder.panHandlers}>
                  <FeedbackCard feedback={feedbacks[feedbackIndex]} />
                </View>
              </View>

              <Pressable onPress={nextFeedback} disabled={feedbacks.length <= 1} style={styles.slideButton}>
                <Text style={styles.slideButtonText}>{">"}</Text>
              </Pressable>
            </View>
          )}

          {feedbacks.length > 1 ? (
            <View style={styles.feedbackDots}>
              {feedbacks.map((entry, index) => (
                <Pressable
                  key={`${entry.id}-${index}`}
                  onPress={() => setFeedbackIndex(index)}
                  style={[styles.dot, index === feedbackIndex ? styles.dotActive : null]}
                />
              ))}
            </View>
          ) : null}
        </View>

      </Animated.View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Screen shell, greeting row, and search bar.
  screenContent: {
    paddingBottom: spacing.sm,
  },
  headerCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  logo: {
    borderRadius: 18,
    height: 52,
    width: 52,
  },
  headerTitle: {
    color: colors.white,
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...shadows.soft,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: spacing.md,
    padding: 6,
    ...shadows.soft,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 86,
    paddingHorizontal: spacing.md,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  searchPanel: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 22,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  searchPanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  searchPanelTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  searchClearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  searchClearButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  searchEmptyState: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchEmptyText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  searchResultRow: {
    alignItems: "center",
    borderTopColor: "rgba(124,92,255,0.12)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchResultIcon: {
    alignItems: "center",
    backgroundColor: "#F2ECFF",
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  searchResultCopy: {
    flex: 1,
  },
  searchResultTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  searchResultSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 2,
  },
  searchTypePill: {
    backgroundColor: "#F0E9FF",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  searchTypePillPlant: {
    backgroundColor: "#E7F6EA",
  },
  searchTypePillText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },
  searchTypePillTextPlant: {
    color: "#1C6B47",
  },
  searchHistoryRow: {
    alignItems: "center",
    borderTopColor: "rgba(124,92,255,0.12)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchHistoryText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  statusBanner: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.soft,
  },
  statusBannerText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  // Diagnosis result alert.
  diagnosisAlert: {
    alignItems: "flex-start",
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    minHeight: 154,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.card,
  },
  diagnosisCopyRow: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  diagnosisCopy: {
    flex: 1,
  },
  diagnosisTitle: {
    fontSize: 19,
    fontWeight: "900",
  },
  diagnosisBody: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 6,
  },
  diagnosisProtectionText: {
    color: "#0F5F46",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 10,
  },
  diagnosisProtectionLabel: {
    color: "#0B7A4B",
    fontSize: 16,
    fontWeight: "900",
  },
  diagnosisWorkingText: {
    color: "#8A3F00",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 8,
  },
  diagnosisWorkingLabel: {
    color: "#B45309",
    fontSize: 16,
    fontWeight: "900",
  },
  diagnosisClose: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: radii.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: spacing.md,
  },

  // Quick action cards on the dashboard.
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  insightCard: {
    borderRadius: 22,
    marginBottom: spacing.sm,
    minHeight: 132,
    padding: spacing.md,
    width: "48.2%",
    ...shadows.soft,
  },
  yellowCard: {
    backgroundColor: "#FFE7A7",
  },
  purpleCard: {
    backgroundColor: "#E6D7FF",
  },
  greenCard: {
    backgroundColor: "#D7F4D6",
  },
  blueCard: {
    backgroundColor: "#D9F1FF",
  },
  cardIconRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.68)",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  modelPill: {
    alignItems: "center",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modelPillReady: {
    backgroundColor: colors.success,
  },
  modelPillOffline: {
    backgroundColor: colors.danger,
  },
  modelPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },

  // Feedback carousel and pagination.
  feedbackSection: {
    backgroundColor: "#E6D0F3",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  feedbackHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  feedbackCount: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptyFeedbackBox: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 110,
    padding: spacing.md,
  },
  emptyFeedbackText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  feedbackSlideshow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  slideButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  slideButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  slideshowContainer: {
    flex: 1,
  },
  feedbackTrack: {
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    minHeight: 145,
    padding: spacing.md,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackMessage: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  feedbackStars: {
    marginTop: spacing.md,
  },
  feedbackStarsText: {
    color: "#A07C00",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  feedbackDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "right",
  },
  feedbackDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  dot: {
    backgroundColor: "rgba(124, 92, 255, 0.26)",
    borderRadius: radii.pill,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.primaryDark,
    width: 20,
  },
});
