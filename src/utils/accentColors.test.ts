import { describe, it, expect } from "vitest";
import { generateAccentVariants, isAccentLight, ACCENT_PRESETS } from "./accentColors";

describe("accentColors", () => {
  describe("generateAccentVariants", () => {
    it("returns all variant keys", () => {
      const v = generateAccentVariants("#005fb8");
      expect(v).toHaveProperty("default");
      expect(v).toHaveProperty("hover");
      expect(v).toHaveProperty("pressed");
      expect(v).toHaveProperty("light");
      expect(v).toHaveProperty("lighter");
    });

    it("default matches input", () => {
      const v = generateAccentVariants("#005fb8");
      expect(v.default).toBe("#005fb8");
    });

    it("hover differs from default", () => {
      const v = generateAccentVariants("#005fb8");
      expect(v.hover).not.toBe(v.default);
    });

    it("pressed differs from default", () => {
      const v = generateAccentVariants("#005fb8");
      expect(v.pressed).not.toBe(v.default);
    });

    it("light is rgba with 0.08 opacity", () => {
      const v = generateAccentVariants("#005fb8");
      expect(v.light).toMatch(/^rgba\(0, 95, 184, 0\.08\)$/);
    });

    it("lighter is rgba with 0.04 opacity", () => {
      const v = generateAccentVariants("#005fb8");
      expect(v.lighter).toMatch(/^rgba\(0, 95, 184, 0\.04\)$/);
    });
  });

  describe("isAccentLight", () => {
    it("dark blue is not light", () => {
      expect(isAccentLight("#005fb8")).toBe(false);
    });

    it("light blue is light", () => {
      expect(isAccentLight("#60cdff")).toBe(true);
    });

    it("white is light", () => {
      expect(isAccentLight("#ffffff")).toBe(true);
    });

    it("black is not light", () => {
      expect(isAccentLight("#000000")).toBe(false);
    });
  });

  describe("ACCENT_PRESETS", () => {
    it("has 12 presets", () => {
      expect(ACCENT_PRESETS).toHaveLength(12);
    });

    it("each preset has id, label, color", () => {
      for (const p of ACCENT_PRESETS) {
        expect(p.id).toBeTruthy();
        expect(p.label).toBeTruthy();
        expect(p.color).toMatch(/^#[0-9a-f]{6}$/);
      }
    });
  });
});
