import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";

import { AuthProvider } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { SettingsProvider } from "../src/context/SettingsContext";
import { colors } from "../src/theme/tokens";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
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
