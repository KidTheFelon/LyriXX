import { getCurrentWindow } from "@tauri-apps/api/window";
import { logger } from "@/services/logger";

export interface WindowAPI {
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
}

let _api: WindowAPI | null = null;

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
        close: () => {
          logger.debug("Window", "close");
          void win.close();
        },
      };
      logger.debug("Window", "Window API initialized");
    } catch (err) {
      logger.warn("Window", "Failed to get Tauri window, using no-ops:", err);
      _api = {
        minimize: () => {},
        toggleMaximize: () => {},
        close: () => {},
      };
    }
  }
  return _api;
}
