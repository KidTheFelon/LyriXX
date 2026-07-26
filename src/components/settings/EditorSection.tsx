import { useState, useEffect } from "react";
import type { SettingsSectionProps } from "./shared";
import { ToggleSetting, ButtonGroupSetting, SliderSetting } from "./shared";
import { useTranslation } from "@/i18n";
import { invoke } from "@tauri-apps/api/core";
import { logger } from "@/services/logger";

const FALLBACK_FONTS = [
  "Segoe UI Variable Text",
  "Segoe UI",
  "Arial",
  "Consolas",
  "Georgia",
  "Times New Roman",
  "Courier New",
];

interface FontLists {
  system: string[];
  custom: string[];
}

const EMPTY_FONTS: FontLists = { system: FALLBACK_FONTS, custom: [] };

export function EditorSection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();
  const [fonts, setFonts] = useState<FontLists>(EMPTY_FONTS);

  useEffect(() => {
    invoke<FontLists>("get_system_fonts")
      .then((result) => {
        logger.debug(
          "Settings",
          `get_system_fonts: ${result.system.length} system, ${result.custom.length} custom`,
        );
        if (result.system.length > 0 || result.custom.length > 0) {
          setFonts(result);
        }
      })
      .catch((err) => {
        logger.error("Settings", "Failed to load system fonts:", err);
      });
  }, []);

  const hasCustom = fonts.custom.length > 0;

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("editor")}</div>

      <SliderSetting
        label={t("fontSize")}
        value={settings.editorFontSize}
        min={11}
        max={24}
        step={1}
        unit="px"
        onChange={(v) => onUpdate({ editorFontSize: v })}
      />

      <SliderSetting
        label={t("lineSpacing")}
        value={settings.lineHeight}
        min={1.0}
        max={2.5}
        step={0.1}
        onChange={(v) => onUpdate({ lineHeight: v })}
      />

      <div className="settings-group">
        <label className="settings-label">{t("font")}</label>
        <select
          className="settings-select"
          value={settings.fontFamily}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
        >
          {hasCustom && (
            <optgroup label={t("customFonts")}>
              {fonts.custom.map((f) => (
                <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>
                  {f}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={t("systemFonts")}>
            {fonts.system.map((f) => (
              <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>
                {f}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <ButtonGroupSetting
        label={t("tabSize")}
        value={settings.tabSize}
        options={[
          { value: 2, label: "2" },
          { value: 4, label: "4" },
        ]}
        onChange={(v) => onUpdate({ tabSize: v })}
      />

      <ToggleSetting
        label={t("spellCheck")}
        checked={settings.spellCheck}
        onChange={(v) => onUpdate({ spellCheck: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("wordWrap")}
        checked={settings.wordWrap}
        onChange={(v) => onUpdate({ wordWrap: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("lineNumbers")}
        checked={settings.showLineNumbers}
        onChange={(v) => onUpdate({ showLineNumbers: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("highlightCurrentLine")}
        checked={settings.highlightCurrentLine}
        onChange={(v) => onUpdate({ highlightCurrentLine: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("sectionOutline")}
        checked={settings.showSectionOutline}
        onChange={(v) => onUpdate({ showSectionOutline: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />
    </div>
  );
}
