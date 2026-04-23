import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export function ProfileScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <Screen>
      <TopBar title="Your Profile" subtitle="Florana account details" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.profileCard}>
        <Text style={styles.row}><Text style={styles.label}>User ID:</Text> {user?.id || user?._id || "00123"}</Text>
        <Text style={styles.row}><Text style={styles.label}>Name:</Text> {user?.full_name || "Sandy"}</Text>
        <Text style={styles.row}><Text style={styles.label}>Email:</Text> {user?.email || "sandy@email.com"}</Text>
        <Text style={styles.row}><Text style={styles.label}>Contact:</Text> {user?.contact || "Not set"}</Text>
        <Text style={styles.row}><Text style={styles.label}>Location:</Text> {user?.location || "Not set"}</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Register New Plant" onPress={() => router.push("/plant-register")} />
        <PrimaryButton label="Browse Catalog" onPress={() => router.replace("/catalog")} variant="secondary" />
        <PrimaryButton label="Log Out" onPress={() => void handleLogout()} variant="secondary" />
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radii.xl,
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  row: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  actions: {
    gap: spacing.sm,
  },
});
