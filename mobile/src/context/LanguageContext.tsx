import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { storageKeys } from "../lib/storage/keys";
import translations from "../utils/translations";

type LanguageLabel = "English" | "Sinhala" | "Tamil";

const codeToLabel: Record<string, LanguageLabel> = {
  en: "English",
  si: "Sinhala",
  ta: "Tamil",
};

const labelToCode: Record<LanguageLabel, "en" | "si" | "ta"> = {
  English: "en",
  Sinhala: "si",
  Tamil: "ta",
};

interface LanguageContextValue {
  language: LanguageLabel;
  setLanguage: (value: LanguageLabel) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languageCode: "en" | "si" | "ta";
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageLabel>("English");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKeys.appLanguage)
      .then((saved) => {
        if (!saved) {
          return;
        }
        setLanguageState(codeToLabel[saved] || "English");
      })
      .finally(() => setReady(true));
  }, []);

  const setLanguage = async (value: LanguageLabel) => {
    setLanguageState(value);
    await AsyncStorage.setItem(storageKeys.appLanguage, labelToCode[value]);
  };

  const t = (key: string, vars: Record<string, string | number> = {}) => {
    const code = labelToCode[language];
    const text = translations[code]?.[key] || translations.en?.[key] || key;
    return Object.keys(vars).reduce((result, varKey) => result.replace(`{${varKey}}`, String(vars[varKey])), text);
  };

  const value = useMemo(
    () => ({ language, setLanguage, t, languageCode: labelToCode[language], ready }),
    [language, ready]
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
