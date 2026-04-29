import { Stack } from "expo-router";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AuthProvider } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { SettingsProvider } from "../src/context/SettingsContext";
import { colors } from "../src/theme/tokens";

export default function RootLayout() {
  useEffect(() => {
    if (Constants.executionEnvironment === "storeClient") {
      return;
    }

    try {
      const Notifications = require("expo-notifications") as typeof import("expo-notifications");
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.warn("Notification setup skipped:", error);
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <SettingsProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
          </CartProvider>
        </SettingsProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
