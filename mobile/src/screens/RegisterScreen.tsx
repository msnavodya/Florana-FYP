import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useAuth } from "../context/AuthContext";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const locations = ["Colombo", "Gampaha", "Kandy", "Galle", "Kurunegala", "Jaffna", "Matara", "Negombo", "Batticaloa"];

export function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setErrorMessage("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        contact: contact.trim() || null,
        location: location || null,
      });
      router.replace("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardArea}>
        <View style={styles.heroPanel}>
          <Text style={styles.heroBadge}>New Gardener</Text>
          <Text style={styles.heroCopy}>Create your Florana account and carry the full web experience into mobile.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Set up your Florana mobile account.</Text>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            <TextField label="Full Name" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
            <TextField label="Email" placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextField label="Password" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TextField label="Contact" placeholder="Contact Number" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.locationWrap}>
              {locations.map((item) => (
                <PrimaryButton
                  key={item}
                  label={item}
                  onPress={() => setLocation(item)}
                  variant={location === item ? "primary" : "secondary"}
                />
              ))}
            </View>
          </ScrollView>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <PrimaryButton label={loading ? "Signing Up..." : "Sign Up"} onPress={handleSignup} disabled={loading} />
          <PrimaryButton label="Back to Login" onPress={() => router.replace("/login")} variant="secondary" />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center" },
  keyboardArea: { flex: 1, justifyContent: "center" },
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
    backgroundColor: "rgba(255, 253, 248, 0.92)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: "92%",
    padding: spacing.lg,
    ...shadows.card,
  },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  form: { gap: spacing.md },
  fieldLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  locationWrap: { gap: spacing.sm, paddingBottom: spacing.sm },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
});
