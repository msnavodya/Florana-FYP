// Register the Expo Router entry for the home route.
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";

import { Screen } from "../src/components/Screen";
import { useAuth } from "../src/context/AuthContext";
import { WelcomeScreen } from "../src/screens/WelcomeScreen";
import { colors, spacing } from "../src/theme/tokens";

export default function IndexRoute() {
  const { ready, token } = useAuth();

  if (!ready) {
    return (
      <Screen scroll={false} contentStyle={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.white} size="large" />
          <Text style={styles.loadingText}>Loading your Florana space...</Text>
        </View>
      </Screen>
    );
  }

  if (token) {
    return <Redirect href="/home" />;
  }

  return <WelcomeScreen />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
