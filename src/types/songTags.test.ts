import { describe, it, expect } from "vitest";
import {
  DEFAULT_SONG_TAGS,
  getLocalizedDefaultTags,
  buildAllTags,
  parseSongTag,
  parseSongTagWithCustoms,
  parseInlineTag,
  buildTagRegex,
  parseLyricSections,
  getAutocompleteTags,
} from "./songTags";

describe("DEFAULT_SONG_TAGS", () => {
  it("has 14 items", () => {
    expect(DEFAULT_SONG_TAGS).toHaveLength(14);
  });

  it("each tag has id, label, aliases, color, colorDark", () => {
    for (const tag of DEFAULT_SONG_TAGS) {
      expect(tag).toHaveProperty("id");
      expect(tag).toHaveProperty("label");
      expect(tag).toHaveProperty("aliases");
      expect(tag).toHaveProperty("color");
      expect(tag).toHaveProperty("colorDark");
      expect(typeof tag.id).toBe("string");
      expect(typeof tag.label).toBe("string");
      expect(Array.isArray(tag.aliases)).toBe(true);
      expect(tag.aliases.length).toBeGreaterThan(0);
      expect(typeof tag.color).toBe("string");
      expect(typeof tag.colorDark).toBe("string");
    }
  });
});

describe("getLocalizedDefaultTags", () => {
  it('returns DEFAULT_SONG_TAGS for "ru"', () => {
    expect(getLocalizedDefaultTags("ru")).toEqual(DEFAULT_SONG_TAGS);
  });

  it('returns translated labels for "en"', () => {
    const en = getLocalizedDefaultTags("en");
    expect(en).toHaveLength(14);
    for (const tag of en) {
      expect(typeof tag.label).toBe("string");
      expect(tag.label.length).toBeGreaterThan(0);
    }
    const verseEn = en.find((t) => t.id === "verse");
    expect(verseEn?.label).not.toBe("Куплет");
  });
});

describe("buildAllTags", () => {
  it("returns only defaults when customLabels is empty", () => {
    const result = buildAllTags([]);
    expect(result).toHaveLength(14);
  });

  it('adds custom tag with id "custom-mytag"', () => {
    const result = buildAllTags(["MyTag"]);
    expect(result).toHaveLength(15);
    const custom = result[14];
    expect(custom.id).toBe("custom-mytag");
    expect(custom.label).toBe("MyTag");
    expect(custom.aliases).toEqual(["mytag"]);
  });
});

describe("parseSongTag", () => {
  it('returns verse tag for "[Куплет]"', () => {
    const result = parseSongTag("[Куплет]");
    expect(result).not.toBeNull();
    expect(result!.tag.id).toBe("verse");
    expect(result!.suffix).toBe("");
  });

  it('returns verse with suffix " 2" for "[Куплет 2]"', () => {
    const result = parseSongTag("[Куплет 2]");
    expect(result).not.toBeNull();
    expect(result!.tag.id).toBe("verse");
    expect(result!.suffix).toBe(" 2");
  });

  it("returns null for [Unknown]", () => {
    expect(parseSongTag("[Unknown]")).toBeNull();
  });

  it("returns null for plain text", () => {
    expect(parseSongTag("plain text")).toBeNull();
  });
});

describe("parseSongTagWithCustoms", () => {
  it("works with built-in tags", () => {
    const allTags = buildAllTags([]);
    const result = parseSongTagWithCustoms("[Куплет]", allTags);
    expect(result).not.toBeNull();
    expect(result!.tag.id).toBe("verse");
  });

  it("works with custom tags", () => {
    const allTags = buildAllTags(["MyTag"]);
    const result = parseSongTagWithCustoms("[MyTag]", allTags);
    expect(result).not.toBeNull();
    expect(result!.tag.id).toBe("custom-mytag");
  });

  it("creates custom tag for unknown [Foo]", () => {
    const allTags = buildAllTags([]);
    const result = parseSongTagWithCustoms("[Foo]", allTags);
    expect(result).not.toBeNull();
    expect(result!.tag.id).toBe("custom-foo");
    expect(result!.tag.label).toBe("Foo");
  });
});

describe("parseInlineTag", () => {
  it('returns tag with start/end for "[verse]rest of line"', () => {
    const allTags = buildAllTags([]);
    const result = parseInlineTag("[verse]rest of line", allTags);
    expect(result).not.toBeNull();
    expect(result!.tag.id).toBe("verse");
    expect(result!.start).toBe(0);
    expect(result!.end).toBe(7);
  });

  it("returns null for no tag", () => {
    const allTags = buildAllTags([]);
    expect(parseInlineTag("no tag", allTags)).toBeNull();
  });
});

describe("buildTagRegex", () => {
  it("returns a RegExp that matches known aliases", () => {
    const regex = buildTagRegex();
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex.test("[куплет]")).toBe(true);
    expect(regex.test("[verse]")).toBe(true);
    expect(regex.test("[припев]")).toBe(true);
    expect(regex.test("[chorus]")).toBe(true);
    expect(regex.test("[Куплет 2]")).toBe(true);
    expect(regex.test("[unknown]")).toBe(false);
    expect(regex.test("plain text")).toBe(false);
  });
});

describe("parseLyricSections", () => {
  it("parses lyrics with sections and computes lineCount", () => {
    const lyrics = "[Куплет]\nline 1\nline 2\n[Припев]\nchorus 1\nchorus 2\nchorus 3";
    const sections = parseLyricSections(lyrics);
    expect(sections).toHaveLength(2);
    expect(sections[0].tag.id).toBe("verse");
    expect(sections[0].lineIndex).toBe(0);
    expect(sections[0].lineCount).toBe(3);
    expect(sections[1].tag.id).toBe("chorus");
    expect(sections[1].lineIndex).toBe(3);
    expect(sections[1].lineCount).toBe(4);
  });

  it("returns empty array for no tags", () => {
    const lyrics = "just some lyrics\nno tags here";
    expect(parseLyricSections(lyrics)).toEqual([]);
  });
});

describe("getAutocompleteTags", () => {
  it("returns array with label+tag objects", () => {
    const result = getAutocompleteTags();
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("tag");
      expect(typeof item.label).toBe("string");
    }
  });

  it("includes custom tag when customLabels provided", () => {
    const result = getAutocompleteTags(["Custom"]);
    const customItem = result.find((i) => i.tag.id === "custom-custom");
    expect(customItem).toBeDefined();
    expect(customItem!.label).toBe("Custom");
  });
});
