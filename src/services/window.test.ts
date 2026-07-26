import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

const mockMinimize = vi.fn().mockResolvedValue(undefined);
const mockToggleMaximize = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockWin = {
  minimize: mockMinimize,
  toggleMaximize: mockToggleMaximize,
  close: mockClose,
};

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => mockWin),
}));

vi.mock("@/services/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("getWindowAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns object with minimize/toggleMaximize/close", async () => {
    const { getWindowAPI } = await import("./window");
    const api = getWindowAPI();
    expect(typeof api.minimize).toBe("function");
    expect(typeof api.toggleMaximize).toBe("function");
    expect(typeof api.close).toBe("function");
  });

  it("minimize calls win.minimize", async () => {
    const { getWindowAPI } = await import("./window");
    const api = getWindowAPI();
    api.minimize();
    expect(mockMinimize).toHaveBeenCalledTimes(1);
  });

  it("toggleMaximize calls win.toggleMaximize", async () => {
    const { getWindowAPI } = await import("./window");
    const api = getWindowAPI();
    api.toggleMaximize();
    expect(mockToggleMaximize).toHaveBeenCalledTimes(1);
  });

  it("close calls win.close", async () => {
    const { getWindowAPI } = await import("./window");
    const api = getWindowAPI();
    api.close();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("returns no-ops when getCurrentWindow throws", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    (getCurrentWindow as Mock).mockImplementation(() => {
      throw new Error("no window");
    });
    const { getWindowAPI } = await import("./window");
    const api = getWindowAPI();
    expect(() => api.minimize()).not.toThrow();
    expect(() => api.toggleMaximize()).not.toThrow();
    expect(() => api.close()).not.toThrow();
  });
});
