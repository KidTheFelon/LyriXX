import { useEffect, useRef } from "react";
import { logger } from "@/services/logger";

export interface KeyboardShortcutMap {
  onNewSong?: () => void;
  onFocusSearch?: () => void;
  onRequestDelete?: () => void;
  deleteEnabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcutMap) {
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || tag === "select";

      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !isInput) {
        e.preventDefault();
        logger.debug("Keys", "Ctrl+N: new song");
        ref.current.onNewSong?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "f" && !isInput) {
        e.preventDefault();
        logger.debug("Keys", "Ctrl+F: focus search");
        ref.current.onFocusSearch?.();
        return;
      }

      if (e.key === "Delete" && !isInput && ref.current.deleteEnabled) {
        if (document.activeElement?.closest('[role="option"]')) return;
        e.preventDefault();
        logger.debug("Keys", "Delete: request delete");
        ref.current.onRequestDelete?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
