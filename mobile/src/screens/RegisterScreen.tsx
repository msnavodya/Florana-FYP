// Render the mobile Register screen.
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

const locations = ["Colombo", "Gampaha", "Kandy", "Galle", "Kurunegala", "Jaffna", "Matara", "Negombo", "Batticaloa"];

export function RegisterScreen() {
  // Switch to a tighter layout on small devices so the form stays comfortable to scroll.
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;

  // Form state and shared app helpers.
  const { signUp, setAuthNotice } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Validate the email format after the user starts typing.
  const emailError = useMemo(() => {
    if (!email) {
      return "";
    }

    return /\S+@\S+\.\S+/.test(email.trim()) ? "" : t("valid_email_error");
  }, [email, t]);

  // Require at least six characters before the password is considered usable.
  const passwordError = useMemo(() => {
    if (!password) {
      return "";
    }

    return password.trim().length >= 6 ? "" : t("use_six_or_more");
  }, [password, t]);

  // Allow common phone formats while still catching obviously invalid values.
  const contactError = useMemo(() => {
    if (!contact.trim()) {
      return "";
    }

    return /^[0-9+\-\s]{7,15}$/.test(contact.trim()) ? "" : t("valid_phone_error");
  }, [contact, t]);

  // Derive progress, readiness, and a simple password-strength label for the UI.
  const completedFields = [fullName.trim(), email.trim(), password.trim(), location.trim()].filter(Boolean).length;
  const formReady = Boolean(fullName.trim() && email.trim() && password.trim() && !emailError && !passwordError && !contactError);
  const passwordStrength = password.trim().length >= 10 ? t("strength_strong") : password.trim().length >= 6 ? t("strength_good") : t("strength_weak");

  // Submit the registration request once the form passes the local checks.
  const handleSignup = async () => {
    setErrorMessage("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage(t("register_missing_fields"));
      return;
    }

    if (emailError || passwordError || contactError) {
      setErrorMessage(t("register_fix_fields"));
      return;
    }

    setLoading(true);
    try {
      // Create the account and move directly into the signed-in home experience.
      await signUp({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        contact: contact.trim() || null,
        location: location || null,
      });
      setAuthNotice(t("account_saved_body"));
      router.replace("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("register_failed"));
    } finally {
      setLoading(false);
    }
  };

  // Render the mobile Register screen and its main interactive sections.
  return (
    <Screen contentStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardArea}>
        <View style={[styles.heroPanel, compact ? styles.heroPanelCompact : null]}>
          <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.heroBadge}>{t("register_badge")}</Text>
          <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>{t("register_hero_title")}</Text>
          <Text style={styles.heroCopy}>{t("register_hero_copy")}</Text>
        </View>

        <View style={[styles.card, compact ? styles.cardCompact : null]}>
          <View style={styles.headerRow}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, compact ? styles.titleCompact : null]}>{t("register_card_title")}</Text>
              <Text style={styles.subtitle}>{t("register_card_subtitle")}</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressValue}>{completedFields}/4</Text>
              <Text style={styles.progressLabel}>{t("ready")}</Text>
            </View>
          </View>

          <View style={styles.securityBanner}>
            <View style={styles.securityDot} />
            <Text style={styles.securityText}>{t("security_banner")}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t("profile")}</Text>
              <Text style={styles.sectionHint}>{t("required")}</Text>
            </View>

            <TextField
              autoCapitalize="words"
              label={t("full_name")}
              placeholder={t("full_name_placeholder")}
              value={fullName}
              onChangeText={setFullName}
              helperText={t("full_name_helper")}
            />

            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              label={t("email")}
              placeholder={t("email_address_placeholder")}
              value={email}
              onChangeText={setEmail}
              error={emailError}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t("security")}</Text>
              <Text style={styles.sectionHint}>{t("required")}</Text>
            </View>

            <View style={styles.passwordField}>
              <TextField
                label={t("password")}
                placeholder={t("create_password_placeholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                error={passwordError}
                helperText={!passwordError ? t("use_six_or_more") : undefined}
              />
              <Pressable onPress={() => setPasswordVisible((current) => !current)} style={styles.passwordToggle}>
                <Text style={styles.passwordToggleText}>{passwordVisible ? t("hide") : t("show")}</Text>
              </Pressable>
            </View>

            {password.trim() ? (
              <View style={styles.passwordMetaRow}>
                <Text style={styles.passwordMetaLabel}>{t("password_strength")}</Text>
                <Text
                  style={[
                    styles.passwordStrength,
                    passwordStrength === t("strength_strong")
                      ? styles.passwordStrengthStrong
                      : passwordStrength === t("strength_good")
                        ? styles.passwordStrengthGood
                        : styles.passwordStrengthWeak,
                  ]}
                >
                  {passwordStrength}
                </Text>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t("optional_details")}</Text>
              <Text style={styles.sectionHint}>{t("recommended")}</Text>
            </View>

            <TextField
              label={t("contact")}
              placeholder={t("contact_placeholder")}
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
              error={contactError}
              helperText={!contactError ? t("contact_helper") : undefined}
            />

            <Text style={styles.fieldLabel}>{t("location")}</Text>
            <View style={styles.locationWrap}>
              <Pressable onPress={() => setLocationMenuOpen((current) => !current)} style={[styles.locationSelect, locationMenuOpen ? styles.locationSelectOpen : null]}>
                <Text style={[styles.locationSelectText, !location ? styles.locationPlaceholder : null]}>
                  {location || t("select_location")}
                </Text>
                <Text style={styles.locationChevron}>{locationMenuOpen ? "^" : "v"}</Text>
              </Pressable>

              {locationMenuOpen ? (
                <View style={styles.locationMenu}>
                  {locations.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setLocation(item);
                        setLocationMenuOpen(false);
                      }}
                      style={[styles.locationOption, location === item ? styles.locationOptionActive : null]}
                    >
                      <Text style={[styles.locationOptionText, location === item ? styles.locationOptionTextActive : null]}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.footer}>
            <Text style={styles.footerNote}>{t("register_footer_note")}</Text>
            <PrimaryButton label={loading ? t("creating_account") : t("create_account")} onPress={handleSignup} disabled={loading || !formReady} />
            <PrimaryButton label={t("already_have_account")} onPress={() => router.replace("/login")} variant="secondary" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Screen layout shell.
  screen: { justifyContent: "center" },
  keyboardArea: { flex: 1, justifyContent: "center" },

  // Intro hero.
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
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  heroCopy: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 22,
  },

  // Main registration card.
  card: {
    backgroundColor: "rgba(255, 253, 248, 0.94)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: "92%",
    padding: spacing.lg,
    ...shadows.card,
  },
  cardCompact: {
    padding: spacing.md,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  progressBadge: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    minWidth: 68,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  progressValue: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "800",
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  securityBanner: {
    alignItems: "center",
    backgroundColor: "rgba(230, 215, 255, 0.5)",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  securityDot: {
    backgroundColor: colors.success,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  securityText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: 26,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },

  // Form layout, section labels, and password helper rows.
  form: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  passwordField: {
    position: "relative",
  },
  passwordMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  passwordMetaLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  passwordStrength: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  passwordStrengthWeak: {
    color: colors.danger,
  },
  passwordStrengthGood: {
    color: colors.primaryDark,
  },
  passwordStrengthStrong: {
    color: colors.success,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  // Custom location dropdown.
  locationWrap: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  locationSelect: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  locationSelectOpen: {
    borderColor: colors.primary,
  },
  locationSelectText: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
  },
  locationPlaceholder: {
    color: colors.textMuted,
  },
  locationChevron: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  locationMenu: {
    backgroundColor: "rgba(255, 253, 248, 0.98)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.soft,
  },
  locationOption: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  locationOptionActive: {
    backgroundColor: colors.accentSoft,
  },
  locationOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  locationOptionTextActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },

  // Inline validation feedback.
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },

  // Footer actions and password toggle.
  footer: {
    gap: spacing.sm,
  },
  footerNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
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
});
