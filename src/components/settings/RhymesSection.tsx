import type { RhymeLang } from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ButtonGroupSetting } from "./shared";
import { AnimatedText } from "../AnimatedText";

const DEPTHS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
];

const MAX_RESULTS = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

/** Вкладка настроек рифмовки: язык, алгоритм, пороги, кеширование. */
export function RhymesSection({ settings, onUpdate }: SettingsSectionProps) {
  const LANGS: { value: RhymeLang; label: string | React.ReactNode }[] = [
    { value: "auto", label: <AnimatedText translationKey="autoDetect" /> },
    { value: "ru", label: <AnimatedText translationKey="russian" /> },
    { value: "en", label: <AnimatedText translationKey="english" /> },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="rhymeDict" /></div>

      <ButtonGroupSetting
        label={<AnimatedText translationKey="rhymeLanguage" />}
        value={settings.rhymeLang}
        options={LANGS}
        onChange={(v) => onUpdate({ rhymeLang: v })}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="rhymeSearchDepth" />}
        value={settings.rhymeDepth}
        options={DEPTHS}
        onChange={(v) => onUpdate({ rhymeDepth: v })}
      />

      <ButtonGroupSetting
        label={<AnimatedText translationKey="maxRhymeResults" />}
        value={settings.maxRhymeResults}
        options={MAX_RESULTS}
        onChange={(v) => onUpdate({ maxRhymeResults: v })}
      />
    </div>
  );
}
