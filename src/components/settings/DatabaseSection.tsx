import { useState } from "react";
import { useTranslation } from "@/i18n";
import { AnimatedText } from "../AnimatedText";
import type { AppSettings } from "@/types/settings";
import { ToggleSetting, ButtonGroupSetting, ConfirmAction } from "./shared";

interface BackupEntry {
  filename: string;
  size_kb: number;
  timestamp: string;
}

interface DatabaseSectionProps {
  onExportDb: () => void;
  onImportDb: () => void;
  onClearDb: () => void;
  dbStats: { songs: number; categories: number; sizeKb: number } | null;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  backups: BackupEntry[];
  onRefreshBackups: () => void;
  onRestoreBackup: (filename: string) => void;
  onDeleteBackup: (filename: string) => void;
}

function formatTimestamp(ts: string): string {
  const match = ts.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);
  if (!match) return ts;
  const [, y, m, d, h, min, s] = match;
  return `${d}.${m}.${y} ${h}:${min}:${s}`;
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

/** Вкладка управления базой данных: экспорт, импорт, очистка, бэкапы, восстановление. */
export function DatabaseSection({
  onExportDb,
  onImportDb,
  onClearDb,
  dbStats,
  settings,
  onUpdate,
  backups,
  onRefreshBackups,
  onRestoreBackup,
  onDeleteBackup,
}: DatabaseSectionProps) {
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const { t } = useTranslation();

  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="database" /></div>

      {dbStats && (
        <div className="settings-group">
          <div className="settings-db-stats">
            <div className="settings-db-stat">
              <span className="settings-db-stat-value">{dbStats.songs}</span>
              <span className="settings-db-stat-label"><AnimatedText translationKey="songs" /></span>
            </div>
            <div className="settings-db-stat">
              <span className="settings-db-stat-value">{dbStats.categories}</span>
              <span className="settings-db-stat-label"><AnimatedText translationKey="categories" /></span>
            </div>
            <div className="settings-db-stat">
              <span className="settings-db-stat-value">{dbStats.sizeKb}</span>
              <span className="settings-db-stat-label"><AnimatedText translationKey="kb" /></span>
            </div>
          </div>
        </div>
      )}

      <div className="settings-group settings-db-actions">
        <button className="modal-btn modal-btn-confirm" onClick={onExportDb} type="button">
          <AnimatedText translationKey="exportDb" />
        </button>
        <button className="modal-btn" onClick={onImportDb} type="button">
          <AnimatedText translationKey="importDb" />
        </button>
      </div>

      <ToggleSetting
        label={<AnimatedText translationKey="autoBackup" />}
        checked={settings.autoBackup}
        onChange={(v) => onUpdate({ autoBackup: v })}
        onLabel={<AnimatedText translationKey="autoBackupDesc" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      {settings.autoBackup && (
        <ButtonGroupSetting
          label={<AnimatedText translationKey="maxBackups" />}
          value={settings.maxBackups}
          options={[3, 5, 10, 15, 20, 30].map((n) => ({ value: n, label: String(n) }))}
          onChange={(v) => onUpdate({ maxBackups: v })}
        />
      )}

      <div className="settings-group">
        <div className="settings-backup-header">
          <label className="settings-label" style={{ marginBottom: 0 }}>
            <AnimatedText translationKey="backups" /> ({backups.length})
          </label>
          <button
            className="settings-backup-refresh"
            onClick={onRefreshBackups}
            type="button"
            title={t("backups")}
          >
            ↻
          </button>
        </div>

        {backups.length > 0 ? (
          <div className="settings-backup-list">
            {backups.map((b) => (
              <div key={b.filename} className="settings-backup-item">
                <div className="settings-backup-info">
                  <span className="settings-backup-date">{formatTimestamp(b.timestamp)}</span>
                  <span className="settings-backup-size">{formatSize(b.size_kb)}</span>
                </div>
                {restoreConfirm === b.filename ? (
                  <div className="settings-backup-confirm">
                    <span className="settings-confirm-text"><AnimatedText translationKey="restoreConfirm" /></span>
                    <button
                      className="modal-btn modal-btn-confirm modal-btn--sm"
                      onClick={() => {
                        onRestoreBackup(b.filename);
                        setRestoreConfirm(null);
                      }}
                      type="button"
                    >
                      <AnimatedText translationKey="yesDelete" />
                    </button>
                    <button
                      className="modal-btn modal-btn--sm"
                      onClick={() => setRestoreConfirm(null)}
                      type="button"
                    >
                      <AnimatedText translationKey="cancel" />
                    </button>
                  </div>
                ) : (
                  <div className="settings-backup-actions">
                    <button
                      className="modal-btn modal-btn-confirm modal-btn--sm"
                      onClick={() => setRestoreConfirm(b.filename)}
                      type="button"
                    >
                      <AnimatedText translationKey="restoreBackup" />
                    </button>
                    <button
                      className="modal-btn modal-btn-danger modal-btn--sm"
                      onClick={() => onDeleteBackup(b.filename)}
                      type="button"
                    >
                      <AnimatedText translationKey="delete" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="settings-backup-empty"><AnimatedText translationKey="noBackups" /></div>
        )}
      </div>

      <div className="settings-group">
        <ConfirmAction
          label={<AnimatedText translationKey="clearDb" />}
          confirmMsg={<AnimatedText translationKey="deleteAllSongs?" />}
          confirmYes={<AnimatedText translationKey="yesDelete" />}
          confirmNo={<AnimatedText translationKey="cancel" />}
          onConfirm={onClearDb}
          danger
        />
      </div>
    </div>
  );
}
