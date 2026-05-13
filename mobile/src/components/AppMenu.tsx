// Render a reusable mobile UI component for App Menu.
import { MaterialIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const menuItems = [
  { path: "/home", labelKey: "nav_home", icon: "home" },
  { path: "/profile", labelKey: "nav_profile", icon: "person" },
  { path: "/catalog", labelKey: "nav_catalog", icon: "shopping-bag" },
  { path: "/sell", labelKey: "catalog_sell_plants", icon: "storefront" },
  { path: "/myplants", labelKey: "nav_my_plants", icon: "eco" },
  { path: "/care", labelKey: "nav_care", icon: "alarm" },
  { path: "/quicktip", labelKey: "nav_quick_tip", icon: "lightbulb" },
  { path: "/settings", labelKey: "nav_settings", icon: "settings" },
  { path: "/about", labelKey: "nav_about", icon: "info" },
  { path: "/help", labelKey: "nav_help", icon: "help" },
  { path: "/feedback", labelKey: "nav_feedback", icon: "chat" },
] as const;

interface AppMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function AppMenu({ visible, onClose }: AppMenuProps) {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  // Keep the drawer wide enough for labels without letting it sprawl on larger screens.
  const drawerWidth = Math.min(348, Math.max(288, width * 0.86));
  const translateX = useRef(new Animated.Value(360)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const closeDrawer = (afterClose?: () => void) => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: drawerWidth + spacing.lg,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        onClose();
        afterClose?.();
      }
    });
  };

  const goTo = (path: string) => {
    closeDrawer(() => {
      router.replace(path);
    });
  };

  const handleLogout = async () => {
    await signOut();
    closeDrawer(() => router.replace("/"));
  };

  useEffect(() => {
    // Keep the modal mounted long enough for the open and close animations to finish cleanly.
    const hiddenOffset = drawerWidth + spacing.lg;

    if (visible) {
      setMounted(true);
      translateX.setValue(hiddenOffset);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 24,
          mass: 0.9,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      translateX.setValue(hiddenOffset);
      overlayOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: hiddenOffset,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [drawerWidth, mounted, overlayOpacity, translateX, visible]);

  // Allow a horizontal swipe to dismiss the drawer without fighting vertical scrolling.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx > 0) {
            translateX.setValue(Math.min(gestureState.dx, drawerWidth + spacing.lg));
            overlayOpacity.setValue(Math.max(0, 1 - gestureState.dx / drawerWidth));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > drawerWidth * 0.28 || gestureState.vx > 0.8) {
            closeDrawer();
            return;
          }

          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              damping: 24,
              mass: 0.9,
              stiffness: 180,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [drawerWidth, overlayOpacity, translateX]
  );

  if (!mounted) {
    return null;
  }

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={() => closeDrawer()}>
      <View style={styles.overlayRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()} />
        </Animated.View>

        <View style={styles.drawerStage} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.drawerWrap,
              {
                transform: [{ translateX }],
                width: drawerWidth,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.container}>
              <Pressable accessibilityLabel={t("close_menu")} onPress={() => closeDrawer()} style={styles.closeButton}>
                <MaterialIcons name="close" size={18} color={colors.text} />
              </Pressable>

              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <Image source={brandAssets.logo} style={styles.logo} />
                  <View style={styles.headerText}>
                    <Text style={styles.headerBrand}>Florana</Text>
                    <Text style={styles.headerTitle}>{t("menu_title")}</Text>
                  </View>
                </View>

                <View style={styles.items}>
                  {menuItems.map((item) => {
                    const active = pathname === item.path;

                    return (
                      <Pressable
                        key={item.path}
                        onPress={() => goTo(item.path)}
                        style={[styles.item, active ? styles.itemActive : null]}
                      >
                        <View style={[styles.iconShell, active ? styles.iconShellActive : null]}>
                          <MaterialIcons
                            name={item.icon}
                            size={18}
                            color={active ? colors.white : colors.text}
                          />
                        </View>
                        <Text style={[styles.itemLabel, active ? styles.itemLabelActive : null]}>
                          {t(item.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable onPress={() => void handleLogout()} style={[styles.item, styles.logoutItem]}>
                    <View style={[styles.iconShell, styles.logoutIconShell]}>
                      <MaterialIcons name="logout" size={18} color={colors.white} />
                    </View>
                    <Text style={[styles.itemLabel, styles.logoutLabel]}>{t("nav_logout")}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
  },
  overlay: {
    backgroundColor: "rgba(16, 10, 29, 0.52)",
    ...StyleSheet.absoluteFillObject,
  },
  drawerStage: {
    alignItems: "flex-end",
    flex: 1,
    paddingBottom: spacing.lg,
    paddingRight: spacing.sm,
    paddingTop: spacing.xl,
  },
  drawerWrap: {
    height: "100%",
    maxWidth: 348,
  },
  container: {
    backgroundColor: "#F0D7FF",
    borderBottomLeftRadius: radii.xl,
    borderTopLeftRadius: radii.xl,
    height: "100%",
    padding: spacing.lg,
    ...shadows.card,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingBottom: spacing.lg,
  },
  closeButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 38,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: {
    borderRadius: 18,
    height: 52,
    width: 52,
  },
  headerText: {
    flex: 1,
  },
  headerBrand: {
    color: "#8A72B0",
    fontSize: 12,
    fontWeight: "700",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  items: {
    gap: spacing.sm,
  },
  item: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "rgba(115, 94, 153, 0.12)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D4B9FF",
  },
  iconShell: {
    alignItems: "center",
    backgroundColor: "#F6EEFF",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  iconShellActive: {
    backgroundColor: colors.primaryDark,
  },
  itemLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  itemLabelActive: {
    color: colors.primaryDark,
  },
  logoutItem: {
    backgroundColor: colors.backgroundDeep,
    borderWidth: 0,
    marginTop: spacing.sm,
  },
  logoutIconShell: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  logoutLabel: {
    color: colors.white,
  },
});
