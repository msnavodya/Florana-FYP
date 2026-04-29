import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useLanguage } from "../context/LanguageContext";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const options = [
  { code: "EN", label: "English", key: "language_english" },
  { code: "SI", label: "Sinhala", key: "language_sinhala" },
  { code: "TA", label: "Tamil", key: "language_tamil" },
] as const;

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const selected = options.find((item) => item.label === language) || options[0];

  return (
    <>
      <Pressable accessibilityLabel={t("language")} onPress={() => setOpen(true)} style={styles.selector}>
        <Text style={styles.icon}>A</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{selected.code}</Text>
        </View>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={styles.overlay}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.menu}>
            {options.map((item) => {
              const active = item.label === language;

              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    void setLanguage(item.label);
                    setOpen(false);
                  }}
                  style={[styles.option, active ? styles.activeOption : null]}
                >
                  <Text style={styles.optionCode}>{item.code}</Text>
                  <Text style={[styles.optionText, active ? styles.activeOptionText : null]}>{t(item.key)}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(112, 93, 148, 0.16)",
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    position: "relative",
    width: 32,
    ...shadows.soft,
  },
  icon: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
  },
  codeBadge: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    bottom: -2,
    justifyContent: "center",
    minWidth: 13,
    paddingHorizontal: 3,
    position: "absolute",
    right: -2,
  },
  codeText: {
    color: "#000000",
    fontSize: 7,
    fontWeight: "700",
    lineHeight: 12,
  },
  overlay: {
    backgroundColor: "rgba(16, 10, 29, 0.22)",
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingTop: 72,
  },
  menu: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: 180,
    padding: spacing.sm,
    ...shadows.card,
  },
  option: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  activeOption: {
    backgroundColor: "rgba(240, 234, 255, 0.92)",
  },
  optionCode: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 24,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  activeOptionText: {
    color: colors.primaryDark,
  },
});
