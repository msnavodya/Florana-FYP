import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";

import { colors, spacing } from "../theme/tokens";

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const framed = width >= 768;

  const content = (
    <View style={[styles.frame, framed ? styles.frameDesktop : null]}>
      {framed ? (
        <>
          <View style={styles.notch} />
          <View style={styles.sideButtonLeft} />
          <View style={styles.sideButtonTopRight} />
          <View style={styles.sideButtonBottomRight} />
          <Text style={styles.frameLabel}>FLORANA MOBILE</Text>
        </>
      ) : null}
      <View
        style={[
          styles.content,
          framed ? styles.contentFramed : null,
          {
            padding: compact ? spacing.md : spacing.lg,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
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
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingHorizontal: compact ? spacing.xs : spacing.sm,
                paddingVertical: compact ? spacing.xs : spacing.sm,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.scroll,
              {
                paddingHorizontal: compact ? spacing.xs : spacing.sm,
                paddingVertical: compact ? spacing.xs : spacing.sm,
              },
            ]}
          >
            {content}
          </View>
        )}
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
    flexGrow: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  frame: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: 460,
    width: "100%",
  },
  frameDesktop: {
    backgroundColor: "#1F1631",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 38,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
    paddingTop: 28,
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
    minHeight: "100%",
  },
});
