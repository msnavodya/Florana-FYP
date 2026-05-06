import { StyleSheet, Text, TextInput, View, useWindowDimensions, type TextInputProps } from "react-native";

import { useSettings } from "../context/SettingsContext";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
}

export function TextField({ label, error, helperText, ...props }: TextFieldProps) {
  const { height, width } = useWindowDimensions();
  const { fontScale } = useSettings();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const message = error || helperText;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, compact ? styles.labelCompact : null, { fontSize: (compact ? 13 : 14) * fontScale }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, compact ? styles.inputCompact : null, { fontSize: (compact ? 15 : 16) * fontScale }, error ? styles.inputError : null]}
        {...props}
      />
      {message ? (
        <Text style={[styles.message, { fontSize: 12 * fontScale }, error ? styles.messageError : styles.messageHelper]}>
          {message}
        </Text>
      ) : null}
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
  labelCompact: {
    fontSize: 13,
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
    fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 2,
  },
  messageHelper: {
    color: colors.textMuted,
  },
  messageError: {
    color: colors.danger,
    fontWeight: "600",
  },
});
