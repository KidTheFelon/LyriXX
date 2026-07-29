import { useRef } from "react";
import type { ThemeMode, TitleBarStyle } from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ToggleSetting, ButtonGroupSetting, SliderSetting } from "./shared";
import { useTranslation } from "@/i18n";
import { ACCENT_PRESETS } from "@/utils/accentColors";

const DEFAULT_ACCENT = "#005fb8";

export function UISection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();
  const pickerRef = useRef<HTMLInputElement>(null);

  const THEMES: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t("systemTheme") },
    { value: "light", label: t("lightTheme") },
    { value: "dark", label: t("darkTheme") },
  ];

  const TITLE_BAR_STYLES: { value: TitleBarStyle; label: string }[] = [
    { value: "custom", label: t("titleBarCustom") },
    { value: "native", label: t("titleBarNative") },
  ];

  const LANGS = [
    { value: "ru" as const, label: t("russian") },
    { value: "en" as const, label: t("english") },
  ];

  const currentAccent = settings.accentColor || "";
  const isCustom = currentAccent !== "" && !ACCENT_PRESETS.some((p) => p.color === currentAccent);
  const pickerValue = currentAccent || DEFAULT_ACCENT;

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("interface")}</div>

      <ButtonGroupSetting
        label={t("theme")}
        value={settings.theme}
        options={THEMES}
        onChange={(v) => onUpdate({ theme: v })}
      />

      <div className="settings-group">
        <label className="settings-label">{t("accentColor")}</label>
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
        label={t("interfaceLanguage")}
        value={settings.language}
        options={LANGS}
        onChange={(v) => onUpdate({ language: v })}
      />

      <ToggleSetting
        label={t("sidebarDefaultOpen")}
        checked={settings.sidebarDefaultOpen}
        onChange={(v) => onUpdate({ sidebarDefaultOpen: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <SliderSetting
        label={t("sidebarWidth")}
        value={settings.sidebarWidth}
        min={220}
        max={500}
        step={10}
        unit="px"
        onChange={(v) => onUpdate({ sidebarWidth: v })}
      />

      <SliderSetting
        label={t("sidebarFontSize")}
        value={settings.sidebarFontSize}
        min={10}
        max={18}
        step={1}
        unit="px"
        onChange={(v) => onUpdate({ sidebarFontSize: v })}
      />

      <SliderSetting
        label={t("songListWidth")}
        value={settings.songListWidth}
        min={150}
        max={500}
        step={10}
        unit="px"
        onChange={(v) => onUpdate({ songListWidth: v })}
      />

      <ToggleSetting
        label={t("compactMode")}
        checked={settings.compactMode}
        onChange={(v) => onUpdate({ compactMode: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("animationsEnabled")}
        checked={settings.animationsEnabled}
        onChange={(v) => onUpdate({ animationsEnabled: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <SliderSetting
        label={t("transparency")}
        value={settings.transparency}
        min={50}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onUpdate({ transparency: v })}
      />

      <ButtonGroupSetting
        label={t("titleBarStyle")}
        value={settings.titleBarStyle}
        options={TITLE_BAR_STYLES}
        onChange={(v) => onUpdate({ titleBarStyle: v })}
      />

      <ToggleSetting
        label={t("confirmDelete")}
        checked={settings.confirmDelete}
        onChange={(v) => onUpdate({ confirmDelete: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("wordCountStatusBar")}
        checked={settings.showWordCount}
        onChange={(v) => onUpdate({ showWordCount: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />
    </div>
  );
}
