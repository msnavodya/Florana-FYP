import { router } from "expo-router";
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
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const menuItems = [
  { label: "Home", route: "/home" },
  { label: "Profile", route: "/profile" },
  { label: "Catalog", route: "/catalog" },
  { label: "My Plants", route: "/myplants" },
  { label: "Care Reminder", route: "/care" },
  { label: "Quick Tip", route: "/quicktip" },
  { label: "Settings", route: "/settings" },
  { label: "About", route: "/about" },
  { label: "Help", route: "/help" },
  { label: "Feedback", route: "/feedback" },
];

interface AppMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function AppMenu({ visible, onClose }: AppMenuProps) {
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const drawerWidth = Math.min(340, Math.max(280, width * 0.84));
  const translateX = useRef(new Animated.Value(360)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const closeDrawer = () => {
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
      }
    });
  };

  const handleLogout = async () => {
    await signOut();
    closeDrawer();
    router.replace("/");
  };

  useEffect(() => {
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
    <Modal transparent animationType="none" visible={mounted} onRequestClose={closeDrawer}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
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
            <View style={styles.sheet}>
              <View style={styles.grabber} />

              <View style={styles.header}>
                <Image source={brandAssets.logo} style={styles.logo} />
                <View style={styles.headerText}>
                  <Text style={styles.eyebrow}>Florana</Text>
                  <Text style={styles.heading}>Menu</Text>
                  <Text style={styles.subheading}>Swipe right or scroll to view all items</Text>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              >
                {menuItems.map((item) => (
                  <Pressable
                    key={item.route}
                    onPress={() => {
                      closeDrawer();
                      router.push(item.route);
                    }}
                    style={styles.item}
                  >
                    <Text style={styles.itemText}>{item.label}</Text>
                  </Pressable>
                ))}

                <Pressable onPress={() => void handleLogout()} style={[styles.item, styles.logoutItem]}>
                  <Text style={[styles.itemText, styles.logoutText]}>Logout</Text>
                </Pressable>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
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
    maxWidth: 340,
  },
  sheet: {
    backgroundColor: "#F0D7FF",
    borderBottomLeftRadius: radii.xl,
    borderTopLeftRadius: radii.xl,
    gap: spacing.md,
    height: "100%",
    padding: spacing.lg,
    ...shadows.card,
  },
  grabber: {
    alignSelf: "center",
    backgroundColor: "rgba(74, 56, 110, 0.22)",
    borderRadius: radii.pill,
    height: 5,
    marginBottom: spacing.xs,
    width: 52,
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgba(94, 78, 126, 0.12)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  logo: {
    borderRadius: 18,
    height: 52,
    width: 52,
  },
  eyebrow: {
    color: "#8A72B0",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  subheading: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  item: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderColor: "rgba(115, 94, 153, 0.12)",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  itemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  logoutItem: {
    backgroundColor: colors.backgroundDeep,
    borderWidth: 0,
  },
  logoutText: {
    color: colors.white,
  },
});
