export interface SongTag {
  id: string;
  label: string;
  aliases: string[];
  color: string;
  colorDark: string;
}

import type { Lang } from "@/i18n/translations";
import { getTagLabel } from "@/i18n/translations";

export const DEFAULT_SONG_TAGS: SongTag[] = [
  {
    id: "verse",
    label: "Куплет",
    aliases: ["куплет", "verse"],
    color: "#0078d4",
    colorDark: "#60cdff",
  },
  {
    id: "chorus",
    label: "Припев",
    aliases: ["припев", "chorus"],
    color: "#c239b3",
    colorDark: "#e879f9",
  },
  {
    id: "bridge",
    label: "Бридж",
    aliases: ["бридж", "bridge"],
    color: "#d83b01",
    colorDark: "#f97316",
  },
  {
    id: "intro",
    label: "Интро",
    aliases: ["интро", "вступление", "intro"],
    color: "#7c3aed",
    colorDark: "#a78bfa",
  },
  {
    id: "outro",
    label: "Аутро",
    aliases: ["аутро", "концовка", "outro"],
    color: "#7c3aed",
    colorDark: "#a78bfa",
  },
  {
    id: "prechorus",
    label: "Пред-припев",
    aliases: ["пред-припев", "предприпев", "pre-chorus", "prechorus"],
    color: "#038387",
    colorDark: "#2dd4bf",
  },
  {
    id: "interlude",
    label: "Проигрыш",
    aliases: ["проигрыш", "инструментал", "interlude"],
    color: "#8764b8",
    colorDark: "#c084fc",
  },
  {
    id: "break",
    label: "Пауза",
    aliases: ["пауза", "pause", "break"],
    color: "#9e9e9e",
    colorDark: "#6b6b6b",
  },
  {
    id: "hook",
    label: "Хук",
    aliases: ["хук", "hook"],
    color: "#e74c3c",
    colorDark: "#fca5a5",
  },
  {
    id: "coda",
    label: "Кода",
    aliases: ["кода", "coda"],
    color: "#16a085",
    colorDark: "#5eead4",
  },
  {
    id: "refrain",
    label: "Рефрен",
    aliases: ["рефрен", "refrain"],
    color: "#e67e22",
    colorDark: "#fdba74",
  },
  {
    id: "adlib",
    label: "Адлиб",
    aliases: ["адлиб", "импровизация", "ad-lib", "adlib"],
    color: "#9b59b6",
    colorDark: "#c4b5fd",
  },
  {
    id: "solo",
    label: "Соло",
    aliases: ["соло", "solo"],
    color: "#f39c12",
    colorDark: "#fcd34d",
  },
  {
    id: "spoken",
    label: "Речитатив",
    aliases: ["речитатив", "spoken", "spoken word"],
    color: "#2c3e50",
    colorDark: "#94a3b8",
  },
];

const TAG_REGEX = /^\[([^\]]+)\]$/;
const INLINE_TAG_REGEX = /^\[([^\]]+)\]/;

const CUSTOM_TAG_COLORS = [
  { color: "#0078d4", colorDark: "#60cdff" },
  { color: "#c239b3", colorDark: "#e879f9" },
  { color: "#d83b01", colorDark: "#f97316" },
  { color: "#7c3aed", colorDark: "#a78bfa" },
  { color: "#038387", colorDark: "#2dd4bf" },
  { color: "#8764b8", colorDark: "#c084fc" },
  { color: "#00875a", colorDark: "#34d399" },
  { color: "#c42b1c", colorDark: "#f87171" },
];

const customTagColorMap = new Map<string, { color: string; colorDark: string }>();

function getCustomTagColor(id: string): { color: string; colorDark: string } {
  const existing = customTagColorMap.get(id);
  if (existing) return existing;
  const c = CUSTOM_TAG_COLORS[customTagColorMap.size % CUSTOM_TAG_COLORS.length];
  customTagColorMap.set(id, c);
  return c;
}

export function getLocalizedDefaultTags(lang: Lang): SongTag[] {
  if (lang === "ru") return DEFAULT_SONG_TAGS;
  return DEFAULT_SONG_TAGS.map((t) => ({
    ...t,
    label: getTagLabel(lang, t.id),
  }));
}

export function buildAllTags(customLabels: string[], lang: Lang = "ru"): SongTag[] {
  const defaults = getLocalizedDefaultTags(lang);
  const custom = customLabels.map((label): SongTag => {
    const id = `custom-${label.toLowerCase().replace(/[^a-zа-я0-9]/g, "-")}`;
    const c = getCustomTagColor(id);
    return {
      id,
      label,
      aliases: [label.toLowerCase()],
      color: c.color,
      colorDark: c.colorDark,
    };
  });
  return [...defaults, ...custom];
}

export function parseSongTag(line: string): { tag: SongTag; suffix: string } | null {
  const match = TAG_REGEX.exec(line.trim());
  if (!match) return null;

  const raw = match[1].trim();
  const lower = raw.toLowerCase();

  for (const tag of DEFAULT_SONG_TAGS) {
    for (const alias of tag.aliases) {
      if (lower === alias) {
        return { tag, suffix: "" };
      }
      if (lower.startsWith(alias)) {
        const rest = lower.slice(alias.length).trim();
        if (/^\d+$/.test(rest) || rest === "") {
          return { tag, suffix: rest ? ` ${rest}` : "" };
        }
      }
    }
  }

  return null;
}

export function parseSongTagWithCustoms(
  line: string,
  allTags: SongTag[],
): { tag: SongTag; suffix: string } | null {
  const trimmed = line.trim();
  const match = TAG_REGEX.exec(trimmed);
  if (!match) {
    const inlineMatch = INLINE_TAG_REGEX.exec(trimmed);
    if (inlineMatch) {
      const raw = inlineMatch[1].trim();
      const lower = raw.toLowerCase();
      const customTag: SongTag = {
        id: `custom-${raw.toLowerCase().replace(/[^a-zа-я0-9]/g, "-")}`,
        label: raw,
        aliases: [lower],
        ...getCustomTagColor(`custom-${raw.toLowerCase().replace(/[^a-zа-я0-9]/g, "-")}`),
      };
      return { tag: customTag, suffix: "" };
    }
    return null;
  }

  const raw = match[1].trim();
  const lower = raw.toLowerCase();

  for (const tag of allTags) {
    for (const alias of tag.aliases) {
      if (lower === alias) {
        return { tag, suffix: "" };
      }
      if (lower.startsWith(alias)) {
        const rest = lower.slice(alias.length).trim();
        if (/^\d+$/.test(rest) || rest === "") {
          return { tag, suffix: rest ? ` ${rest}` : "" };
        }
      }
    }
  }

  const customTag: SongTag = {
    id: `custom-${raw.toLowerCase().replace(/[^a-zа-я0-9]/g, "-")}`,
    label: raw,
    aliases: [lower],
    ...getCustomTagColor(`custom-${raw.toLowerCase().replace(/[^a-zа-я0-9]/g, "-")}`),
  };
  return { tag: customTag, suffix: "" };
}

export function parseInlineTag(
  line: string,
  allTags: SongTag[],
): { tag: SongTag; start: number; end: number } | null {
  const match = INLINE_TAG_REGEX.exec(line);
  if (!match) return null;

  const raw = match[1].trim();
  const lower = raw.toLowerCase();
  const start = 0;
  const end = match[0].length;

  for (const tag of allTags) {
    for (const alias of tag.aliases) {
      if (lower === alias) {
        return { tag, start, end };
      }
      if (lower.startsWith(alias)) {
        const rest = lower.slice(alias.length).trim();
        if (/^\d+$/.test(rest) || rest === "") {
          return { tag, start, end };
        }
      }
    }
  }

  const customTag: SongTag = {
    id: `custom-${raw.toLowerCase().replace(/[^a-zа-я0-9]/g, "-")}`,
    label: raw,
    aliases: [lower],
    ...getCustomTagColor(`custom-${raw.toLowerCase().replace(/[^a-zа-я0-9]/g, "-")}`),
  };
  return { tag: customTag, start, end };
}

export function buildTagRegex(): RegExp {
  const allAliases = DEFAULT_SONG_TAGS.flatMap((t) => t.aliases);
  return new RegExp(`^\\[([^\\]]*?(${allAliases.join("|")})[^\\]]*?)\\]$`, "i");
}

export interface LyricSection {
  lineIndex: number;
  charOffset: number;
  label: string;
  tag: SongTag | null;
  lineCount: number;
}

export function parseLyricSections(lyrics: string, allTags?: SongTag[]): LyricSection[] {
  const lines = lyrics.split("\n");
  const sections: LyricSection[] = [];
  let charOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const parsed = allTags ? parseSongTagWithCustoms(lines[i], allTags) : parseSongTag(lines[i]);
    if (parsed) {
      sections.push({
        lineIndex: i,
        charOffset,
        label: lines[i].trim(),
        tag: parsed.tag,
        lineCount: 0,
      });
    }
    charOffset += lines[i].length + 1;
  }

  for (let i = 0; i < sections.length; i++) {
    const nextOffset = i + 1 < sections.length ? sections[i + 1].lineIndex : lines.length;
    sections[i].lineCount = nextOffset - sections[i].lineIndex;
  }

  return sections;
}

export function getAutocompleteTags(
  customLabels?: string[],
  lang: Lang = "ru",
): { label: string; tag: SongTag }[] {
  const allTags = customLabels ? buildAllTags(customLabels, lang) : getLocalizedDefaultTags(lang);
  const seen = new Set<string>();
  const result: { label: string; tag: SongTag }[] = [];
  for (const tag of allTags) {
    for (const alias of tag.aliases) {
      const normalized = alias.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      const display = alias.charAt(0).toUpperCase() + alias.slice(1);
      result.push({ label: display, tag });
    }
    const labelLower = tag.label.toLowerCase();
    if (!seen.has(labelLower)) {
      seen.add(labelLower);
      result.push({ label: tag.label, tag });
    }
  }
  return result;
}
