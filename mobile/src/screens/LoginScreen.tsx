import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api/client";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export function LoginScreen() {
  const { ready, token, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && token) {
      router.replace("/home");
    }
  }, [ready, token]);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect to the backend.";
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
        <View style={styles.heroPanel}>
          <Text style={styles.heroBadge}>Florana Login</Text>
          <Text style={styles.heroCopy}>Welcome back to your garden workspace.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Mobile sign in</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Using backend at {API_URL}</Text>

          <View style={styles.form}>
            <TextField
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="demo@florana.com"
              value={email}
            />
            <TextField
              autoCapitalize="none"
              autoComplete="password"
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <PrimaryButton
            disabled={!ready || loading}
            label={loading ? "Signing In..." : "Log In"}
            onPress={handleLogin}
          />

          {!ready ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Restoring previous session...</Text>
            </View>
          ) : null}

          <PrimaryButton label="Create Account" onPress={() => router.push("/register")} variant="secondary" />
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
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
  card: {
    backgroundColor: "rgba(255, 253, 248, 0.9)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
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
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
    marginVertical: spacing.sm,
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
