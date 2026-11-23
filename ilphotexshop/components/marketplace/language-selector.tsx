"use client";

import { Globe2 } from "lucide-react";
import {
  supportedLanguages,
  translate,
  type Language,
} from "@/lib/marketplace-i18n";

type LanguageSelectorProps = {
  language: Language;
  onChange: (language: Language) => void;
};

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  rw: "Ikinyarwanda",
};

export default function LanguageSelector({
  language,
  onChange,
}: LanguageSelectorProps) {
  return (
    <label className="language-control">
      <Globe2 size={17} aria-hidden="true" />
      <span className="sr-only">{translate(language, "language")}</span>
      <select
        aria-label={translate(language, "language")}
        value={language}
        onChange={(event) => {
          const nextLanguage = supportedLanguages.find(
            (option) => option === event.target.value,
          );
          if (nextLanguage) onChange(nextLanguage);
        }}
      >
        {supportedLanguages.map((option) => (
          <option key={option} value={option}>
            {languageNames[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
