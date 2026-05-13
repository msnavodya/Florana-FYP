// Support legacy web language features for Language Selector.
import React from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "./LanguageContext";
import "./language.css";

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

const languages = [
  { code: "en", short: "EN", label: "English" },
  { code: "si", short: "SI", label: "Sinhala" },
  { code: "ta", short: "TA", label: "Tamil" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const selectedLanguage = labelToCode[language] || "en";
  const selectedShort = languages.find((item) => item.code === selectedLanguage)?.short || "EN";

  const handleLanguageChange = (languageCode) => {
    setLanguage(codeToLabel[languageCode] || "English");
  };

  // Render the legacy web Language Selector interface and its interactive controls.
  return (
    <div className="language-selector">
      <label className="language-field" aria-label="Language selector">
        <Languages size={12} strokeWidth={2.3} />
        <span className="language-code">{selectedShort}</span>
        <select
          value={selectedLanguage}
          onChange={(event) => handleLanguageChange(event.target.value)}
          className="language-dropdown"
        >
          {languages.map((languageOption) => (
            <option key={languageOption.code} value={languageOption.code}>
              {languageOption.short} Â· {languageOption.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
