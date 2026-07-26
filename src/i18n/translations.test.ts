import { describe, expect, it } from "vitest";
import { getTranslation, getTagLabel } from "./translations";

describe("getTranslation", () => {
  it('returns "Все песни" for ru/allSongs', () => {
    expect(getTranslation("ru", "allSongs")).toBe("Все песни");
  });

  it('returns "All Songs" for en/allSongs', () => {
    expect(getTranslation("en", "allSongs")).toBe("All Songs");
  });

  it('returns "Куплет" for ru/tag_verse', () => {
    expect(getTranslation("ru", "tag_verse")).toBe("Куплет");
  });

  it('returns "Verse" for en/tag_verse', () => {
    expect(getTranslation("en", "tag_verse")).toBe("Verse");
  });

  it("returns key as fallback for ru/nonexistent", () => {
    expect(getTranslation("ru", "nonexistent")).toBe("nonexistent");
  });

  it("returns key as fallback for en/nonexistent", () => {
    expect(getTranslation("en", "nonexistent")).toBe("nonexistent");
  });
});

describe("getTagLabel", () => {
  it('returns "Куплет" for ru/verse', () => {
    expect(getTagLabel("ru", "verse")).toBe("Куплет");
  });

  it('returns "Chorus" for en/chorus', () => {
    expect(getTagLabel("en", "chorus")).toBe("Chorus");
  });
});
