import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "@/i18n";
import { MODAL_ANIM_DURATION_MS } from "@/constants";
import { logger } from "@/services/logger";

interface BackupEntry {
  filename: string;
  size_kb: number;
  timestamp: string;
}

function formatTimestamp(ts: string): string {
  const match = ts.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);
  if (!match) return ts;
  const [, y, m, d, h, min, s] = match;
  return `${d}.${m}.${y} ${h}:${min}:${s}`;
}

interface RecoveryModalProps {
  open: boolean;
  backups: BackupEntry[];
  onDismissed: () => void;
}

export function RecoveryModal({ open, backups, onDismissed }: RecoveryModalProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"hidden" | "enter" | "open" | "exit">("hidden");
  const [selected, setSelected] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
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
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleRestore = async () => {
    if (!selected) return;
    setRestoring(true);
    setError(null);
    logger.info("Recovery", `restoring backup: ${selected}`);
    try {
      await invoke("restore_backup", { filename: selected });
      logger.info("Recovery", `backup restored: ${selected}`);
      setRestored(true);
    } catch (err) {
      logger.error("Recovery", `restore_backup failed (${selected}):`, err);
      setError(String(err));
      setRestoring(false);
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const handleContinue = () => {
    setPhase("exit");
    animTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      onDismissed();
    }, MODAL_ANIM_DURATION_MS);
  };

  if (phase === "hidden") return null;

  return (
    <div className={`modal-overlay${phase === "exit" ? " closing" : ""}`} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-title"
        aria-describedby="recovery-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title" id="recovery-title">
          {t("recoveryTitle")}
        </h2>
        <p className="modal-desc" id="recovery-desc">
          {t("recoveryDesc")}
        </p>

        {restored ? (
          <div className="recovery-restored">
            <p className="recovery-restored-text">{t("backupRestored")}</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-confirm" type="button" onClick={handleRestart}>
                {t("recoveryRestart")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {backups.length > 0 ? (
              <div className="recovery-backup-list">
                {backups.map((b) => (
                  <label
                    key={b.filename}
                    className={`recovery-backup-item${selected === b.filename ? " selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="recovery-backup"
                      value={b.filename}
                      checked={selected === b.filename}
                      onChange={() => setSelected(b.filename)}
                    />
                    <span className="recovery-backup-info">
                      <span className="recovery-backup-date">{formatTimestamp(b.timestamp)}</span>
                      <span className="recovery-backup-size">{b.size_kb} KB</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="recovery-no-backups">{t("noBackups")}</p>
            )}

            {error && <p className="recovery-error">{error}</p>}

            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" type="button" onClick={handleContinue}>
                {t("recoveryContinue")}
              </button>
              {backups.length > 0 && (
                <button
                  className="modal-btn modal-btn-confirm"
                  type="button"
                  disabled={!selected || restoring}
                  onClick={handleRestore}
                >
                  {restoring ? t("loading") : t("recoveryRestore")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
