import type { ThemeMode } from "@/types/settings";
import type { SettingsSectionProps } from "./shared";
import { ToggleSetting, ButtonGroupSetting, SliderSetting } from "./shared";
import { useTranslation } from "@/i18n";

export function UISection({ settings, onUpdate }: SettingsSectionProps) {
  const { t } = useTranslation();

  const THEMES: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t("systemTheme") },
    { value: "light", label: t("lightTheme") },
    { value: "dark", label: t("darkTheme") },
  ];

  const LANGS = [
    { value: "ru" as const, label: t("russian") },
    { value: "en" as const, label: t("english") },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("interface")}</div>

      <ButtonGroupSetting
        label={t("theme")}
        value={settings.theme}
        options={THEMES}
        onChange={(v) => onUpdate({ theme: v })}
      />

      <ToggleSetting
        label={t("compactMode")}
        checked={settings.compactMode}
        onChange={(v) => onUpdate({ compactMode: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("confirmDelete")}
        checked={settings.confirmDelete}
        onChange={(v) => onUpdate({ confirmDelete: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("wordCountStatusBar")}
        checked={settings.showWordCount}
        onChange={(v) => onUpdate({ showWordCount: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <ToggleSetting
        label={t("sidebarDefaultOpen")}
        checked={settings.sidebarDefaultOpen}
        onChange={(v) => onUpdate({ sidebarDefaultOpen: v })}
        onLabel={t("on")}
        offLabel={t("off")}
      />

      <SliderSetting
        label={t("sidebarWidth")}
        value={settings.sidebarWidth}
        min={220}
        max={500}
        step={10}
        unit="px"
        onChange={(v) => onUpdate({ sidebarWidth: v })}
      />

      <ButtonGroupSetting
        label={t("interfaceLanguage")}
        value={settings.language}
        options={LANGS}
        onChange={(v) => onUpdate({ language: v })}
      />
    </div>
  );
}
