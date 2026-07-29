import type { SettingsSectionProps } from "./shared";
import { ToggleSetting } from "./shared";
import { useTranslation } from "@/i18n";

export function AccessibilitySection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("accessibility")}</div>

      <ToggleSetting
        label={t("reducedMotion")}
        checked={settings.reducedMotion}
        onChange={(v) => onUpdate({ reducedMotion: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("highContrast")}
        checked={settings.highContrast}
        onChange={(v) => onUpdate({ highContrast: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />
    </div>
  );
}
