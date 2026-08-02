import { useState, useCallback } from "react";
import type { ToastData } from "@/components/Toast";
import type { AppSettings } from "@/types/settings";
import { logger } from "@/services/logger";

/** Хук управления тост-уведомлениями с фильтрацией по настройкам. */
export function useToasts(settings: AppSettings) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "error") => {
      if (type === "error" && !settings.toastErrors) return;
      if (type === "success" && !settings.toastSuccess) return;
      if (type === "info" && !settings.toastAutosave) return;
      if (type === "error") {
        logger.warn("Toast", message);
      }
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [settings.toastErrors, settings.toastSuccess, settings.toastAutosave],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
