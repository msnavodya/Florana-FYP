import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { API_URL } from "../lib/api/client";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

export function LoginScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { ready, token, signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (ready && token) {
      router.replace("/home");
    }
  }, [ready, token]);

  const emailError = useMemo(() => {
    if (!email) {
      return "";
    }

    return /\S+@\S+\.\S+/.test(email.trim()) ? "" : t("valid_email_error");
  }, [email, t]);

  const passwordError = useMemo(() => {
    if (!password) {
      return "";
    }

    return password.trim().length >= 6 ? "" : t("password_min_error");
  }, [password, t]);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage(t("login_missing_fields"));
      return;
    }

    if (emailError || passwordError) {
      setErrorMessage(t("login_fix_fields"));
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("backend_unreachable");
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <View style={[styles.heroPanel, compact ? styles.heroPanelCompact : null]}>
          <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.heroBadge}>{t("login_badge")}</Text>
          <Text style={[styles.heroCopy, compact ? styles.heroCopyCompact : null]}>{t("login_hero_copy")}</Text>
        </View>
        <View style={[styles.card, compact ? styles.cardCompact : null]}>
          <Text style={styles.eyebrow}>{t("login_eyebrow")}</Text>
          <Text style={[styles.title, compact ? styles.titleCompact : null]}>{t("login_title")}</Text>
          <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>{t("login_subtitle")}</Text>
          <Text style={styles.endpointText}>Backend: {API_URL}</Text>

          <View style={styles.form}>
            <TextField
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
              keyboardType="email-address"
              label={t("email")}
              onChangeText={setEmail}
              placeholder={t("email_placeholder")}
              value={email}
            />
            <View style={styles.passwordField}>
              <TextField
                autoCapitalize="none"
                autoComplete="password"
                error={passwordError}
                label={t("password")}
                onChangeText={setPassword}
                placeholder={t("password_placeholder")}
                secureTextEntry={!passwordVisible}
                value={password}
              />
              <Pressable onPress={() => setPasswordVisible((current) => !current)} style={styles.passwordToggle}>
                <Text style={styles.passwordToggleText}>{passwordVisible ? t("hide") : t("show")}</Text>
              </Pressable>
            </View>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <PrimaryButton
            disabled={!ready || loading}
            label={loading ? t("signing_in") : t("log_in")}
            onPress={handleLogin}
          />

          {!ready ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>{t("restoring_session")}</Text>
            </View>
          ) : null}

          <PrimaryButton label={t("create_account")} onPress={() => router.push("/register")} variant="secondary" />
          <PrimaryButton label={t("back")} onPress={() => router.back()} variant="secondary" />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center",
  },
  keyboardArea: {
    flex: 1,
    justifyContent: "center",
  },
  heroPanel: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 42,
    ...shadows.soft,
  },
  heroPanelCompact: {
    marginBottom: spacing.sm,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: "uppercase",
  },
  heroCopy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroCopyCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "rgba(255, 253, 248, 0.9)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardCompact: {
    borderRadius: 20,
    gap: spacing.sm,
    padding: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: 25,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  endpointText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  form: {
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  passwordField: {
    position: "relative",
  },
  passwordToggle: {
    bottom: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "absolute",
    right: 8,
  },
  passwordToggleText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
