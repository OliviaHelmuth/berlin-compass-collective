import { useTranslation } from "react-i18next";
import { setLanguage } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("de") ? "de" : "en";

  const toggle = () => {
    setLanguage(lang === "de" ? "en" : "de");
  };

  return (
    <button
      onClick={toggle}
      aria-label={t("nav.language")}
      title={t("nav.language")}
      className="h-10 px-2.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-[11px] font-bold tracking-widest uppercase flex items-center gap-1"
    >
      <span className={lang === "en" ? "text-foreground" : "text-muted-foreground"}>EN</span>
      <span className="text-muted-foreground">/</span>
      <span className={lang === "de" ? "text-foreground" : "text-muted-foreground"}>DE</span>
    </button>
  );
}
