import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { storageKeys } from "../lib/storage/keys";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

type StoredPlant = {
  id?: string | number;
  name?: string;
};

type StoredUser = {
  id?: string;
  _id?: string;
  full_name?: string;
  name?: string;
  email?: string;
};

type ProfileStats = {
  plantCount: number;
  reminderCount: number;
  lastSync: string;
};

export function ProfileScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const [menuOpen, setMenuOpen] = useState(false);
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    plantCount: 0,
    reminderCount: 0,
    lastSync: "",
  });
  const { user } = useAuth();
  const { reminders } = useSettings();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userRaw = await AsyncStorage.getItem(storageKeys.user);
        const plantsRaw = await AsyncStorage.getItem("plants");

        const parsedUser = userRaw ? (JSON.parse(userRaw) as StoredUser) : null;
        const parsedPlants = plantsRaw ? (JSON.parse(plantsRaw) as StoredPlant[]) : [];
        const activeOptions = Object.values(reminders.options || {}).filter(Boolean).length;
        const reminderNotes = reminders.customNotes?.length || 0;

        setStoredUser(parsedUser);
        setProfileStats({
          plantCount: Array.isArray(parsedPlants) ? parsedPlants.length : 0,
          reminderCount: activeOptions + reminderNotes,
          lastSync: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      } catch {
        setStoredUser(null);
        setProfileStats({
          plantCount: 0,
          reminderCount: Object.values(reminders.options || {}).filter(Boolean).length + (reminders.customNotes?.length || 0),
          lastSync: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    };

    void loadProfile();
  }, [reminders]);

  const displayName = user?.full_name || storedUser?.full_name || storedUser?.name || "Guest Gardener";
  const displayEmail = user?.email || storedUser?.email || "guest@florana.app";
  const displayId = user?.id || user?._id || storedUser?.id || storedUser?._id || "demo-001";

  const initials = useMemo(() => {
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "FG"
    );
  }, [displayName]);

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>{"<"}</Text>
        </Pressable>

        <View style={[styles.headerCard, compact ? styles.headerCardCompact : null]}>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <Text style={styles.headerSubtitle}>
            A cleaner mobile view of your account, plant activity, and quick actions.
          </Text>
        </View>

        <Pressable accessibilityLabel="Open menu" onPress={() => setMenuOpen(true)} style={styles.iconButton}>
          <MaterialIcons name="menu" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.profileHero, compact ? styles.profileHeroCompact : null]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Florana Account</Text>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{displayEmail}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.sageIcon]}>
            <MaterialIcons name="eco" size={18} color="#285D48" />
          </View>
          <Text style={styles.statValue}>{profileStats.plantCount}</Text>
          <Text style={styles.statLabel}>Tracked plants</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.lavenderIcon]}>
            <MaterialIcons name="notifications-active" size={18} color="#604B8A" />
          </View>
          <Text style={styles.statValue}>{profileStats.reminderCount}</Text>
          <Text style={styles.statLabel}>Active reminders</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.cardHeading}>
          <MaterialIcons name="person" size={18} color={colors.text} />
          <Text style={styles.cardHeadingText}>Account details</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>User ID</Text>
          <Text style={styles.detailValue}>{displayId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Full name</Text>
          <Text style={styles.detailValue}>{displayName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{displayEmail}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.cardHeading}>
          <MaterialIcons name="schedule" size={18} color={colors.text} />
          <Text style={styles.cardHeadingText}>Live app status</Text>
        </View>

        <Text style={styles.liveText}>
          Your local Florana session is active. Reminder settings and profile details are loading from saved app data in
          real time.
        </Text>

        <View style={styles.liveFooter}>
          <Text style={styles.detailLabel}>Last synced</Text>
          <Text style={styles.detailValue}>{profileStats.lastSync || "--:--"}</Text>
        </View>
      </View>

      <View style={styles.actionStack}>
        <Pressable onPress={() => router.push("/plant-register")} style={styles.primaryAction}>
          <MaterialIcons name="add" size={16} color={colors.white} />
          <Text style={styles.primaryActionText}>Register New Plant</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/care")} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Open Care Reminder</Text>
        </Pressable>
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconButton: {
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
  iconButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  headerCard: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.xl,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerCardCompact: {
    borderRadius: 22,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  profileHero: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  profileHeroCompact: {
    padding: spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#DCC7FF",
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarText: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: "900",
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  heroEmail: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    flex: 1,
    padding: spacing.md,
    ...shadows.soft,
  },
  statIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 36,
  },
  sageIcon: {
    backgroundColor: "#D8F1E5",
  },
  lavenderIcon: {
    backgroundColor: "#E8DEFF",
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardHeadingText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
    marginLeft: spacing.md,
    textAlign: "right",
  },
  liveText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  liveFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  actionStack: {
    gap: spacing.sm,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    ...shadows.soft,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    ...shadows.soft,
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
