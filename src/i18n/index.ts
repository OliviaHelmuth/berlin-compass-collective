import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { de } from "./locales/de";

// IMPORTANT: SSR and the very first client render MUST agree, so we always
// initialise with `lng: "en"`. Detection happens on the client after mount
// via `detectAndApplyLanguage()` to avoid React hydration mismatches.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "de"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

const LS_KEY = "atlas-lang";

export function detectAndApplyLanguage() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(LS_KEY);
  const nav = navigator.language?.toLowerCase() ?? "";
  const preferred = stored ?? (nav.startsWith("de") ? "de" : "en");
  if (preferred && preferred !== i18n.language) {
    void i18n.changeLanguage(preferred);
  }
  document.documentElement.lang = preferred;
}

export function setLanguage(lang: "en" | "de") {
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_KEY, lang);
    document.documentElement.lang = lang;
  }
  void i18n.changeLanguage(lang);
}

export default i18n;
