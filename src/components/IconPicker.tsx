import { useRef, useEffect } from "react";
import { CATEGORY_ICONS } from "@/types/icons";
import { useTranslation } from "@/i18n";
import { ICON_PICKER_WIDTH, ICON_PICKER_HEIGHT, ICON_PICKER_GAP } from "@/constants";

interface IconPickerProps {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export function IconPicker({ selected, onSelect, onClose, anchorEl }: IconPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!anchorEl || !ref.current) return;
    const rect = anchorEl.getBoundingClientRect();
    const picker = ref.current;
    picker.style.position = "fixed";
    picker.style.left = `${Math.min(rect.left, window.innerWidth - ICON_PICKER_WIDTH)}px`;
    const bottomSpace = window.innerHeight - rect.bottom;
    picker.style.top = `${rect.bottom + ICON_PICKER_GAP}px`;
    if (bottomSpace < ICON_PICKER_HEIGHT + ICON_PICKER_GAP) {
      picker.style.top = `${Math.max(ICON_PICKER_GAP, rect.top - ICON_PICKER_HEIGHT)}px`;
    }
  }, [anchorEl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="icon-picker" ref={ref} role="dialog" aria-label={t("chooseIcon")}>
      <div className="icon-picker-grid">
        {CATEGORY_ICONS.map((icon) => (
          <button
            key={icon.id}
            className={`icon-picker-item ${selected === icon.id ? "active" : ""}`}
            onClick={() => {
              onSelect(icon.id);
              onClose();
            }}
            title={icon.label}
            type="button"
          >
            {icon.svg}
          </button>
        ))}
      </div>
    </div>
  );
}
