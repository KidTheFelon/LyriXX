import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { logger } from "@/services/logger";

/** API управления окном Tauri: minimize, toggleMaximize, close. */
export interface WindowAPI {
  minimize(): void;
  toggleMaximize(): void;
  maximize(): void;
  close(): void;
  startDragging(): void;
  isMaximized(): Promise<boolean>;
}

let _api: WindowAPI | null = null;

/** Lazy-синглтон WindowAPI. Возвращает no-op если Tauri недоступен. */
export function getWindowAPI(): WindowAPI {
  if (!_api) {
    try {
      const win = getCurrentWindow();
      _api = {
        minimize: () => {
          logger.debug("Window", "minimize");
          void win.minimize();
        },
        toggleMaximize: () => {
          logger.debug("Window", "toggleMaximize");
          void win.toggleMaximize();
        },
        maximize: () => {
          logger.debug("Window", "maximize");
          void win.maximize();
        },
        close: () => {
          logger.debug("Window", "close");
          void win.close();
        },
        startDragging: () => {
          logger.debug("Window", "startDragging");
          void win.startDragging();
        },
        isMaximized: () => {
          return win.isMaximized();
        },
      };
      logger.debug("Window", "Window API initialized");
    } catch (err) {
      logger.warn("Window", "Failed to get Tauri window, using no-ops:", err);
      _api = {
        minimize: () => {},
        toggleMaximize: () => {},
        maximize: () => {},
        close: () => {},
        startDragging: () => {},
        isMaximized: () => Promise.resolve(false),
      };
    }
  }
  return _api;
}

const _openWindowSongIds = new Set<string>();
const _openWindowListeners = new Set<() => void>();

function _notifyOpenWindows() {
  for (const l of _openWindowListeners) l();
}

export function getOpenWindowSongIds(): ReadonlySet<string> {
  return _openWindowSongIds;
}

export function subscribeOpenWindows(listener: () => void): () => void {
  _openWindowListeners.add(listener);
  return () => {
    _openWindowListeners.delete(listener);
  };
}

/** Проверяет и очищает устаревшие ID из трекинга. */
export async function cleanupStaleWindows(): Promise<void> {
  if (_openWindowSongIds.size === 0) return;
  const all = await WebviewWindow.getAll();
  const openLabels = new Set(all.map((w) => w.label));
  let changed = false;
  for (const songId of _openWindowSongIds) {
    if (!openLabels.has(`song-${songId}`)) {
      _openWindowSongIds.delete(songId);
      changed = true;
    }
  }
  if (changed) _notifyOpenWindows();
}

/** Открывает отдельное окно для песни. Если окно уже открыто — фокусирует его. */
export async function openSongWindow(
  songId: string,
  title: string,
  position?: { x: number; y: number },
): Promise<void> {
  const label = `song-${songId}`;
  try {
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) {
      await existing.setFocus();
      return;
    }
    await cleanupStaleWindows();
    _openWindowSongIds.add(songId);
    _notifyOpenWindows();
    const win = new WebviewWindow(label, {
      url: `/?songId=${encodeURIComponent(songId)}`,
      title: title || "LyriXX",
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      decorations: false,
      transparent: true,
      center: !position,
      alwaysOnTop: true,
      ...(position ? { x: Math.round(position.x), y: Math.round(position.y) } : {}),
    });
    void win.once("ready", () => {
      logger.debug("Window", `song window ready: ${label}`);
      void win.setFocus();
    });
  } catch (err) {
    _openWindowSongIds.delete(songId);
    _notifyOpenWindows();
    logger.error("Window", `Failed to open song window: ${label}`, err);
  }
}
