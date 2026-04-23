import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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

  const content = (
    <View style={styles.frame}>
      <View
        style={[
          styles.content,
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
  content: {
    flexGrow: 1,
  },
});
