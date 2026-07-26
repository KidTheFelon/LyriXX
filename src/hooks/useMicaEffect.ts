import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { logger } from "@/services/logger";
import type { ThemeMode } from "@/types/settings";

function resolveDark(theme: ThemeMode): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useMicaThemeSync(theme: ThemeMode) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const versionRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const v = ++versionRef.current;
    timerRef.current = setTimeout(() => {
      const dark = resolveDark(theme);
      invoke("set_mica_theme", { dark })
        .then(() => {
          if (v === versionRef.current) {
            logger.info("Mica", `Theme synced (dark=${dark})`);
          }
        })
        .catch((err: unknown) => {
          if (v === versionRef.current) {
            logger.warn("Mica", "Failed to sync theme:", err);
          }
        });
    }, 50);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const v = ++versionRef.current;
      timerRef.current = setTimeout(() => {
        invoke("set_mica_theme", { dark: mq.matches })
          .then(() => {
            if (v === versionRef.current) {
              logger.info("Mica", `System preference changed (dark=${mq.matches})`);
            }
          })
          .catch((err: unknown) => {
            if (v === versionRef.current) {
              logger.warn("Mica", "Failed to sync system preference:", err);
            }
          });
      }, 50);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);
}
