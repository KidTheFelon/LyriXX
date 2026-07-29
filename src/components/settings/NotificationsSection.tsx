import type { SettingsSectionProps } from "./shared";
import { ToggleSetting } from "./shared";
import { useTranslation } from "@/i18n";

export function NotificationsSection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("notifications")}</div>

      <ToggleSetting
        label={t("toastAutosave")}
        checked={settings.toastAutosave}
        onChange={(v) => onUpdate({ toastAutosave: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("toastErrors")}
        checked={settings.toastErrors}
        onChange={(v) => onUpdate({ toastErrors: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("toastSuccess")}
        checked={settings.toastSuccess}
        onChange={(v) => onUpdate({ toastSuccess: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />
    </div>
  );
}
