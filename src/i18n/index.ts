import { createContext, useContext } from "react";
import { getTranslation, type Lang } from "./translations";

export { getTranslation };
export type { Lang };

export const LanguageContext = createContext<Lang>("ru");

export function useTranslation() {
  const lang = useContext(LanguageContext);
  const t = (key: string) => getTranslation(lang, key);
  return { t, lang };
}
