import { useState, useEffect } from "react";
import type { CursorStyle } from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ToggleSetting, ButtonGroupSetting, SliderSetting } from "./shared";
import { useTranslation } from "@/i18n";
import { AnimatedText } from "../AnimatedText";
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

/** Вкладка настроек редактора: шрифт, размер, отступ, шаблоны, подсветка. */
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

  const CURSOR_STYLES: { value: CursorStyle; label: React.ReactNode }[] = [
    { value: "line", label: <AnimatedText translationKey="cursorStyleLine" /> },
    { value: "block", label: <AnimatedText translationKey="cursorStyleBlock" /> },
    { value: "underline", label: <AnimatedText translationKey="cursorStyleUnderline" /> },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="editor" /></div>

      <div className="settings-group">
        <label className="settings-label"><AnimatedText translationKey="font" /></label>
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

      <SliderSetting
        label={<AnimatedText translationKey="fontSize" />}
        value={settings.editorFontSize}
        min={11}
        max={24}
        step={1}
        unit="px"
        onChange={(v) => onUpdate({ editorFontSize: v })}
      />

      <SliderSetting
        label={<AnimatedText translationKey="lineSpacing" />}
        value={settings.lineHeight}
        min={1.0}
        max={2.5}
        step={0.1}
        onChange={(v) => onUpdate({ lineHeight: v })}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="tabSize" />}
        value={settings.tabSize}
        options={[
          { value: 2, label: "2" },
          { value: 4, label: "4" },
        ]}
        onChange={(v) => onUpdate({ tabSize: v })}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="wordWrap" />}
        checked={settings.wordWrap}
        onChange={(v) => onUpdate({ wordWrap: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="spellCheck" />}
        checked={settings.spellCheck}
        onChange={(v) => onUpdate({ spellCheck: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="highlightCurrentLine" />}
        checked={settings.highlightCurrentLine}
        onChange={(v) => onUpdate({ highlightCurrentLine: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="lineNumbers" />}
        checked={settings.showLineNumbers}
        onChange={(v) => onUpdate({ showLineNumbers: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="sectionOutline" />}
        checked={settings.showSectionOutline}
        onChange={(v) => onUpdate({ showSectionOutline: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="autocloseBrackets" />}
        checked={settings.autocloseBrackets}
        onChange={(v) => onUpdate({ autocloseBrackets: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="cursorStyle" />}
        value={settings.cursorStyle}
        options={CURSOR_STYLES}
        onChange={(v) => onUpdate({ cursorStyle: v })}
      />

      <SliderSetting
        label={<AnimatedText translationKey="cursorBlinkRate" />}
        value={settings.cursorBlinkRate}
        min={0}
        max={1200}
        step={10}
        unit={<AnimatedText translationKey="ms" />}
        onChange={(v) => onUpdate({ cursorBlinkRate: v })}
      />
    </div>
  );
}
