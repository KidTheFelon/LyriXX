import { describe, it, expect } from "vitest";
import {
  countSyllablesRu,
  countSyllablesEn,
  countSyllables,
  countLineSyllables,
  countAllSyllables,
} from "./syllables";

describe("countSyllablesRu", () => {
  it("counts basic Russian words", () => {
    expect(countSyllablesRu("привет")).toBe(2);
    expect(countSyllablesRu("музыка")).toBe(3);
    expect(countSyllablesRu("я")).toBe(1);
    expect(countSyllablesRu("кот")).toBe(1);
    expect(countSyllablesRu("жизнь")).toBe(1);
  });

  it("handles single vowel words", () => {
    expect(countSyllablesRu("а")).toBe(1);
    expect(countSyllablesRu("и")).toBe(1);
    expect(countSyllablesRu("о")).toBe(1);
  });

  it("handles empty string", () => {
    expect(countSyllablesRu("")).toBe(0);
  });
});

describe("countSyllablesEn", () => {
  it("counts basic English words", () => {
    expect(countSyllablesEn("hello")).toBe(2);
    expect(countSyllablesEn("beautiful")).toBe(3);
    expect(countSyllablesEn("I")).toBe(1);
    expect(countSyllablesEn("cat")).toBe(1);
  });

  it("handles silent e", () => {
    expect(countSyllablesEn("make")).toBe(1);
    expect(countSyllablesEn("time")).toBe(1);
    expect(countSyllablesEn("love")).toBe(1);
  });

  it("handles words without vowels", () => {
    expect(countSyllablesEn("rhythm")).toBe(1);
    expect(countSyllablesEn("my")).toBe(1);
  });

  it("handles empty string", () => {
    expect(countSyllablesEn("")).toBe(0);
  });
});

describe("countSyllables", () => {
  it("auto-detects Russian", () => {
    expect(countSyllables("привет")).toBe(2);
  });

  it("auto-detects English", () => {
    expect(countSyllables("hello")).toBe(2);
  });

  it("forces Russian", () => {
    expect(countSyllables("привет", "ru")).toBe(2);
  });

  it("forces English", () => {
    expect(countSyllables("hello", "en")).toBe(2);
  });
});

describe("countLineSyllables", () => {
  it("counts syllables in a line", () => {
    expect(countLineSyllables("привет мир")).toBe(3);
    expect(countLineSyllables("hello world")).toBe(3);
  });

  it("handles empty line", () => {
    expect(countLineSyllables("")).toBe(0);
    expect(countLineSyllables("   ")).toBe(0);
  });
});

describe("countAllSyllables", () => {
  it("counts syllables in lyrics", () => {
    const lyrics = "привет мир\nмузыка жизнь";
    expect(countAllSyllables(lyrics)).toBe(7);
  });

  it("skips empty lines", () => {
    const lyrics = "привет\n\nмир";
    expect(countAllSyllables(lyrics)).toBe(3);
  });

  it("handles empty lyrics", () => {
    expect(countAllSyllables("")).toBe(0);
  });
});
