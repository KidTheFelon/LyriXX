import { useState, useEffect, useRef, useCallback } from "react";
import { NARROW_WIDTH } from "@/constants";
import { logger } from "@/services/logger";
import type { AppSettings } from "@/types/settings";

const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 500;
const SONGLIST_MIN = 150;
const SONGLIST_MAX = 500;

/** Параметры хука состояния сайдбара. */
interface UseSidebarStateParams {
  /** Текущие настройки приложения. */
  settings: AppSettings;
  /** Настройки загружены из БД. */
  settingsReady: boolean;
  /** Функция обновления настроек. */
  updateSettings: (patch: Partial<AppSettings>) => void;
}

/** Хук состояния сайдбара: сворачивание, узкий режим, Ctrl+B, ресайз колонок. */
export function useSidebarState({
  settings,
  settingsReady,
  updateSettings,
}: UseSidebarStateParams) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < NARROW_WIDTH);

  const sidebarCollapsedRef = useRef(sidebarCollapsed);
  sidebarCollapsedRef.current = sidebarCollapsed;
  const autoCollapsedRef = useRef(false);

  useEffect(() => {
    if (settingsReady) {
      if (window.innerWidth < NARROW_WIDTH) {
        setSidebarCollapsed(true);
        autoCollapsedRef.current = true;
      } else {
        setSidebarCollapsed(!settings.sidebarDefaultOpen);
      }
    }
  }, [settings.sidebarDefaultOpen, settingsReady]);

  useEffect(() => {
    const onResize = () => {
      const narrow = window.innerWidth < NARROW_WIDTH;
      setIsNarrow(narrow);
      if (narrow && !sidebarCollapsedRef.current) {
        autoCollapsedRef.current = true;
        setSidebarCollapsed(true);
      } else if (!narrow && autoCollapsedRef.current) {
        autoCollapsedRef.current = false;
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || tag === "select";
      if ((e.ctrlKey || e.metaKey) && e.key === "b" && !isInput) {
        e.preventDefault();
        logger.debug("Keys", "Ctrl+B: toggle sidebar");
        setSidebarCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sidebarWidthRef = useRef(settings.sidebarWidth);
  sidebarWidthRef.current = settings.sidebarWidth;
  const songListWidthRef = useRef(settings.songListWidth);
  songListWidthRef.current = settings.songListWidth;

  const handleSidebarResize = useCallback(
    (delta: number) => {
      const next = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, sidebarWidthRef.current + delta));
      sidebarWidthRef.current = next;
      updateSettings({ sidebarWidth: next });
    },
    [updateSettings],
  );

  const handleSongListResize = useCallback(
    (delta: number) => {
      const next = Math.max(SONGLIST_MIN, Math.min(SONGLIST_MAX, songListWidthRef.current + delta));
      songListWidthRef.current = next;
      updateSettings({ songListWidth: next });
    },
    [updateSettings],
  );

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    isNarrow,
    handleSidebarResize,
    handleSongListResize,
  };
}
