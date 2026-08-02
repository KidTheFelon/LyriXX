import { logger } from "./logger";

/** Копирует текст в буфер обмена. Использует Clipboard API с fallback на textarea. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    logger.warn("Clipboard", "Clipboard API failed, trying fallback:", e);
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) {
      logger.warn("Clipboard", "execCommand copy returned false");
    }
    return ok;
  } catch (e) {
    logger.error("Clipboard", "Fallback copy failed:", e);
    return false;
  }
}
