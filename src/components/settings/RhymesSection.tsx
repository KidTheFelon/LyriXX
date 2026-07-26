import type { RhymeLang } from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ButtonGroupSetting } from "./shared";
import { useTranslation } from "@/i18n";

const DEPTHS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
];

export function RhymesSection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();

  const LANGS: { value: RhymeLang; label: string }[] = [
    { value: "auto", label: t("autoDetect") },
    { value: "ru", label: t("russian") },
    { value: "en", label: t("english") },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("rhymeDict")}</div>

      <ButtonGroupSetting
        label={t("rhymeLanguage")}
        value={settings.rhymeLang}
        options={LANGS}
        onChange={(v) => onUpdate({ rhymeLang: v })}
      />

      <ButtonGroupSetting
        label={t("rhymeSearchDepth")}
        value={settings.rhymeDepth}
        options={DEPTHS}
        onChange={(v) => onUpdate({ rhymeDepth: v })}
      />
    </div>
  );
}
