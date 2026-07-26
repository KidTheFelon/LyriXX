import { useState } from "react";
import type { AppSettings } from "@/types/settings";

export interface SettingsSectionProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export function ToggleSetting({
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div className="settings-group">
      <label className="settings-label">{label}</label>
      <label className="settings-toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="settings-toggle-slider" />
        <span className="settings-toggle-label">{checked ? onLabel : offLabel}</span>
      </label>
    </div>
  );
}

interface ButtonGroupOption<T extends string | number> {
  value: T;
  label: string;
}

export function ButtonGroupSetting<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ButtonGroupOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="settings-group">
      <label className="settings-label">{label}</label>
      <div className="settings-theme-row">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            className={`settings-theme-btn ${value === opt.value ? "active" : ""}`}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const display = step < 1 ? value.toFixed(1) : String(value);
  return (
    <div className="settings-group">
      <label className="settings-label">{label}</label>
      <div className="settings-font-row">
        <input
          type="range"
          min={String(min)}
          max={String(max)}
          step={String(step)}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="settings-slider"
        />
        <span className="settings-font-value">
          {display}
          {unit ?? ""}
        </span>
      </div>
    </div>
  );
}

export function ConfirmAction({
  label,
  confirmMsg,
  confirmYes,
  confirmNo,
  onConfirm,
  danger,
}: {
  label: string;
  confirmMsg: string;
  confirmYes: string;
  confirmNo: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      {!confirming ? (
        <button
          className={`modal-btn${danger ? " modal-btn-danger" : ""}`}
          onClick={() => setConfirming(true)}
          type="button"
        >
          {label}
        </button>
      ) : (
        <div className="settings-confirm-row">
          <span className="settings-confirm-text">{confirmMsg}</span>
          <button
            className={`modal-btn${danger ? " modal-btn-danger" : ""}`}
            onClick={() => {
              onConfirm();
              setConfirming(false);
            }}
            type="button"
          >
            {confirmYes}
          </button>
          <button className="modal-btn" onClick={() => setConfirming(false)} type="button">
            {confirmNo}
          </button>
        </div>
      )}
    </>
  );
}
