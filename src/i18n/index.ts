import { createContext, useContext } from "react";
import { getTranslation, type Lang } from "./translations";

export { getTranslation };
export type { Lang };

/** React-контекст текущего языка (по умолчанию "ru"). */
export const LanguageContext = createContext<Lang>("ru");

/** Хук перевода. Возвращает { t, lang } для текущего языка. */
export function useTranslation() {
  const lang = useContext(LanguageContext);
  const t = (key: string) => getTranslation(lang, key);
  return { t, lang };
}
