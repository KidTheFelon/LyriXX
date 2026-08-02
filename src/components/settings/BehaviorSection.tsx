import { useState, useCallback, type ReactNode } from "react";
import type {
  ExportFormat,
  StartupAction,
  SortSongsBy,
  SortCategoriesBy,
  CustomTemplatePreset,
} from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ButtonGroupSetting, SliderSetting, ToggleSetting } from "./shared";
import { useTranslation } from "@/i18n";
import { AnimatedText } from "../AnimatedText";
import { ContextMenu } from "@/components/ContextMenu";

const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "txt", label: "TXT" },
  { value: "md", label: "Markdown" },
  { value: "lrc", label: "LRC" },
];

interface TemplatePreset {
  id: string;
  label: string;
  template: string;
}

const TEMPLATE_PRESETS_RU: TemplatePreset[] = [
  { id: "empty", label: "Пустой", template: "" },
  { id: "default", label: "По умолчанию", template: "[Куплет]\n\n\n[Припев]\n\n" },
  {
    id: "abab",
    label: "ABAB",
    template: "[Куплет 1]\n\n\n[Припев]\n\n\n[Куплет 2]\n\n\n[Припев]\n\n",
  },
  {
    id: "aaba",
    label: "AABA",
    template: "[Куплет 1]\n\n\n[Куплет 2]\n\n\n[Куплет 3]\n\n\n[Припев]\n\n",
  },
  {
    id: "verse-chorus-bridge",
    label: "Куплет-Припев-Бридж",
    template:
      "[Куплет 1]\n\n\n[Припев]\n\n\n[Куплет 2]\n\n\n[Припев]\n\n\n[Бридж]\n\n\n[Припев]\n\n",
  },
  {
    id: "verse-prechorus-chorus",
    label: "Куплет-Пред-припев-Припев",
    template:
      "[Куплет 1]\n\n\n[Пред-припев]\n\n[Припев]\n\n\n[Куплет 2]\n\n\n[Пред-припев]\n\n[Припев]\n\n",
  },
  {
    id: "rap",
    label: "Рэп",
    template:
      "[Интро]\n\n[Куплет 1]\n\n\n[Припев]\n\n\n[Куплет 2]\n\n\n[Припев]\n\n\n[Куплет 3]\n\n\n[Аутро]\n\n",
  },
  {
    id: "pop",
    label: "Поп",
    template:
      "[Интро]\n\n[Куплет 1]\n\n\n[Пред-припев]\n\n[Припев]\n\n\n[Куплет 2]\n\n\n[Пред-припев]\n\n[Припев]\n\n\n[Бридж]\n\n[Припев]\n\n\n[Аутро]\n\n",
  },
];

const TEMPLATE_PRESETS_EN: TemplatePreset[] = [
  { id: "empty", label: "Empty", template: "" },
  { id: "default", label: "Default", template: "[Verse]\n\n\n[Chorus]\n\n" },
  {
    id: "abab",
    label: "ABAB",
    template: "[Verse 1]\n\n\n[Chorus]\n\n\n[Verse 2]\n\n\n[Chorus]\n\n",
  },
  {
    id: "aaba",
    label: "AABA",
    template: "[Verse 1]\n\n\n[Verse 2]\n\n\n[Verse 3]\n\n\n[Chorus]\n\n",
  },
  {
    id: "verse-chorus-bridge",
    label: "Verse-Chorus-Bridge",
    template:
      "[Verse 1]\n\n\n[Chorus]\n\n\n[Verse 2]\n\n\n[Chorus]\n\n\n[Bridge]\n\n\n[Chorus]\n\n",
  },
  {
    id: "verse-prechorus-chorus",
    label: "Verse-Pre-Chorus-Chorus",
    template:
      "[Verse 1]\n\n\n[Pre-Chorus]\n\n[Chorus]\n\n\n[Verse 2]\n\n\n[Pre-Chorus]\n\n[Chorus]\n\n",
  },
  {
    id: "rap",
    label: "Rap",
    template:
      "[Intro]\n\n[Verse 1]\n\n\n[Chorus]\n\n\n[Verse 2]\n\n\n[Chorus]\n\n\n[Verse 3]\n\n\n[Outro]\n\n",
  },
  {
    id: "pop",
    label: "Pop",
    template:
      "[Intro]\n\n[Verse 1]\n\n\n[Pre-Chorus]\n\n[Chorus]\n\n\n[Verse 2]\n\n\n[Pre-Chorus]\n\n[Chorus]\n\n\n[Bridge]\n\n[Chorus]\n\n\n[Outro]\n\n",
  },
];

function normalizeTemplate(s: string): string {
  return s.replace(/\s+$/, "");
}

function TemplatePreview({ template }: { template: string }) {
  if (!template.trim()) {
    return <div className="settings-template-preview settings-template-preview--empty">—</div>;
  }
  const sections = template.split(/\n/).reduce<(string | null)[]>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      acc.push(trimmed);
    } else if (acc.length > 0) {
      acc.push(null);
    }
    return acc;
  }, []);
  const seen = sections.filter((s): s is string => s !== null);
  return (
    <div className="settings-template-preview">
      {seen.map((tag, i) => (
        <span key={`sec-${i}`} className="settings-template-preview-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

/** Вкладка настроек поведения: сортировка, шаблоны, autosave, drag-drop. */
export function BehaviorSection({ settings, onUpdate }: SettingsSectionProps) {
  const { t, lang } = useTranslation();
  const builtInPresets = lang === "ru" ? TEMPLATE_PRESETS_RU : TEMPLATE_PRESETS_EN;
  const customPresets = settings.customTemplatePresets ?? [];
  const allPresets = [...builtInPresets, ...customPresets];
  const normalizedCurrent = normalizeTemplate(settings.defaultSongTemplate);

  const [newPresetName, setNewPresetName] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; customIdx: number } | null>(null);

  const handleSavePreset = useCallback(() => {
    const name = newPresetName.trim();
    if (!name) return;
    const allNames = [...builtInPresets, ...customPresets].map((p) => p.label.toLowerCase());
    if (allNames.includes(name.toLowerCase())) {
      setDuplicateWarning(true);
      return;
    }
    setDuplicateWarning(false);
    const updated: CustomTemplatePreset[] = [
      ...customPresets,
      { label: name, template: settings.defaultSongTemplate },
    ];
    onUpdate({ customTemplatePresets: updated });
    setNewPresetName("");
  }, [newPresetName, customPresets, settings.defaultSongTemplate, builtInPresets, onUpdate]);

  const handleDeletePreset = useCallback(
    (idx: number) => {
      const updated = customPresets.filter((_, i) => i !== idx);
      onUpdate({ customTemplatePresets: updated });
    },
    [customPresets, onUpdate],
  );

  const STARTUP_ACTIONS: { value: StartupAction; label: ReactNode }[] = [
    { value: "empty", label: <AnimatedText translationKey="startupEmpty" /> },
    { value: "lastSong", label: <AnimatedText translationKey="startupLastSong" /> },
  ];

  const SORT_SONGS: { value: SortSongsBy; label: ReactNode }[] = [
    { value: "date", label: <AnimatedText translationKey="sortDate" /> },
    { value: "alphabetical", label: <AnimatedText translationKey="sortAlphabetical" /> },
    { value: "manual", label: <AnimatedText translationKey="sortManual" /> },
  ];

  const SORT_CATEGORIES: { value: SortCategoriesBy; label: ReactNode }[] = [
    { value: "alphabetical", label: <AnimatedText translationKey="sortAlphabetical" /> },
    { value: "manual", label: <AnimatedText translationKey="sortManual" /> },
    { value: "songCount", label: <AnimatedText translationKey="sortSongCount" /> },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="behavior" /></div>

      <SliderSetting
        label={<AnimatedText translationKey="autosaveDelay" />}
        value={settings.autoSaveDelay}
        min={100}
        max={2000}
        step={100}
        unit={<AnimatedText translationKey="ms" />}
        onChange={(v) => onUpdate({ autoSaveDelay: v })}
      />

      <div className="settings-group">
        <label className="settings-label"><AnimatedText translationKey="newSongTemplate" /></label>
        <div className="settings-label-hint"><AnimatedText translationKey="templateDesc" /></div>
        <div className="settings-template-presets">
          {allPresets.map((preset, i) => {
            const isCustom = i >= builtInPresets.length;
            const customIdx = isCustom ? i - builtInPresets.length : -1;
            const isActive = normalizeTemplate(preset.template) === normalizedCurrent;
            return (
              <button
                key={`preset-${i}`}
                className={`settings-template-preset ${isCustom ? "settings-template-preset--custom" : ""} ${isActive ? "active" : ""}`}
                onClick={() => onUpdate({ defaultSongTemplate: preset.template })}
                onContextMenu={(e) => {
                  if (!isCustom) return;
                  e.preventDefault();
                  setCtxMenu({ x: e.clientX, y: e.clientY, customIdx });
                }}
                type="button"
                title={preset.label}
              >
                <span className="settings-template-preset-label">{preset.label}</span>
                {isCustom && (
                  <span
                    className="settings-template-preset-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(customIdx);
                    }}
                    role="button"
                    tabIndex={-1}
                    title={t("delete")}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="settings-template-save-row">
          <input
            className="settings-input"
            value={newPresetName}
            onChange={(e) => {
              setNewPresetName(e.target.value);
              setDuplicateWarning(false);
            }}
            placeholder={t("presetName")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSavePreset();
            }}
          />
          <button
            className="settings-template-save-btn"
            onClick={handleSavePreset}
            type="button"
            disabled={!newPresetName.trim()}
          >
            <AnimatedText translationKey="savePreset" />
          </button>
        </div>
        {duplicateWarning && (
          <div className="settings-template-duplicate-warning"><AnimatedText translationKey="presetExists" /></div>
        )}
        <div className="settings-label-sub"><AnimatedText translationKey="templatePreview" /></div>
        <TemplatePreview template={settings.defaultSongTemplate} />
        <textarea
          className="settings-textarea"
          value={settings.defaultSongTemplate}
          onChange={(e) => onUpdate({ defaultSongTemplate: e.target.value })}
          rows={4}
          placeholder={lang === "ru" ? "[Куплет]&#10;&#10;&#10;[Припев]&#10;&#10;" : "[Verse]&#10;&#10;&#10;[Chorus]&#10;&#10;"}
        />
      </div>

      <ButtonGroupSetting
        label={<AnimatedText translationKey="sortSongsBy" />}
        value={settings.sortSongsBy}
        options={SORT_SONGS}
        onChange={(v) => onUpdate({ sortSongsBy: v })}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="sortCategoriesBy" />}
        value={settings.sortCategoriesBy}
        options={SORT_CATEGORIES}
        onChange={(v) => onUpdate({ sortCategoriesBy: v })}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="startupAction" />}
        value={settings.startupAction}
        options={STARTUP_ACTIONS}
        onChange={(v) => onUpdate({ startupAction: v })}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="confirmOnClose" />}
        checked={settings.confirmOnClose}
        onChange={(v) => onUpdate({ confirmOnClose: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="minimizeToTray" />}
        checked={settings.minimizeToTray}
        onChange={(v) => onUpdate({ minimizeToTray: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="exportFormat" />}
        value={settings.exportFormat}
        options={EXPORT_FORMATS}
        onChange={(v) => onUpdate({ exportFormat: v })}
      />

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            {
              id: "delete",
              label: t("deletePreset"),
              danger: true,
              onClick: () => {
                handleDeletePreset(ctxMenu.customIdx);
                setCtxMenu(null);
              },
            },
          ]}
        />
      )}
    </div>
  );
}
