import { describe, it, expect } from "vitest";
import { computeCharIds, getCurrentWord } from "./charUtils";

describe("computeCharIds", () => {
  it("assigns sequential ids to empty old array", () => {
    const result = computeCharIds("abc", "", [], { current: 0 });
    expect(result).toEqual([0, 1, 2]);
  });

  it("preserves unchanged prefix", () => {
    const oldIds = [0, 1, 2];
    const result = computeCharIds("abcd", "abc", oldIds, { current: 3 });
    expect(result.slice(0, 3)).toEqual([0, 1, 2]);
    expect(result).toHaveLength(4);
  });

  it("generates new ids for inserted chars", () => {
    const oldIds = [0, 1, 2];
    const nextId = { current: 10 };
    const result = computeCharIds("axbc", "abc", oldIds, nextId);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(10);
    expect(result[2]).toBe(1);
    expect(result[3]).toBe(2);
  });
});

describe("getCurrentWord", () => {
  it("returns null for empty value", () => {
    expect(getCurrentWord("", 0)).toBeNull();
  });

  it("returns null for single char", () => {
    expect(getCurrentWord("a", 1)).toBeNull();
  });

  it("finds word at cursor position", () => {
    const result = getCurrentWord("hello world", 5);
    expect(result).toEqual({ word: "hello", start: 0, end: 5 });
  });

  it("finds word in middle of text", () => {
    const result = getCurrentWord("hello world", 7);
    expect(result).toEqual({ word: "world", start: 6, end: 11 });
  });

  it("handles word at start", () => {
    const result = getCurrentWord("test rest", 2);
    expect(result).toEqual({ word: "test", start: 0, end: 4 });
  });
});
