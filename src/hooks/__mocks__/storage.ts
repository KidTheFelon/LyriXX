import { vi } from "vitest";
import type { SongsDb } from "@/services/storage";

export function createMockDb(): SongsDb {
  return {
    loadSongs: vi.fn().mockResolvedValue([]),
    saveSong: vi.fn().mockResolvedValue(undefined),
    deleteSong: vi.fn().mockResolvedValue(undefined),
    deleteSongs: vi.fn().mockResolvedValue(undefined),
    loadCategories: vi.fn().mockResolvedValue([]),
    saveCategory: vi.fn().mockResolvedValue(undefined),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    loadSetting: vi.fn().mockResolvedValue(null),
    saveSetting: vi.fn().mockResolvedValue(undefined),
    exportDb: vi.fn().mockResolvedValue(undefined),
  };
}
