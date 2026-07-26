import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
}));

vi.mock("./logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

let invoke: Mock;
let save: Mock;

beforeEach(async () => {
  vi.clearAllMocks();
  const core = await import("@tauri-apps/api/core");
  invoke = vi.mocked(core.invoke);
  invoke.mockReset();
  invoke.mockResolvedValue(undefined);
  const dialog = await import("@tauri-apps/plugin-dialog");
  save = vi.mocked(dialog.save);
});

async function loadService() {
  const { TauriDbService } = await import("./storage");
  return new TauriDbService();
}

describe("TauriDbService", () => {
  it("loadSongs calls invoke and returns result", async () => {
    const songs = [{ id: "1", title: "A" }];
    invoke.mockResolvedValue(songs);
    const db = await loadService();
    const result = await db.loadSongs();
    expect(invoke).toHaveBeenCalledWith("load_songs");
    expect(result).toEqual(songs);
  });

  it("saveSong calls invoke with song", async () => {
    const song = { id: "1", title: "X" };
    const db = await loadService();
    await db.saveSong(song as any);
    expect(invoke).toHaveBeenCalledWith("save_song", { song });
  });

  it("deleteSong calls invoke with id", async () => {
    const db = await loadService();
    await db.deleteSong("42");
    expect(invoke).toHaveBeenCalledWith("delete_song", { id: "42" });
  });

  it("loadCategories calls invoke", async () => {
    const cats = [{ id: "c1", name: "Rock" }];
    invoke.mockResolvedValue(cats);
    const db = await loadService();
    const result = await db.loadCategories();
    expect(invoke).toHaveBeenCalledWith("load_categories");
    expect(result).toEqual(cats);
  });

  it("saveCategory calls invoke with category", async () => {
    const cat = { id: "c1", name: "Rock" };
    const db = await loadService();
    await db.saveCategory(cat as any);
    expect(invoke).toHaveBeenCalledWith("save_category", { category: cat });
  });

  it("deleteCategory calls invoke with id", async () => {
    const db = await loadService();
    await db.deleteCategory("c1");
    expect(invoke).toHaveBeenCalledWith("delete_category", { id: "c1" });
  });

  it("loadSetting parses JSON from invoke", async () => {
    invoke.mockResolvedValue(JSON.stringify({ theme: "dark" }));
    const db = await loadService();
    const result = await db.loadSetting("theme");
    expect(invoke).toHaveBeenCalledWith("load_setting", { key: "theme" });
    expect(result).toEqual({ theme: "dark" });
  });

  it("loadSetting returns null when raw is null", async () => {
    invoke.mockResolvedValue(null);
    const db = await loadService();
    const result = await db.loadSetting("missing");
    expect(result).toBeNull();
  });

  it("loadSetting returns null on parse error", async () => {
    invoke.mockResolvedValue("not json {{{");
    const db = await loadService();
    const result = await db.loadSetting("bad");
    expect(result).toBeNull();
  });

  it("saveSetting stringifies value before invoke", async () => {
    const db = await loadService();
    await db.saveSetting("volume", 42);
    expect(invoke).toHaveBeenCalledWith("save_setting", {
      key: "volume",
      value: "42",
    });
  });

  it("exportDb calls get_db_path_str then save dialog then copy_file", async () => {
    invoke.mockResolvedValueOnce("/path/to/lyrixx.db").mockResolvedValueOnce(undefined);
    save.mockResolvedValue("/dest/backup.db" as any);

    const db = await loadService();
    await db.exportDb();

    expect(invoke).toHaveBeenCalledWith("get_db_path_str");
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ name: "SQLite DB", extensions: ["db"] }],
        defaultPath: "lyrixx.db",
      }),
    );
    expect(invoke).toHaveBeenCalledWith("copy_file", {
      src: "/path/to/lyrixx.db",
      dest: "/dest/backup.db",
    });
  });

  it("exportDb does nothing when save dialog cancelled", async () => {
    invoke.mockResolvedValue("/path/to/lyrixx.db");
    save.mockResolvedValue(null as any);

    const db = await loadService();
    await db.exportDb();

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith("get_db_path_str");
    expect(invoke).not.toHaveBeenCalledWith("copy_file", expect.anything());
  });
});
