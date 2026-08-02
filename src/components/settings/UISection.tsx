import { useRef } from "react";
import type { ThemeMode, TitleBarStyle } from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ToggleSetting, ButtonGroupSetting, SliderSetting } from "./shared";
import { useTranslation } from "@/i18n";
import { AnimatedText } from "../AnimatedText";
import { ACCENT_PRESETS } from "@/utils/accentColors";

const DEFAULT_ACCENT = "#005fb8";

/** Вкладка настроек интерфейса: тема, шрифты, прозрачность, titlebar. */
export function UISection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();
  const pickerRef = useRef<HTMLInputElement>(null);

  const THEMES: { value: ThemeMode; label: React.ReactNode }[] = [
    { value: "system", label: <AnimatedText translationKey="systemTheme" /> },
    { value: "light", label: <AnimatedText translationKey="lightTheme" /> },
    { value: "dark", label: <AnimatedText translationKey="darkTheme" /> },
  ];

  const TITLE_BAR_STYLES: { value: TitleBarStyle; label: React.ReactNode }[] = [
    { value: "custom", label: <AnimatedText translationKey="titleBarCustom" /> },
    { value: "native", label: <AnimatedText translationKey="titleBarNative" /> },
  ];

  const LANGS = [
    { value: "ru" as const, label: <AnimatedText translationKey="russian" /> },
    { value: "en" as const, label: <AnimatedText translationKey="english" /> },
  ];

  const currentAccent = settings.accentColor || "";
  const isCustom = currentAccent !== "" && !ACCENT_PRESETS.some((p) => p.color === currentAccent);
  const pickerValue = currentAccent || DEFAULT_ACCENT;

  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="interface" /></div>

      <ButtonGroupSetting
        label={<AnimatedText translationKey="theme" />}
        value={settings.theme}
        options={THEMES}
        onChange={(v) => onUpdate({ theme: v })}
      />

      <div className="settings-group">
        <label className="settings-label"><AnimatedText translationKey="accentColor" /></label>
        <div className="accent-color-grid">
          <button
            className={`accent-color-swatch accent-color-picker-btn ${isCustom ? "active" : ""}`}
            onClick={() => pickerRef.current?.click()}
            type="button"
            title={t("accentPickColor")}
          >
            <input
              ref={pickerRef}
              type="color"
              value={pickerValue}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
              className="accent-color-native-input"
            />
          </button>
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`accent-color-swatch ${currentAccent === preset.color ? "active" : ""}`}
              style={{ background: preset.color }}
              onClick={() => onUpdate({ accentColor: preset.color })}
              type="button"
              title={preset.label}
            />
          ))}
          {currentAccent !== "" && (
            <button
              className="accent-color-swatch accent-color-reset"
              onClick={() => onUpdate({ accentColor: "" })}
              type="button"
              title={t("accentDefault")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <ButtonGroupSetting
        label={<AnimatedText translationKey="interfaceLanguage" />}
        value={settings.language}
        options={LANGS}
        onChange={(v) => onUpdate({ language: v })}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="sidebarDefaultOpen" />}
        checked={settings.sidebarDefaultOpen}
        onChange={(v) => onUpdate({ sidebarDefaultOpen: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <SliderSetting
        label={<AnimatedText translationKey="sidebarWidth" />}
        value={settings.sidebarWidth}
        min={220}
        max={500}
        step={10}
        unit="px"
        onChange={(v) => onUpdate({ sidebarWidth: v })}
      />

      <SliderSetting
        label={<AnimatedText translationKey="sidebarFontSize" />}
        value={settings.sidebarFontSize}
        min={10}
        max={18}
        step={1}
        unit="px"
        onChange={(v) => onUpdate({ sidebarFontSize: v })}
      />

      <SliderSetting
        label={<AnimatedText translationKey="songListWidth" />}
        value={settings.songListWidth}
        min={150}
        max={500}
        step={10}
        unit="px"
        onChange={(v) => onUpdate({ songListWidth: v })}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="compactMode" />}
        checked={settings.compactMode}
        onChange={(v) => onUpdate({ compactMode: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="animationsEnabled" />}
        checked={settings.animationsEnabled}
        onChange={(v) => onUpdate({ animationsEnabled: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <SliderSetting
        label={<AnimatedText translationKey="transparency" />}
        value={settings.transparency}
        min={50}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onUpdate({ transparency: v })}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="titleBarStyle" />}
        value={settings.titleBarStyle}
        options={TITLE_BAR_STYLES}
        onChange={(v) => onUpdate({ titleBarStyle: v })}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="confirmDelete" />}
        checked={settings.confirmDelete}
        onChange={(v) => onUpdate({ confirmDelete: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="wordCountStatusBar" />}
        checked={settings.showWordCount}
        onChange={(v) => onUpdate({ showWordCount: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />
    </div>
  );
}
