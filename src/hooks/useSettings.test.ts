import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "./useSettings";
import { createMockDb } from "./__mocks__/storage";
import { DEFAULT_SETTINGS } from "@/types/settings";

describe("useSettings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with DEFAULT_SETTINGS", () => {
    const db = createMockDb();
    const { result } = renderHook(() => useSettings(db));
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("settingsReady becomes true after load", async () => {
    const db = createMockDb();
    const { result } = renderHook(() => useSettings(db));
    expect(result.current.settingsReady).toBe(false);

    await vi.waitFor(() => {
      expect(result.current.settingsReady).toBe(true);
    });
  });

  it("loads saved settings from DB", async () => {
    const db = createMockDb();
    const partial = { editorFontSize: 18, theme: "dark" as const };
    vi.mocked(db.loadSetting).mockResolvedValue(partial);

    const { result } = renderHook(() => useSettings(db));

    await vi.waitFor(() => {
      expect(result.current.settingsReady).toBe(true);
    });

    expect(result.current.settings.editorFontSize).toBe(18);
    expect(result.current.settings.theme).toBe("dark");
    expect(result.current.settings.lineHeight).toBe(DEFAULT_SETTINGS.lineHeight);
  });

  it("updateSettings patches and saves", async () => {
    vi.useFakeTimers();
    const db = createMockDb();
    const { result } = renderHook(() => useSettings(db));

    await vi.waitFor(() => {
      expect(result.current.settingsReady).toBe(true);
    });

    act(() => {
      result.current.updateSettings({ editorFontSize: 20 });
    });

    expect(result.current.settings.editorFontSize).toBe(20);
    expect(db.saveSetting).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(db.saveSetting).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("handles load error gracefully", async () => {
    const db = createMockDb();
    vi.mocked(db.loadSetting).mockRejectedValue(new Error("db fail"));

    const { result } = renderHook(() => useSettings(db));

    await vi.waitFor(() => {
      expect(result.current.settingsReady).toBe(true);
    });

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });
});
