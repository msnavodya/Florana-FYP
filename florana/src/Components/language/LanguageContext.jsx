// Support legacy web language features for Language Context.
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations";

const LanguageContext = createContext(null);

const codeToLabel = {
  en: "English",
  si: "Sinhala",
  ta: "Tamil",
};

const labelToCode = {
  English: "en",
  Sinhala: "si",
  Tamil: "ta",
};

const getInitialLanguage = () => {
  const saved = localStorage.getItem("app_language");
  return codeToLabel[saved] || saved || "English";
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    const code = labelToCode[language] || "en";
    localStorage.setItem("app_language", code);
    document.documentElement.lang = code;
    window.dispatchEvent(new Event("languageChange"));
  }, [language]);

  const t = (key, vars = {}) => {
    const code = labelToCode[language] || "en";
    const text = translations[code]?.[key] || translations.en?.[key] || key;
    return Object.keys(vars).reduce((result, varKey) => {
      return result.replace(`{${varKey}}`, vars[varKey]);
    }, text);
  };

  const value = useMemo(
    () => ({ language, setLanguage, t, languageCode: labelToCode[language] || "en" }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return context;
};

export default LanguageContext;
