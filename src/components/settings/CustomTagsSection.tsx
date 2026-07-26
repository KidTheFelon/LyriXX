import { useState } from "react";
import { getLocalizedDefaultTags } from "@/types/songTags";
import type { SettingsSectionProps } from "./shared";
import { useTranslation } from "@/i18n";

export function CustomTagsSection({ settings, onUpdate }: SettingsSectionProps) {
  const [newTagValue, setNewTagValue] = useState("");
  const { t, lang } = useTranslation();
  const builtinTags = getLocalizedDefaultTags(lang);

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("customTags")}</div>

      <div className="settings-group">
        <label className="settings-label">{t("builtinTags")}</label>
        <div className="settings-tag-list">
          {builtinTags.map((tag) => (
            <span
              key={tag.id}
              className="settings-tag-chip"
              style={{ color: tag.color, background: `${tag.color}14` }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {settings.customTags.length > 0 && (
        <div className="settings-group">
          <label className="settings-label">{t("yourTags")}</label>
          <div className="settings-tag-list">
            {settings.customTags.map((tag) => (
              <span key={tag} className="settings-tag-chip settings-tag-chip--custom">
                {tag}
                <button
                  className="settings-tag-remove"
                  onClick={() => {
                    onUpdate({ customTags: settings.customTags.filter((t) => t !== tag) });
                  }}
                  type="button"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="settings-group">
        <div className="settings-font-row">
          <input
            className="settings-input"
            placeholder={t("newTag")}
            value={newTagValue}
            onChange={(e) => setNewTagValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTagValue.trim()) {
                onUpdate({ customTags: [...settings.customTags, newTagValue.trim()] });
                setNewTagValue("");
              }
            }}
          />
          <button
            className="modal-btn modal-btn-confirm"
            onClick={() => {
              if (newTagValue.trim()) {
                onUpdate({ customTags: [...settings.customTags, newTagValue.trim()] });
                setNewTagValue("");
              }
            }}
            type="button"
          >
            {t("add")}
          </button>
        </div>
      </div>
    </div>
  );
}
