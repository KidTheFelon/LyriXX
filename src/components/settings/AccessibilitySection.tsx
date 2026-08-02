import type { SettingsSectionProps } from "./shared";
import { ToggleSetting } from "./shared";
import { AnimatedText } from "../AnimatedText";

/** Вкладка настроек доступности: уменьшение движений, высокий контраст, размер текста. */
export function AccessibilitySection({ settings, onUpdate }: SettingsSectionProps) {
  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="accessibility" /></div>

      <ToggleSetting
        label={<AnimatedText translationKey="reducedMotion" />}
        checked={settings.reducedMotion}
        onChange={(v) => onUpdate({ reducedMotion: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />

      <ToggleSetting
        label={<AnimatedText translationKey="highContrast" />}
        checked={settings.highContrast}
        onChange={(v) => onUpdate({ highContrast: v })}
        onLabel={<AnimatedText translationKey="on" />}
        offLabel={<AnimatedText translationKey="off" />}
      />
    </div>
  );
}
