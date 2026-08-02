import { useState, useCallback, useEffect, useRef } from "react";
import type { AppSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import type { SongsDb } from "@/services/storage";
import { TauriDbService } from "@/services/storage";
import { logger } from "@/services/logger";
import { invoke } from "@tauri-apps/api/core";

const KEY = "lyrixx_settings";

/** Хук загрузки/сохранения настроек приложения с debounce-персистентностью в SQLite. */
export function useSettings(db: SongsDb = new TauriDbService()) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    dbRef.current
      .loadSetting<Partial<AppSettings>>(KEY)
      .then((saved) => {
        if (saved) {
          setSettings((prev) => ({ ...prev, ...saved }));
          logger.debug("Settings", "loaded from DB");
        } else {
          logger.debug("Settings", "no saved settings, using defaults");
        }
        setReady(true);
      })
      .catch((err) => {
        logger.error("DB", "Failed to load settings:", err);
        setReady(true);
      });
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestRef = useRef<AppSettings>(settings);

  const save = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      latestRef.current = next;
      return next;
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = latestRef.current;
      const changes = Object.entries(patch)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(", ");
      logger.debug("Settings", `saving: {${changes}}`);
      dbRef.current
        .saveSetting(KEY, next)
        .catch((err) => logger.error("DB", "Failed to save setting:", err));
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    invoke("toggle_minimize_to_tray", { enabled: settings.minimizeToTray }).catch((err) => {
      logger.error("Settings", "Failed to toggle minimize_to_tray:", err);
    });
  }, [settings.minimizeToTray, ready]);

  return { settings, updateSettings: save, settingsReady: ready };
}
