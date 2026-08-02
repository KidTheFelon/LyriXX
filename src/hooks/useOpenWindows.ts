import { useSyncExternalStore, useEffect } from "react";
import { subscribeOpenWindows, getOpenWindowSongIds, cleanupStaleWindows } from "@/services/window";

export function useOpenWindows(): ReadonlySet<string> {
  useEffect(() => {
    const id = setInterval(() => {
      void cleanupStaleWindows();
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return useSyncExternalStore(
    subscribeOpenWindows,
    () => getOpenWindowSongIds(),
    () => getOpenWindowSongIds(),
  );
}
