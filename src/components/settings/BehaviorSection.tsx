import type { ExportFormat, StartupAction, SortSongsBy, SortCategoriesBy } from "@/types/settings";
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

  const STARTUP_ACTIONS: { value: StartupAction; label: string }[] = [
    { value: "empty", label: t("startupEmpty") },
    { value: "lastSong", label: t("startupLastSong") },
  ];

  const SORT_SONGS: { value: SortSongsBy; label: string }[] = [
    { value: "date", label: t("sortDate") },
    { value: "alphabetical", label: t("sortAlphabetical") },
    { value: "manual", label: t("sortManual") },
  ];

  const SORT_CATEGORIES: { value: SortCategoriesBy; label: string }[] = [
    { value: "alphabetical", label: t("sortAlphabetical") },
    { value: "manual", label: t("sortManual") },
    { value: "songCount", label: t("sortSongCount") },
  ];

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

      <ButtonGroupSetting
        label={t("sortSongsBy")}
        value={settings.sortSongsBy}
        options={SORT_SONGS}
        onChange={(v) => onUpdate({ sortSongsBy: v })}
      />

      <ButtonGroupSetting
        label={t("sortCategoriesBy")}
        value={settings.sortCategoriesBy}
        options={SORT_CATEGORIES}
        onChange={(v) => onUpdate({ sortCategoriesBy: v })}
      />

      <ButtonGroupSetting
        label={t("startupAction")}
        value={settings.startupAction}
        options={STARTUP_ACTIONS}
        onChange={(v) => onUpdate({ startupAction: v })}
      />

      <ToggleSetting
        label={t("confirmOnClose")}
        checked={settings.confirmOnClose}
        onChange={(v) => onUpdate({ confirmOnClose: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("minimizeToTray")}
        checked={settings.minimizeToTray}
        onChange={(v) => onUpdate({ minimizeToTray: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ButtonGroupSetting
        label={t("exportFormat")}
        value={settings.exportFormat}
        options={EXPORT_FORMATS}
        onChange={(v) => onUpdate({ exportFormat: v })}
      />
    </div>
  );
}
