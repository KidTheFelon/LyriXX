import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/i18n";
import { IconClose } from "./Icons";
import { TOAST_VISIBLE_DURATION_MS, TOAST_CLOSE_ANIM_MS } from "@/constants";

/** Данные тост-уведомления. */
export interface ToastData {
  /** Уникальный идентификатор. */
  id: string;
  /** Текст уведомления. */
  message: string;
  /** Тип уведомления. */
  type: "error" | "success" | "info";
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    timerRef.current = setTimeout(() => setClosing(true), TOAST_VISIBLE_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id]);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => onRemove(toast.id), TOAST_CLOSE_ANIM_MS);
    return () => clearTimeout(t);
  }, [closing, toast.id, onRemove]);

  return (
    <div className={`toast toast--${toast.type}${closing ? " closing" : ""}`} role="alert">
      <span className="toast-msg">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => setClosing(true)}
        type="button"
        aria-label={t("close")}
      >
        <IconClose size={10} />
      </button>
    </div>
  );
}

/** Portal-based контейнер тост-уведомлений. */
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>,
    document.body,
  );
}
