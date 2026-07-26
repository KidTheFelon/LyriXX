import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function fireKeydown(key: string, opts: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      ...opts,
    }),
  );
}

describe("useKeyboardShortcuts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Ctrl+N calls onNewSong when not in input", () => {
    const onNewSong = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNewSong }));

    fireKeydown("n", { ctrlKey: true });
    expect(onNewSong).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+F calls onFocusSearch when not in input", () => {
    const onFocusSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onFocusSearch }));

    fireKeydown("f", { ctrlKey: true });
    expect(onFocusSearch).toHaveBeenCalledTimes(1);
  });

  it("Delete calls onRequestDelete when deleteEnabled", () => {
    const onRequestDelete = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onRequestDelete, deleteEnabled: true }));

    fireKeydown("Delete");
    expect(onRequestDelete).toHaveBeenCalledTimes(1);
  });

  it("does nothing when in input", () => {
    const onNewSong = vi.fn();
    const onFocusSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNewSong, onFocusSearch }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireKeydown("n", { ctrlKey: true });
    fireKeydown("f", { ctrlKey: true });

    expect(onNewSong).not.toHaveBeenCalled();
    expect(onFocusSearch).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("does nothing when in textarea", () => {
    const onNewSong = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNewSong }));

    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    ta.focus();

    fireKeydown("n", { ctrlKey: true });
    expect(onNewSong).not.toHaveBeenCalled();

    document.body.removeChild(ta);
  });

  it("does nothing when onNewSong not provided", () => {
    renderHook(() => useKeyboardShortcuts({}));

    fireKeydown("n", { ctrlKey: true });
  });
});
