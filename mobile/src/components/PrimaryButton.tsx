import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";

import { colors, radii, shadows, spacing } from "../theme/tokens";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: PrimaryButtonProps) {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.buttonCompact : null,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          compact ? styles.labelCompact : null,
          variant === "secondary" ? styles.secondaryLabel : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  buttonCompact: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  labelCompact: {
    fontSize: 15,
  },
  secondaryLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
