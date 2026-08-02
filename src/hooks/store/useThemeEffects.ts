import { useEffect } from "react";
import { logger } from "@/services/logger";
import type { AppSettings } from "@/types/settings";
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from "@/constants";
import { generateAccentVariants, isAccentLight } from "@/utils/accentColors";

/** Синхронизирует CSS-переменные темы, акцентного цвета, шрифта, прозрачности и ширин колонок. */
export function useThemeEffects(settings: AppSettings) {
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    const cs = getComputedStyle(root);
    const vars = [
      "--bg-mica",
      "--bg-mica-alt",
      "--bg-card",
      "--bg-card-solid",
      "--bg-layer",
      "--bg-chrome",
      "--bg-acrylic",
      "--text-primary",
      "--text-secondary",
      "--accent-default",
    ];
    const vals = vars.map((v) => `${v}=${cs.getPropertyValue(v).trim()}`);
    logger.info("Theme", `Changed to "${theme}" | ${vals.join(" | ")}`);
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (!settings.accentColor) {
      root.style.removeProperty("--accent-default");
      root.style.removeProperty("--accent-hover");
      root.style.removeProperty("--accent-pressed");
      root.style.removeProperty("--accent-light");
      root.style.removeProperty("--accent-lighter");
      root.style.removeProperty("--text-on-accent");
      root.style.removeProperty("--stroke-focus-outer");
      return;
    }
    const v = generateAccentVariants(settings.accentColor);
    root.style.setProperty("--accent-default", v.default);
    root.style.setProperty("--accent-hover", v.hover);
    root.style.setProperty("--accent-pressed", v.pressed);
    root.style.setProperty("--accent-light", v.light);
    root.style.setProperty("--accent-lighter", v.lighter);
    const onAccent = isAccentLight(v.default) ? "#000000" : "#ffffff";
    root.style.setProperty("--text-on-accent", onAccent);
    root.style.setProperty("--stroke-focus-outer", v.default);
    logger.info("Accent", `Changed to ${v.default}`);
  }, [settings.accentColor]);

  useEffect(() => {
    const clamped = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, settings.editorFontSize));
    document.documentElement.style.setProperty("--editor-font-size", `${clamped}px`);
  }, [settings.editorFontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty("--navpane-w", `${settings.sidebarWidth}px`);
  }, [settings.sidebarWidth]);

  useEffect(() => {
    document.documentElement.style.setProperty("--listpane-w", `${settings.songListWidth}px`);
  }, [settings.songListWidth]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("no-animations", !settings.animationsEnabled || settings.reducedMotion);
    root.classList.toggle("high-contrast", settings.highContrast);
  }, [settings.animationsEnabled, settings.reducedMotion, settings.highContrast]);

  useEffect(() => {
    if (settings.transparency < 100) {
      document.documentElement.style.setProperty(
        "--window-transparency",
        `${settings.transparency / 100}`,
      );
    } else {
      document.documentElement.style.removeProperty("--window-transparency");
    }
  }, [settings.transparency]);
}
