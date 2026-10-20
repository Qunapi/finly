"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { chooseLanguage, translate, type Language } from "../lib/language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string, values?: Record<string, string | number>) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, updateLanguage] = useState<Language>("pl");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const restore = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("finly-language");
      } catch {}
      updateLanguage(
        chooseLanguage(new URLSearchParams(window.location.search).get("lang"), saved, navigator.languages),
      );
      setReady(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = language;
    document.title = translate(language, "Finly — kalkulatory finansowe");
    const url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [ready, language]);
  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    try {
      localStorage.setItem("finly-language", next);
    } catch {}
  }, []);
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: (text, values) => translate(language, text, values) }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is required");
  return context;
}
