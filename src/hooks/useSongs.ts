import { useState, useCallback, useEffect, useRef } from "react";
import type { Song } from "@/types/song";
import type { CustomCategory } from "@/types/category";
import type { SongsDb } from "@/services/storage";
import { TauriDbService } from "@/services/storage";
import { logger } from "@/services/logger";
import { generateId } from "@/utils/id";
import { DEFAULT_ICON_ID } from "@/types/icons";

/** Хук CRUD-операций для песен и категорий через TauriDbService. */
export function useSongs(
  db: SongsDb = new TauriDbService(),
  autoSaveDelay = 300,
  onError?: (message: string) => void,
) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [ready, setReady] = useState(false);
  const dbRef = useRef(db);
  dbRef.current = db;
  const delayRef = useRef(autoSaveDelay);
  delayRef.current = autoSaveDelay;

  useEffect(() => {
    const svc = dbRef.current;
    Promise.all([svc.loadSongs(), svc.loadCategories()])
      .then(([songData, catData]) => {
        setSongs(songData);
        setCategories(catData);
        setReady(true);
        logger.debug("DB", `loaded: ${songData.length} songs, ${catData.length} categories`);
      })
      .catch((err) => {
        logger.error("DB", "Failed to load data:", err);
        onError?.("errLoadData");
        setReady(true);
      });
  }, []);

  const pendingSaveRef = useRef<{ id: string; song: Song } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const songsRef = useRef<Song[]>(songs);
  songsRef.current = songs;

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const addSong = useCallback(
    async (category: string, lyrics: string = "") => {
      logger.debug("DB", `addSong: category=${category}`);
      const now = Date.now();
      const song: Song = {
        id: generateId(),
        title: "",
        artist: "",
        lyrics,
        category,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await dbRef.current.saveSong(song);
        setSongs((prev) => [song, ...prev]);
        logger.debug("DB", `addSong done: ${song.id}`);
        return song.id;
      } catch (err) {
        logger.error("DB", "addSong failed:", err);
        onError?.("errSaveData");
        return "";
      }
    },
    [onError],
  );

  const updateSong = useCallback((id: string, patch: Partial<Omit<Song, "id" | "createdAt">>) => {
    const now = Date.now();
    setSongs((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: now } : s));
      const song = next.find((s) => s.id === id);
      if (song) pendingSaveRef.current = { id, song };
      return next;
    });

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      pendingSaveRef.current = null;
      try {
        await dbRef.current.saveSong(pending.song);
      } catch (err) {
        logger.error("DB", "Failed to save song:", err);
        onError?.("errSaveData");
      }
    }, delayRef.current);
  }, [onError]);

  const updateSongsCategory = useCallback(
    (ids: string[], categoryId: string) => {
      const now = Date.now();
      const idSet = new Set(ids);
      setSongs((prev) =>
        prev.map((s) => (idSet.has(s.id) ? { ...s, category: categoryId, updatedAt: now } : s)),
      );
      (async () => {
        try {
          const currentSongs = songsRef.current;
          const toSave = currentSongs.filter((s) => idSet.has(s.id)).map((s) => ({ ...s, category: categoryId, updatedAt: now }));
          for (const song of toSave) {
            await dbRef.current.saveSong(song);
          }
          logger.debug("DB", `updateSongsCategory done: ${toSave.length} songs -> ${categoryId}`);
        } catch (err) {
          logger.error("DB", "Failed to batch update category:", err);
          onError?.("errSaveData");
        }
      })();
    },
    [onError],
  );

  const togglePin = useCallback(
    (id: string) => {
      const song = songs.find((s) => s.id === id);
      if (song) {
        logger.debug("DB", `togglePin: ${id} pinned=${!song.pinned}`);
        updateSong(id, { pinned: !song.pinned });
      }
    },
    [songs, updateSong],
  );

  const deleteSong = useCallback(
    async (id: string) => {
      try {
        await dbRef.current.deleteSong(id);
        setSongs((prev) => prev.filter((s) => s.id !== id));
        logger.debug("DB", `deleteSong done: ${id}`);
      } catch (err) {
        logger.error("DB", "Failed to delete song:", err);
        onError?.("errDeleteSong");
      }
    },
    [onError],
  );

  const deleteSongs = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      try {
        await dbRef.current.deleteSongs(ids);
        const idSet = new Set(ids);
        setSongs((prev) => prev.filter((s) => !idSet.has(s.id)));
        logger.debug("DB", `deleteSongs done: ${ids.length} songs`);
      } catch (err) {
        logger.error("DB", "Failed to delete songs:", err);
        onError?.("errDeleteSong");
      }
    },
    [onError],
  );

  const duplicateSong = useCallback(
    async (id: string) => {
      const song = songs.find((s) => s.id === id);
      if (!song) return;
      const now = Date.now();
      const dup: Song = {
        ...song,
        id: generateId(),
        title: song.title ? `${song.title} (копия)` : "",
        createdAt: now,
        updatedAt: now,
      };
      try {
        await dbRef.current.saveSong(dup);
        setSongs((prev) => [dup, ...prev]);
        logger.debug("DB", `duplicateSong done: ${id} -> ${dup.id}`);
        return dup.id;
      } catch (err) {
        logger.error("DB", "Failed to duplicate song:", err);
        onError?.("errSaveData");
        return "";
      }
    },
    [songs, onError],
  );

  const addCategory = useCallback(
    async (label: string) => {
      const cat: CustomCategory = {
        id: generateId(),
        label,
        icon: DEFAULT_ICON_ID,
      };
      try {
        await dbRef.current.saveCategory(cat);
        setCategories((prev) => [...prev, cat]);
        logger.debug("DB", `addCategory done: ${cat.id}`);
        return cat.id;
      } catch (err) {
        logger.error("DB", "Failed to add category:", err);
        onError?.("errAddCategory");
        return "";
      }
    },
    [onError],
  );

  const renameCategory = useCallback(
    async (id: string, label: string) => {
      const cat = categories.find((c) => c.id === id);
      if (!cat) {
        logger.warn("DB", `renameCategory: category ${id} not found`);
        return;
      }
      const updated = { ...cat, label };
      try {
        await dbRef.current.saveCategory(updated);
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        logger.debug("DB", `renameCategory done: ${id} -> "${label}"`);
      } catch (err) {
        logger.error("DB", `renameCategory failed (${id}):`, err);
        onError?.("errAddCategory");
      }
    },
    [categories, onError],
  );

  const updateCategoryIcon = useCallback(
    async (id: string, icon: string) => {
      const cat = categories.find((c) => c.id === id);
      if (!cat) {
        logger.warn("DB", `updateCategoryIcon: category ${id} not found`);
        return;
      }
      const updated = { ...cat, icon };
      try {
        await dbRef.current.saveCategory(updated);
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        logger.debug("DB", `updateCategoryIcon done: ${id} -> ${icon}`);
      } catch (err) {
        logger.error("DB", `updateCategoryIcon failed (${id}):`, err);
        onError?.("errAddCategory");
      }
    },
    [categories, onError],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        await dbRef.current.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setSongs((prev) => prev.map((s) => (s.category === id ? { ...s, category: "" } : s)));
        logger.debug("DB", `deleteCategory done: ${id}`);
      } catch (err) {
        logger.error("DB", "Failed to delete category:", err);
        onError?.("errDeleteCategory");
      }
    },
    [onError],
  );

  return {
    songs,
    categories,
    ready,
    addSong,
    updateSong,
    updateSongsCategory,
    togglePin,
    deleteSong,
    deleteSongs,
    duplicateSong,
    addCategory,
    renameCategory,
    updateCategoryIcon,
    deleteCategory,
  };
}
