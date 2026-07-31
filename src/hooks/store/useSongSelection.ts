import { useState, useEffect, useMemo, useCallback } from "react";
import type { Song } from "@/types/song";
import { ALL_CATEGORY } from "@/types/category";
import type { CustomCategory } from "@/types/category";
import { logger } from "@/services/logger";
import { EXIT_ANIM_MS } from "@/constants";

interface UseSongSelectionParams {
  songs: Song[];
  categories: CustomCategory[];
  addSong: (category: string, lyrics?: string) => Promise<string>;
  updateSong: (id: string, patch: Partial<Omit<Song, "id" | "createdAt">>) => void;
  deleteSong: (id: string) => Promise<void>;
  sortSongsBy: string;
  sortCategoriesBy: string;
  confirmDelete: boolean;
  defaultSongTemplate: string;
  announce: (msg: string) => void;
  t: (key: string) => string;
}

export function useSongSelection({
  songs,
  categories,
  addSong,
  updateSong,
  deleteSong,
  sortSongsBy,
  sortCategoriesBy,
  confirmDelete,
  defaultSongTemplate,
  announce,
  t,
}: UseSongSelectionParams) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY.id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exitingSongId, setExitingSongId] = useState<string | null>(null);

  const filteredByCategory = useMemo(() => {
    const filtered =
      activeCategory === ALL_CATEGORY.id
        ? songs
        : songs.filter((s) => s.category === activeCategory);
    const pinned = filtered.filter((s) => s.pinned);
    const unpinned = filtered.filter((s) => !s.pinned);

    if (sortSongsBy === "alphabetical") {
      pinned.sort((a, b) => (a.title || a.artist || "").localeCompare(b.title || b.artist || ""));
      unpinned.sort((a, b) => (a.title || a.artist || "").localeCompare(b.title || b.artist || ""));
    } else if (sortSongsBy === "manual") {
      pinned.sort((a, b) => a.createdAt - b.createdAt);
      unpinned.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      pinned.sort((a, b) => b.updatedAt - a.updatedAt);
      unpinned.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    return [...pinned, ...unpinned];
  }, [songs, activeCategory, sortSongsBy]);

  const activeSong = useMemo(() => songs.find((s) => s.id === activeId) ?? null, [songs, activeId]);

  const deletingSong = useMemo(
    () => songs.find((s) => s.id === deletingId) ?? null,
    [songs, deletingId],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) {
      map[cat.id] = songs.filter((s) => s.category === cat.id).length;
    }
    return map;
  }, [songs, categories]);

  const sortedCategories = useMemo(() => {
    const sorted = [...categories];
    if (sortCategoriesBy === "alphabetical") {
      sorted.sort((a, b) => a.label.localeCompare(b.label));
    } else if (sortCategoriesBy === "songCount") {
      sorted.sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
    }
    return sorted;
  }, [categories, sortCategoriesBy, counts]);

  useEffect(() => {
    if (
      activeSong &&
      activeSong.category !== activeCategory &&
      activeCategory !== ALL_CATEGORY.id
    ) {
      setActiveId(null);
    }
  }, [activeSong, activeCategory]);

  const handleCategoryChange = useCallback((cat: string) => {
    logger.debug("App", `category change: ${cat}`);
    setActiveCategory(cat);
    setActiveId(null);
  }, []);

  const handleAddSong = useCallback(async () => {
    try {
      const cat = activeCategory === ALL_CATEGORY.id ? (categories[0]?.id ?? "") : activeCategory;
      const id = await addSong(cat, defaultSongTemplate);
      setActiveId(id);
      logger.debug("App", `song added: ${id}`);
      announce(t("songCreated"));
    } catch (err) {
      logger.error("App", "Failed to add song:", err);
    }
  }, [activeCategory, categories, addSong, defaultSongTemplate, announce, t]);

  const handleConfirmDelete = useCallback(
    async (id?: string) => {
      const targetId = id ?? deletingId;
      if (!targetId) return;
      setExitingSongId(targetId);
      setDeletingId(null);
      await new Promise((r) => setTimeout(r, EXIT_ANIM_MS));
      setExitingSongId(null);
      if (activeId === targetId) {
        setActiveId(null);
      }
      try {
        await deleteSong(targetId);
        logger.debug("App", `song deleted: ${targetId}`);
        announce(t("songDeleted"));
      } catch (err) {
        logger.error("App", "Failed to delete song:", err);
      }
    },
    [deletingId, activeId, deleteSong, announce, t],
  );

  const handleRequestDelete = useCallback(
    (id: string) => {
      if (confirmDelete) {
        setDeletingId(id);
      } else {
        handleConfirmDelete(id);
      }
    },
    [confirmDelete, handleConfirmDelete],
  );

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<Omit<Song, "id" | "createdAt">>) => {
      await updateSong(id, patch);
    },
    [updateSong],
  );

  const dbStats = useMemo(
    () => ({
      songs: songs.length,
      categories: categories.length,
      sizeKb: 0,
    }),
    [songs, categories],
  );

  return {
    activeCategory,
    setActiveCategory,
    activeId,
    setActiveId,
    deletingId,
    setDeletingId,
    exitingSongId,
    setExitingSongId,
    filteredByCategory,
    activeSong,
    deletingSong,
    counts,
    sortedCategories,
    dbStats,
    handleCategoryChange,
    handleAddSong,
    handleConfirmDelete,
    handleRequestDelete,
    handleUpdate,
  };
}
