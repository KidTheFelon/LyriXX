import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { TauriDbService } from "@/services/storage";
import { logger } from "@/services/logger";

/** Запись резервной копии. */
interface BackupEntry {
  /** Имя файла бэкапа. */
  filename: string;
  /** Размер в КБ. */
  size_kb: number;
  /** Timestamp создания. */
  timestamp: string;
}

/** Информация о восстановлении БД после аварии. */
interface RecoveryInfo {
  /** Была ли выполнена автоматическая рекавери. */
  was_recovered: boolean;
  /** Доступные резервные копии. */
  backups: BackupEntry[];
}

/** Хук операций с БД: экспорт/импорт/очистка, бэкапы, восстановление. */
export function useDbOperations(
  addToast: (message: string, type?: "error" | "success" | "info") => void,
  t: (key: string) => string,
) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null);

  useEffect(() => {
    invoke<RecoveryInfo>("check_db_recovery")
      .then((info) => {
        if (info.was_recovered) {
          setRecoveryInfo(info);
        }
      })
      .catch((err) => {
        logger.error("App", "check_db_recovery invoke failed:", err);
      });
  }, []);

  const handleExportDb = useCallback(async () => {
    try {
      logger.info("App", "Export DB started");
      const db = new TauriDbService();
      await db.exportDb();
      logger.info("App", "Export DB completed");
    } catch (err) {
      logger.error("App", "Export failed:", err);
    }
  }, []);

  const handleImportDb = useCallback(async () => {
    try {
      const file = await open({
        filters: [{ name: "SQLite DB", extensions: ["db"] }],
        multiple: false,
      });
      if (!file) {
        logger.debug("App", "import_db: cancelled");
        return;
      }
      logger.info("App", `import_db: copying from ${file}`);
      const dest = await invoke<string>("get_db_path_str");
      await invoke("copy_file", { src: file, dest });
      logger.info("App", "import_db: done");
      addToast(t("dbImported"), "success");
    } catch (err) {
      logger.error("App", "Import failed:", err);
      addToast(t("importError"), "error");
    }
  }, [addToast, t]);

  const handleClearDb = useCallback(async () => {
    try {
      await invoke("clear_all_data");
      logger.info("App", "clear_db: done");
      addToast(t("dbCleared"), "success");
    } catch (err) {
      logger.error("App", "Clear failed:", err);
      addToast(t("clearError"), "error");
    }
  }, [addToast, t]);

  const refreshBackups = useCallback(async () => {
    try {
      const list = await invoke<BackupEntry[]>("list_backups");
      logger.debug("App", `refreshBackups: ${list.length} backups`);
      setBackups(list);
    } catch (err) {
      logger.error("App", "Failed to load backups:", err);
    }
  }, []);

  const handleRestoreBackup = useCallback(
    async (filename: string) => {
      try {
        await invoke("restore_backup", { filename });
        logger.info("App", `restore_backup: ${filename} done`);
        addToast(t("backupRestored"), "success");
        refreshBackups();
      } catch (err) {
        logger.error("App", "Restore failed:", err);
        addToast(String(err), "error");
      }
    },
    [addToast, t, refreshBackups],
  );

  const handleDeleteBackup = useCallback(
    async (filename: string) => {
      try {
        await invoke("delete_backup", { filename });
        logger.info("App", `delete_backup: ${filename} done`);
        addToast(t("backupDeleted"), "success");
        refreshBackups();
      } catch (err) {
        logger.error("App", "Delete backup failed:", err);
        addToast(String(err), "error");
      }
    },
    [addToast, t, refreshBackups],
  );

  const dismissRecovery = useCallback(() => setRecoveryInfo(null), []);

  return {
    backups,
    recoveryInfo,
    handleExportDb,
    handleImportDb,
    handleClearDb,
    refreshBackups,
    handleRestoreBackup,
    handleDeleteBackup,
    dismissRecovery,
  };
}
