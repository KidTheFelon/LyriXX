import { describe, expect, it } from "vitest";
import { generateId } from "./id";

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("contains a timestamp prefix", () => {
    const id = generateId();
    const ts = parseInt(id.slice(0, 13), 10);
    expect(Number.isNaN(ts)).toBe(false);
    expect(ts).toBeGreaterThan(0);
  });
});
