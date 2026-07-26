import type { ExportFormat } from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ButtonGroupSetting, SliderSetting, ToggleSetting } from "./shared";
import { useTranslation } from "@/i18n";

const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "txt", label: "TXT" },
  { value: "md", label: "Markdown" },
  { value: "lrc", label: "LRC" },
];

export function BehaviorSection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("behavior")}</div>

      <SliderSetting
        label={t("autosaveDelay")}
        value={settings.autoSaveDelay}
        min={100}
        max={2000}
        step={100}
        unit={t("ms")}
        onChange={(v) => onUpdate({ autoSaveDelay: v })}
      />

      <ButtonGroupSetting
        label={t("exportFormat")}
        value={settings.exportFormat}
        options={EXPORT_FORMATS}
        onChange={(v) => onUpdate({ exportFormat: v })}
      />

      <div className="settings-group">
        <label className="settings-label">{t("newSongTemplate")}</label>
        <textarea
          className="settings-textarea"
          value={settings.defaultSongTemplate}
          onChange={(e) => onUpdate({ defaultSongTemplate: e.target.value })}
          rows={4}
          placeholder="[Куплет]&#10;&#10;&#10;[Припев]&#10;&#10;"
        />
      </div>

      <ToggleSetting
        label={t("minimizeToTray")}
        checked={settings.minimizeToTray}
        onChange={(v) => onUpdate({ minimizeToTray: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />
    </div>
  );
}
