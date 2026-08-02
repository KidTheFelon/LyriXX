import { useEffect, useRef, useCallback, useState } from "react";
import { MODAL_ANIM_DURATION_MS } from "@/constants";
import { AnimatedText } from "./AnimatedText";
import { logger } from "@/services/logger";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

/** Анимированное модальное окно подтверждения с danger-режимом и focus trap. */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: ConfirmModalProps) {
  const [phase, setPhase] = useState<"hidden" | "enter" | "open" | "exit">("hidden");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const prevActiveRef = useRef<Element | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("enter");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("open"));
      });
      prevActiveRef.current = document.activeElement;
    } else if (phase === "open" || phase === "enter") {
      setPhase("exit");
      animTimerRef.current = setTimeout(() => {
        setPhase("hidden");
        if (prevActiveRef.current instanceof HTMLElement) {
          prevActiveRef.current.focus();
        }
      }, MODAL_ANIM_DURATION_MS);
    } else if (!open) {
      setPhase("hidden");
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (phase === "open") {
      confirmRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPhase("exit");
        animTimerRef.current = setTimeout(() => {
          setPhase("hidden");
          onCancel();
        }, MODAL_ANIM_DURATION_MS);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
  }, []);

  const handleCancel = () => {
    logger.debug("ConfirmModal", `cancelled: "${title}"`);
    setPhase("exit");
    animTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      onCancel();
    }, MODAL_ANIM_DURATION_MS);
  };

  const handleConfirm = () => {
    logger.debug("ConfirmModal", `confirmed: "${title}"`);
    setPhase("exit");
    animTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      onConfirm();
    }, MODAL_ANIM_DURATION_MS);
  };

  if (phase === "hidden") return null;

  const handleOverlayClick = () => handleCancel();

  return (
    <div
      className={`modal-overlay${phase === "exit" ? " closing" : ""}`}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 className="modal-title" id="modal-title">
          {title}
        </h2>
        {message && (
          <p className="modal-desc" id="modal-desc">
            {message}
          </p>
        )}
        <div className="modal-actions">
          <button
            className="modal-btn modal-btn-cancel"
            type="button"
            ref={cancelRef}
            onClick={handleCancel}
          >
            <AnimatedText translationKey="cancel" />
          </button>
          <button
            className={`modal-btn modal-btn-confirm${danger ? " modal-btn-danger" : ""}`}
            type="button"
            ref={confirmRef}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
