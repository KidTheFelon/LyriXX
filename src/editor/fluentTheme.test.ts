import { describe, it, expect } from "vitest";
import { fluentTheme, fluentSyntax } from "./fluentTheme";

describe("fluentTheme", () => {
  it("exports a theme extension", () => {
    expect(fluentTheme).toBeTruthy();
  });
  it("exports a syntax highlighting extension", () => {
    expect(fluentSyntax).toBeTruthy();
  });
});
