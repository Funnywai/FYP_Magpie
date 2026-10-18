import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { strings, type Lang, type Loc, type Strings } from './strings';

type LangApi = {
  lang: Lang;
  setLang: (next: Lang) => void;
  s: Strings;
  /** Pick the current language from a bilingual mock string. */
  loc: (value: Loc) => string;
};

const LangContext = createContext<LangApi | null>(null);

/** English is the default UI language; the Settings screen switches it at runtime. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const api = useMemo<LangApi>(() => ({ lang, setLang, s: strings[lang], loc: (v) => v[lang] }), [lang]);
  return <LangContext.Provider value={api}>{children}</LangContext.Provider>;
}

export function useLang(): LangApi {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
