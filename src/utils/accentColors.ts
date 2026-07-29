export interface AccentPreset {
  id: string;
  label: string;
  color: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "blue", label: "Синий", color: "#005fb8" },
  { id: "teal", label: "Бирюзовый", color: "#038387" },
  { id: "green", label: "Зелёный", color: "#107c10" },
  { id: "red", label: "Красный", color: "#c42b1c" },
  { id: "orange", label: "Оранжевый", color: "#ca5010" },
  { id: "amber", label: "Янтарный", color: "#d49c01" },
  { id: "purple", label: "Фиолетовый", color: "#7c3aed" },
  { id: "pink", label: "Розовый", color: "#e3008c" },
  { id: "magenta", label: "Маджента", color: "#b4009e" },
  { id: "navy", label: "Тёмно-синий", color: "#003d82" },
  { id: "steel", label: "Стальной", color: "#4c5a6a" },
  { id: "slate", label: "Серый", color: "#616161" },
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustLightness(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + amount)));
}

function adjustOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export interface AccentVariants {
  default: string;
  hover: string;
  pressed: string;
  light: string;
  lighter: string;
}

export function generateAccentVariants(hex: string): AccentVariants {
  const [, s] = hexToHsl(hex);
  const isDark = s < 10 || adjustLightness(hex, 0) === hex;

  const hover = isDark ? adjustLightness(hex, 8) : adjustLightness(hex, -10);
  const pressed = isDark ? adjustLightness(hex, 16) : adjustLightness(hex, -18);

  return {
    default: hex,
    hover,
    pressed,
    light: adjustOpacity(hex, 0.08),
    lighter: adjustOpacity(hex, 0.04),
  };
}

export function isAccentLight(hex: string): boolean {
  const [, , l] = hexToHsl(hex);
  return l > 55;
}
