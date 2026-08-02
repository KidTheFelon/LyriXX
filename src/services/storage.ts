import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import type { Song } from "@/types/song";
import type { CustomCategory } from "@/types/category";
import { logger } from "./logger";

/** Абстрактный интерфейс хранилища песен и категорий. */
export interface SongsDb {
  /** Загрузить все песни. */
  loadSongs(): Promise<Song[]>;
  /** Сохранить/обновить песню. */
  saveSong(song: Song): Promise<void>;
  /** Удалить песню по id. */
  deleteSong(id: string): Promise<void>;
  /** Массово удалить песни по id. */
  deleteSongs(ids: string[]): Promise<void>;
  /** Загрузить все категории. */
  loadCategories(): Promise<CustomCategory[]>;
  /** Сохранить/обновить категорию. */
  saveCategory(cat: CustomCategory): Promise<void>;
  /** Удалить категорию по id. */
  deleteCategory(id: string): Promise<void>;
  /** Загрузить значение настройки по ключу. */
  loadSetting<T>(key: string): Promise<T | null>;
  /** Сохранить значение настройки. */
  saveSetting<T>(key: string, value: T): Promise<void>;
  /** Экспортировать БД через диалог сохранения. */
  exportDb(): Promise<void>;
}

/** Реализация SongsDb через Tauri invoke (SQLite бэкенд). */
export class TauriDbService implements SongsDb {
  async loadSongs(): Promise<Song[]> {
    logger.debug("DB", "load_songs: invoking");
    const songs = await invoke<Song[]>("load_songs").catch((err) => {
      logger.error("DB", "load_songs invoke failed:", err);
      throw err;
    });
    logger.debug("DB", `load_songs: ${songs.length} songs`);
    return songs;
  }

  async saveSong(song: Song): Promise<void> {
    logger.debug("DB", `save_song: ${song.id}`);
    await invoke("save_song", { song }).catch((err) => {
      logger.error("DB", `save_song invoke failed (${song.id}):`, err);
      throw err;
    });
    logger.debug("DB", `save_song done: ${song.id}`);
  }

  async deleteSong(id: string): Promise<void> {
    logger.debug("DB", `delete_song: ${id}`);
    await invoke("delete_song", { id }).catch((err) => {
      logger.error("DB", `delete_song invoke failed (${id}):`, err);
      throw err;
    });
    logger.debug("DB", `delete_song done: ${id}`);
  }

  async deleteSongs(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    logger.debug("DB", `delete_songs: ${ids.length} songs`);
    await invoke("delete_songs", { ids }).catch((err) => {
      logger.error("DB", `delete_songs invoke failed (${ids.length} songs):`, err);
      throw err;
    });
    logger.debug("DB", `delete_songs done: ${ids.length} songs`);
  }

  async loadCategories(): Promise<CustomCategory[]> {
    logger.debug("DB", "load_categories: invoking");
    const cats = await invoke<CustomCategory[]>("load_categories").catch((err) => {
      logger.error("DB", "load_categories invoke failed:", err);
      throw err;
    });
    logger.debug("DB", `load_categories: ${cats.length} categories`);
    return cats;
  }

  async saveCategory(cat: CustomCategory): Promise<void> {
    logger.debug("DB", `save_category: ${cat.id}`);
    await invoke("save_category", { category: cat }).catch((err) => {
      logger.error("DB", `save_category invoke failed (${cat.id}):`, err);
      throw err;
    });
    logger.debug("DB", `save_category done: ${cat.id}`);
  }

  async deleteCategory(id: string): Promise<void> {
    logger.debug("DB", `delete_category: ${id}`);
    await invoke("delete_category", { id }).catch((err) => {
      logger.error("DB", `delete_category invoke failed (${id}):`, err);
      throw err;
    });
    logger.debug("DB", `delete_category done: ${id}`);
  }

  async loadSetting<T>(key: string): Promise<T | null> {
    try {
      logger.debug("DB", `load_setting: ${key}`);
      const raw = await invoke<string | null>("load_setting", { key });
      if (raw == null) {
        logger.debug("DB", `load_setting: ${key} not found`);
        return null;
      }
      const parsed = JSON.parse(raw) as T;
      logger.debug("DB", `load_setting: ${key} loaded`);
      return parsed;
    } catch (err) {
      logger.error("DB", `Failed to parse setting ${key}:`, err);
      return null;
    }
  }

  async saveSetting<T>(key: string, value: T): Promise<void> {
    logger.debug("DB", `save_setting: ${key}`);
    await invoke("save_setting", { key, value: JSON.stringify(value) }).catch((err) => {
      logger.error("DB", `save_setting invoke failed (${key}):`, err);
      throw err;
    });
    logger.debug("DB", `save_setting done: ${key}`);
  }

  async exportDb(): Promise<void> {
    logger.info("DB", "export_db: getting db path");
    const src = await invoke<string>("get_db_path_str").catch((err) => {
      logger.error("DB", "export_db: get_db_path_str failed:", err);
      throw err;
    });
    logger.debug("DB", `export_db: src=${src}`);
    const dest = await save({
      filters: [{ name: "SQLite DB", extensions: ["db"] }],
      defaultPath: "lyrixx.db",
    });
    if (!dest) {
      logger.info("DB", "export_db: cancelled by user");
      return;
    }
    logger.info("DB", `export_db: copying to ${dest}`);
    await invoke("copy_file", { src, dest }).catch((err) => {
      logger.error("DB", `export_db: copy_file failed:`, err);
      throw err;
    });
    logger.info("DB", "export_db: done");
  }
}
