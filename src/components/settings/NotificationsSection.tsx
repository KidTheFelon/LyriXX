import type { SettingsSectionProps } from "./shared";
import { ToggleSetting } from "./shared";
import { AnimatedText } from "../AnimatedText";

/** Вкладка настроек уведомлений: включение/отключение, длительность, позиция. */
export function NotificationsSection({ settings, onUpdate }: SettingsSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="notifications" /></div>

      <ToggleSetting
        label={<AnimatedText translationKey="toastAutosave" />}
        checked={settings.toastAutosave}
        onChange={(v) => onUpdate({ toastAutosave: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="toastErrors" />}
        checked={settings.toastErrors}
        onChange={(v) => onUpdate({ toastErrors: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="toastSuccess" />}
        checked={settings.toastSuccess}
        onChange={(v) => onUpdate({ toastSuccess: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />
    </div>
  );
}
