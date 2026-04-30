import { Children, isValidElement } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, viewport } from "../theme/tokens";

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const framed = width >= 768;
  const handsetFrame = !framed && width >= 480;
  const childArray = Children.toArray(children);
  const bottomNavChild = childArray.find((child) => {
    if (!isValidElement(child)) {
      return false;
    }

    const childType = child.type as { displayName?: string; name?: string };
    return childType.displayName === "BottomNav" || childType.name === "BottomNav";
  });
  const mainChildren = childArray.filter((child) => child !== bottomNavChild);

  const contentBody = (
    <View
      style={[
        styles.content,
        framed ? styles.contentFramed : null,
        {
          padding: compact ? 14 : spacing.lg,
          paddingBottom: compact ? spacing.md : spacing.lg,
        },
        contentStyle,
      ]}
    >
      {mainChildren}
    </View>
  );

  const viewportBody = (
    <View style={styles.viewportBody}>
      {scroll ? (
        <ScrollView
          style={styles.scrollViewport}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {contentBody}
        </ScrollView>
      ) : (
        <View style={styles.nonScrollContent}>{contentBody}</View>
      )}
      {bottomNavChild}
    </View>
  );

  const content = (
    <View
      style={[
        styles.frame,
        handsetFrame
          ? {
              maxWidth: viewport.frameWidth,
              minHeight: viewport.frameHeight,
            }
          : null,
        framed ? styles.frameDesktop : null,
      ]}
    >
      {framed ? (
        <>
          <View style={styles.notch} />
          <View style={styles.sideButtonLeft} />
          <View style={styles.sideButtonTopRight} />
          <View style={styles.sideButtonBottomRight} />
          <Text style={styles.frameLabel}>FLORANA MOBILE</Text>
        </>
      ) : null}
      {viewportBody}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backdrop}>
        <View style={styles.glowLarge} />
        <View style={styles.glowSmall} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <View
          style={[
            styles.scroll,
            {
              paddingHorizontal: compact ? spacing.xs : spacing.sm,
              paddingVertical: compact ? 6 : spacing.sm,
            },
          ]}
        >
          {content}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardArea: {
    flex: 1,
    minHeight: 0,
  },
  glowLarge: {
    backgroundColor: colors.accent,
    borderRadius: 160,
    height: 320,
    opacity: 0.28,
    position: "absolute",
    right: -120,
    top: -70,
    width: 320,
  },
  glowSmall: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 120,
    bottom: 110,
    height: 200,
    left: -70,
    opacity: 0.42,
    position: "absolute",
    width: 200,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  frame: {
    alignSelf: "center",
    flex: 1,
    maxWidth: 520,
    minHeight: 0,
    width: "100%",
  },
  frameDesktop: {
    backgroundColor: "#1E1629",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 42,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    paddingTop: 30,
    position: "relative",
    shadowColor: "#150F22",
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 12,
  },
  notch: {
    alignSelf: "center",
    backgroundColor: "#120C1E",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    height: 24,
    position: "absolute",
    top: 0,
    width: 150,
    zIndex: 2,
  },
  sideButtonLeft: {
    backgroundColor: "#120C1E",
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 6,
    height: 56,
    left: -4,
    position: "absolute",
    top: 150,
    width: 4,
  },
  sideButtonTopRight: {
    backgroundColor: "#120C1E",
    borderBottomRightRadius: 6,
    borderTopRightRadius: 6,
    height: 44,
    position: "absolute",
    right: -4,
    top: 138,
    width: 4,
  },
  sideButtonBottomRight: {
    backgroundColor: "#120C1E",
    borderBottomRightRadius: 6,
    borderTopRightRadius: 6,
    height: 72,
    position: "absolute",
    right: -4,
    top: 196,
    width: 4,
  },
  frameLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    position: "absolute",
    right: 20,
    top: 10,
  },
  content: {
    flexGrow: 1,
  },
  contentFramed: {
    backgroundColor: colors.background,
    borderRadius: 28,
  },
  viewportBody: {
    backgroundColor: colors.background,
    borderRadius: 28,
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  scrollViewport: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  nonScrollContent: {
    flex: 1,
    minHeight: 0,
  },
});
