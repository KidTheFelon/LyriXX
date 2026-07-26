import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 150));
    expect(result.current).toBe("hello");
  });

  it("does not update before delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 150 } },
    );
    rerender({ value: "ab", delay: 150 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("a");
    vi.useRealTimers();
  });

  it("updates after the delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 150 } },
    );
    rerender({ value: "ab", delay: 150 });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("ab");
    vi.useRealTimers();
  });

  it("resets timer on rapid changes", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 150 } },
    );
    rerender({ value: "b", delay: 150 });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender({ value: "c", delay: 150 });
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(result.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("c");
    vi.useRealTimers();
  });
});
