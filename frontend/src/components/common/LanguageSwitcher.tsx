import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface Language {
  code: "en" | "ru" | "tr";
  label: string;
  shortLabel: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", shortLabel: "EN", flag: "🇬🇧" },
  { code: "ru", label: "Русский", shortLabel: "RU", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", shortLabel: "TR", flag: "🇹🇷" },
];

export interface LanguageSwitcherProps {
  isSolidNav?: boolean;
  className?: string;
  compact?: boolean;
  onLanguageChange?: (code: string) => void;
}

export default function LanguageSwitcher({
  isSolidNav = true,
  className = "",
  compact = false,
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangCode = (i18n.language?.slice(0, 2).toLowerCase() as "en" | "ru" | "tr") || "en";
  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: "en" | "ru" | "tr") => {
    void i18n.changeLanguage(code);
    setIsOpen(false);
    onLanguageChange?.(code);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Language selector: ${currentLang.shortLabel} (${currentLang.label})`}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
          isSolidNav
            ? "bg-background-100/80 hover:bg-background-200/90 text-foreground-800 border border-background-200"
            : "bg-white/25 backdrop-blur-sm hover:bg-white/35 text-white border border-white/20"
        }`}
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span>{compact ? currentLang.shortLabel : `${currentLang.shortLabel} (${currentLang.label})`}</span>
        <i
          className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-background-50 border border-background-200/90 shadow-xl overflow-hidden z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-primary-50 text-primary-700 font-bold dark:bg-primary-950/40"
                    : "text-foreground-700 hover:bg-background-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {isSelected && <i className="ri-check-line text-primary-600 text-sm" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
