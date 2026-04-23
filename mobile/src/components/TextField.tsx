import { StyleSheet, Text, TextInput, View, useWindowDimensions, type TextInputProps } from "react-native";

import { colors, radii, shadows, spacing } from "../theme/tokens";

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, ...props }: TextFieldProps) {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, compact ? styles.inputCompact : null]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  inputCompact: {
    minHeight: 48,
  },
});
