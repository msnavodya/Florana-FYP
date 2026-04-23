import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, shadows, spacing } from "../theme/tokens";

const items = [
  { label: "Home", route: "/home" },
  { label: "Catalog", route: "/catalog" },
  { label: "Cart", route: "/cart" },
  { label: "Profile", route: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = pathname === item.route;
        return (
          <Pressable key={item.route} onPress={() => router.replace(item.route)} style={[styles.item, active ? styles.activeItem : null]}>
            <Text style={[styles.text, active ? styles.activeText : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: spacing.sm,
    ...shadows.card,
  },
  item: {
    alignItems: "center",
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  activeItem: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  text: {
    color: "#CFC1E8",
    fontSize: 12,
    fontWeight: "700",
  },
  activeText: {
    color: colors.white,
  },
});
