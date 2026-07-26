import { describe, it, expect } from "vitest";
import { songLanguage } from "./songLanguage";

describe("songLanguage", () => {
  it("returns a CodeMirror language extension", () => {
    const ext = songLanguage();
    expect(ext).toBeTruthy();
  });
});
