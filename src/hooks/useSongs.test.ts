import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSongs } from "./useSongs";
import { createMockDb } from "./__mocks__/storage";

describe("useSongs", () => {
  it("loads songs and categories on mount", async () => {
    const db = createMockDb();
    const songs = [
      {
        id: "1",
        title: "Test",
        artist: "Me",
        lyrics: "",
        category: "",
        pinned: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    const cats = [{ id: "c1", label: "Work", icon: "music" }];
    vi.mocked(db.loadSongs).mockResolvedValue(songs);
    vi.mocked(db.loadCategories).mockResolvedValue(cats);

    const { result } = renderHook(() => useSongs(db));
    expect(result.current.ready).toBe(false);

    await vi.waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(result.current.songs).toEqual(songs);
    expect(result.current.categories).toEqual(cats);
  });

  it("sets ready=true even if load fails", async () => {
    const db = createMockDb();
    vi.mocked(db.loadSongs).mockRejectedValue(new Error("db fail"));
    vi.mocked(db.loadCategories).mockRejectedValue(new Error("db fail"));

    const { result } = renderHook(() => useSongs(db));
    await vi.waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
    expect(result.current.songs).toEqual([]);
  });

  it("calls onError callback when load fails", async () => {
    const db = createMockDb();
    vi.mocked(db.loadSongs).mockRejectedValue(new Error("db fail"));
    vi.mocked(db.loadCategories).mockRejectedValue(new Error("db fail"));

    const onError = vi.fn();
    renderHook(() => useSongs(db, 300, onError));
    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("addSong creates and persists a song", async () => {
    const db = createMockDb();
    const { result } = renderHook(() => useSongs(db));
    await vi.waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    let id: string;
    await act(async () => {
      id = await result.current.addSong("cat1");
    });

    expect(id!).toBeTruthy();
    expect(result.current.songs).toHaveLength(1);
    expect(result.current.songs[0].category).toBe("cat1");
    expect(db.saveSong).toHaveBeenCalledOnce();
  });

  it("deleteSong removes song and persists deletion", async () => {
    const db = createMockDb();
    vi.mocked(db.loadSongs).mockResolvedValue([
      {
        id: "x",
        title: "To Delete",
        artist: "",
        lyrics: "",
        category: "",
        pinned: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);

    const { result } = renderHook(() => useSongs(db));
    await vi.waitFor(() => {
      expect(result.current.songs).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteSong("x");
    });

    expect(result.current.songs).toHaveLength(0);
    expect(db.deleteSong).toHaveBeenCalledWith("x");
  });

  it("updateSong patches song and schedules save", async () => {
    const db = createMockDb();
    const song = {
      id: "u1",
      title: "Old",
      artist: "",
      lyrics: "",
      category: "",
      pinned: false,
      createdAt: 1,
      updatedAt: 1,
    };
    vi.mocked(db.loadSongs).mockResolvedValue([song]);

    const { result } = renderHook(() => useSongs(db, 50));
    await vi.waitFor(() => {
      expect(result.current.songs).toHaveLength(1);
    });

    await act(async () => {
      result.current.updateSong("u1", { title: "New" });
    });

    expect(result.current.songs[0].title).toBe("New");
    expect(result.current.songs[0].updatedAt).toBeGreaterThan(song.updatedAt);

    await vi.waitFor(() => {
      expect(db.saveSong).toHaveBeenCalled();
    });
  });

  it("calls onError when save fails", async () => {
    const db = createMockDb();
    const onError = vi.fn();
    const { result } = renderHook(() => useSongs(db, 50, onError));
    await vi.waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    let id: string;
    await act(async () => {
      id = await result.current.addSong("cat1");
    });

    vi.mocked(db.saveSong).mockRejectedValue(new Error("save failed"));

    await act(async () => {
      result.current.updateSong(id!, { title: "X" });
    });

    await vi.waitFor(
      () => {
        expect(onError).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });
});
