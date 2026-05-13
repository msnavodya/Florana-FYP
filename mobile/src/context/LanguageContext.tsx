// Manage shared mobile state for Language features.
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { storageKeys } from "../lib/storage/keys";
import translations from "../utils/translations";
import translationOverrides from "../utils/translationOverrides";

export type LanguageLabel =
  | "English"
  | "Sinhala"
  | "Tamil"
  | "Spanish"
  | "French"
  | "Arabic"
  | "Hindi"
  | "Chinese";

export type LanguageCode = "en" | "si" | "ta" | "es" | "fr" | "ar" | "hi" | "zh";

export const availableLanguages: LanguageLabel[] = [
  "English",
  "Sinhala",
  "Tamil",
  "Spanish",
  "French",
  "Arabic",
  "Hindi",
  "Chinese",
];

const codeToLabel: Record<string, LanguageLabel> = {
  en: "English",
  si: "Sinhala",
  ta: "Tamil",
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  hi: "Hindi",
  zh: "Chinese",
};

const labelToCode: Record<LanguageLabel, LanguageCode> = {
  English: "en",
  Sinhala: "si",
  Tamil: "ta",
  Spanish: "es",
  French: "fr",
  Arabic: "ar",
  Hindi: "hi",
  Chinese: "zh",
};

// Layer targeted translation fixes over the base dictionaries without duplicating whole language files.
const mergedTranslations = Object.entries(translationOverrides).reduce<Record<string, Record<string, string>>>(
  (result, [languageCode, overrides]) => ({
    ...result,
    [languageCode]: {
      ...(result[languageCode] || {}),
      ...overrides,
    },
  }),
  { ...translations }
);

export const languageNameKeyMap: Record<LanguageLabel, string> = {
  English: "language_english",
  Sinhala: "language_sinhala",
  Tamil: "language_tamil",
  Spanish: "language_spanish",
  French: "language_french",
  Arabic: "language_arabic",
  Hindi: "language_hindi",
  Chinese: "language_chinese",
};

function interpolate(text: string, vars: Record<string, string | number> = {}) {
  return Object.keys(vars).reduce(
    (result, varKey) => result.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(vars[varKey])),
    text
  );
}

export function translateForLanguage(language: LanguageLabel, key: string, vars: Record<string, string | number> = {}) {
  const code = labelToCode[language];
  const text = mergedTranslations[code]?.[key] || mergedTranslations.en?.[key] || key;
  return interpolate(text, vars);
}

interface LanguageContextValue {
  language: LanguageLabel;
  setLanguage: (value: LanguageLabel) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languageCode: LanguageCode;
  languages: LanguageLabel[];
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageLabel>("English");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Support both the dedicated language key and the older settings payload during startup.
    Promise.all([AsyncStorage.getItem(storageKeys.appLanguage), AsyncStorage.getItem(storageKeys.settings)])
      .then(async ([savedLanguage, savedSettings]) => {
        if (savedLanguage) {
          setLanguageState(codeToLabel[savedLanguage] || "English");
          return;
        }

        if (!savedSettings) {
          return;
        }

        try {
          const parsed = JSON.parse(savedSettings) as { language?: LanguageLabel };
          if (parsed.language && labelToCode[parsed.language]) {
            setLanguageState(parsed.language);
            await AsyncStorage.setItem(storageKeys.appLanguage, labelToCode[parsed.language]);
          }
        } catch {
          // Ignore malformed legacy settings and keep the default language.
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback(async (value: LanguageLabel) => {
    // Keep the selected label in memory while storing the compact code on disk.
    setLanguageState(value);
    await AsyncStorage.setItem(storageKeys.appLanguage, labelToCode[value]);
  }, []);

  const t = useCallback((key: string, vars: Record<string, string | number> = {}) => {
    return translateForLanguage(language, key, vars);
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, languageCode: labelToCode[language], languages: availableLanguages, ready }),
    [language, ready, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return value;
}
