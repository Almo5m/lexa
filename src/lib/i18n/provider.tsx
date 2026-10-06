"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translate, type DictKey, type Lang } from "./dictionary";

type TFunction = (key: DictKey, vars?: Record<string, string | number>) => string;

const LangContext = createContext<{ lang: Lang; t: TFunction } | null>(null);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(
    () => ({ lang, t: ((key, vars) => translate(lang, key, vars)) as TFunction }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  const context = useContext(LangContext);
  if (!context) throw new Error("useT must be used inside LangProvider");
  return context;
}
