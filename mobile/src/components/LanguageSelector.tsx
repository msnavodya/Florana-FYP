// Render a reusable mobile UI component for Language Selector.
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { availableLanguages, languageNameKeyMap, useLanguage } from "../context/LanguageContext";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const codeMap = {
  English: "EN",
  Sinhala: "SI",
  Tamil: "TA",
  Spanish: "ES",
  French: "FR",
  Arabic: "AR",
  Hindi: "HI",
  Chinese: "ZH",
} as const;

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  // Keep the trigger compact by showing a short code instead of the full language label.
  const selectedCode = codeMap[language];

  return (
    <>
      <Pressable accessibilityLabel={t("language")} onPress={() => setOpen(true)} style={styles.selector}>
        <Text style={styles.icon}>A</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{selectedCode}</Text>
        </View>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={styles.overlay}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.menu}>
            {availableLanguages.map((item) => {
              const active = item === language;

              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    void setLanguage(item);
                    setOpen(false);
                  }}
                  style={[styles.option, active ? styles.activeOption : null]}
                >
                  <Text style={styles.optionCode}>{codeMap[item]}</Text>
                  <Text style={[styles.optionText, active ? styles.activeOptionText : null]}>
                    {t(languageNameKeyMap[item])}
                  </Text>
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
