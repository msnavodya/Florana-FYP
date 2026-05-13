// Render a reusable mobile UI component for Bottom Nav.
import { MaterialIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { colors, radii, shadows, spacing } from "../theme/tokens";

type NavItem = {
  key: string;
  labelKey: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  matches: string[];
};

const navItems: NavItem[] = [
  { key: "home", labelKey: "nav_home", icon: "home-filled", route: "/home", matches: ["/home"] },
  { key: "catalog", labelKey: "nav_catalog", icon: "inventory-2", route: "/catalog", matches: ["/catalog", "/product", "/season"] },
  { key: "cart", labelKey: "nav_cart", icon: "shopping-cart", route: "/cart", matches: ["/cart"] },
  {
    key: "account",
    labelKey: "account",
    icon: "person",
    route: "/profile",
    matches: ["/profile", "/settings", "/myplants", "/about", "/help", "/feedback", "/flower", "/plant-register", "/care", "/quicktip"],
  },
];

// Match both exact routes and nested detail pages to the same bottom-navigation tab.
function isActivePath(pathname: string, matches: string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();
  const { t } = useLanguage();

  // Keep the safe-area padding outside the visual nav pill so the buttons stay centered.
  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.matches);

          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(item.route)}
              style={({ pressed }) => [
                styles.item,
                active ? styles.itemActive : null,
                pressed ? styles.itemPressed : null,
              ]}
            >
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={active ? colors.primaryDark : colors.textMuted}
                />
                {item.key === "cart" && totalItems > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems > 99 ? "99+" : totalItems}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, active ? styles.labelActive : null]}>{t(item.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

BottomNav.displayName = "BottomNav";

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  navBar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "rgba(120,95,177,0.14)",
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
    minHeight: 74,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  item: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    gap: 6,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  itemActive: {
    backgroundColor: colors.accentSoft,
  },
  itemPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    position: "relative",
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    borderColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 2,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: 5,
    position: "absolute",
    right: -12,
    top: -8,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
});
