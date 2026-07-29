import { useEffect, useRef, useCallback, useState } from "react";
import type { AppSettings } from "@/types/settings";
import { EditorSection } from "./settings/EditorSection";
import { UISection } from "./settings/UISection";
import { BehaviorSection } from "./settings/BehaviorSection";
import { RhymesSection } from "./settings/RhymesSection";
import { CustomTagsSection } from "./settings/CustomTagsSection";
import { DatabaseSection } from "./settings/DatabaseSection";
import { AccessibilitySection } from "./settings/AccessibilitySection";
import { NotificationsSection } from "./settings/NotificationsSection";
import { ShortcutsSection } from "./settings/ShortcutsSection";
import { useTranslation } from "@/i18n";
import { MODAL_ANIM_DURATION_MS } from "@/constants";

type TabId =
  | "editor"
  | "interface"
  | "behavior"
  | "rhymes"
  | "tags"
  | "database"
  | "accessibility"
  | "notifications"
  | "shortcuts";

interface BackupEntry {
  filename: string;
  size_kb: number;
  timestamp: string;
}

interface SettingsModalProps {
  open: boolean;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
  onExportDb: () => void;
  onImportDb: () => void;
  onClearDb: () => void;
  dbStats: { songs: number; categories: number; sizeKb: number } | null;
  backups: BackupEntry[];
  onRefreshBackups: () => void;
  onRestoreBackup: (filename: string) => void;
  onDeleteBackup: (filename: string) => void;
}

export function SettingsModal({
  open,
  settings,
  onUpdate,
  onClose,
  onExportDb,
  onImportDb,
  onClearDb,
  dbStats,
  backups,
  onRefreshBackups,
  onRestoreBackup,
  onDeleteBackup,
}: SettingsModalProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"hidden" | "enter" | "open" | "exit">("hidden");
  const [activeTab, setActiveTab] = useState<TabId>("editor");
  const modalRef = useRef<HTMLDivElement>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("enter");
      setActiveTab("editor");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("open"));
      });
    } else if (phase === "open" || phase === "enter") {
      setPhase("exit");
      animTimerRef.current = setTimeout(() => {
        setPhase("hidden");
        onClose();
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
      modalRef.current?.focus();
    }
  }, [phase]);

  const startClose = useCallback(() => {
    setPhase("exit");
    animTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      onClose();
    }, MODAL_ANIM_DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") startClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, startClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
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

  if (phase === "hidden") return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: "editor", label: t("editor") },
    { id: "interface", label: t("interface") },
    { id: "behavior", label: t("behavior") },
    { id: "rhymes", label: t("rhymeDict") },
    { id: "tags", label: t("customTags") },
    { id: "database", label: t("database") },
    { id: "accessibility", label: t("accessibility") },
    { id: "notifications", label: t("notifications") },
    { id: "shortcuts", label: t("shortcuts") },
  ];

  return (
    <div
      className={`modal-overlay${phase === "exit" ? " closing" : ""}`}
      onClick={startClose}
      role="presentation"
    >
      <div
        className="modal modal-settings"
        role="dialog"
        aria-modal="true"
        aria-label={t("settings")}
        tabIndex={-1}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="settings-header">
          <div className="modal-title">{t("settings")}</div>
        </div>

        <div className="settings-layout">
          <nav className="settings-sidebar" role="tablist" aria-label={t("settings")}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="settings-content" role="tabpanel">
            <div className="settings-tab-content" key={activeTab}>
              {activeTab === "editor" && <EditorSection settings={settings} onUpdate={onUpdate} />}
              {activeTab === "interface" && <UISection settings={settings} onUpdate={onUpdate} />}
              {activeTab === "behavior" && (
                <BehaviorSection settings={settings} onUpdate={onUpdate} />
              )}
              {activeTab === "rhymes" && <RhymesSection settings={settings} onUpdate={onUpdate} />}
              {activeTab === "tags" && (
                <CustomTagsSection settings={settings} onUpdate={onUpdate} />
              )}
              {activeTab === "database" && (
                <DatabaseSection
                  onExportDb={onExportDb}
                  onImportDb={onImportDb}
                  onClearDb={onClearDb}
                  dbStats={dbStats}
                  settings={settings}
                  onUpdate={onUpdate}
                  backups={backups}
                  onRefreshBackups={onRefreshBackups}
                  onRestoreBackup={onRestoreBackup}
                  onDeleteBackup={onDeleteBackup}
                />
              )}
              {activeTab === "accessibility" && (
                <AccessibilitySection settings={settings} onUpdate={onUpdate} />
              )}
              {activeTab === "notifications" && (
                <NotificationsSection settings={settings} onUpdate={onUpdate} />
              )}
              {activeTab === "shortcuts" && <ShortcutsSection />}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-confirm" onClick={startClose} type="button">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
