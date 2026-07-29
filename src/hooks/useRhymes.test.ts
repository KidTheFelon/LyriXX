import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRhymes } from "./useRhymes";
import { RHYME_DEBOUNCE_MS } from "@/constants";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

describe("useRhymes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(invoke).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("has correct initial state", () => {
    const { result } = renderHook(() => useRhymes());
    expect(result.current.rhymes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.queryWord).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("clears state when word.length < 2", async () => {
    vi.mocked(invoke).mockResolvedValue({ rhymes: [{ word: "test", score: 1 }], input_syllables: 1 });
    const { result } = renderHook(() => useRhymes());

    act(() => {
      result.current.fetchRhymes("ab");
    });
    act(() => {
      vi.advanceTimersByTime(RHYME_DEBOUNCE_MS + 100);
    });

    await vi.waitFor(() => {
      expect(result.current.rhymes.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.fetchRhymes("a");
    });

    expect(result.current.rhymes).toEqual([]);
    expect(result.current.queryWord).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("calls invoke after debounce for valid word", async () => {
    vi.mocked(invoke).mockResolvedValue({ rhymes: [{ word: "дом", score: 0.5 }], input_syllables: 1 });
    const { result } = renderHook(() => useRhymes());

    act(() => {
      result.current.fetchRhymes("кот");
    });

    expect(invoke).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(RHYME_DEBOUNCE_MS);
    });

    await vi.waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("get_rhymes", { word: "кот", lang: "ru", depth: 2 });
      expect(result.current.rhymes).toEqual([{ word: "дом", score: 0.5 }]);
    });
  });

  it("clearRhymes resets state", async () => {
    vi.mocked(invoke).mockResolvedValue({ rhymes: [{ word: "дом", score: 0.5 }], input_syllables: 1 });
    const { result } = renderHook(() => useRhymes());

    act(() => {
      result.current.fetchRhymes("кот");
    });
    act(() => {
      vi.advanceTimersByTime(RHYME_DEBOUNCE_MS);
    });

    await vi.waitFor(() => {
      expect(result.current.rhymes.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.clearRhymes();
    });

    expect(result.current.rhymes).toEqual([]);
    expect(result.current.queryWord).toBe("");
    expect(result.current.error).toBeNull();
  });
});
