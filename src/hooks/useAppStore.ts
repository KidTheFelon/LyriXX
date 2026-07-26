import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Song } from "@/types/song";
import { ALL_CATEGORY } from "@/types/category";
import { useSongs } from "./useSongs";
import { useSettings } from "./useSettings";
import { useMicaThemeSync } from "./useMicaEffect";
import { TauriDbService } from "@/services/storage";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { logger } from "@/services/logger";
import type { ToastData } from "@/components/Toast";
import { useTranslation } from "@/i18n";
import { NARROW_WIDTH, FONT_SIZE_MIN, FONT_SIZE_MAX, EXIT_ANIM_MS } from "@/constants";

const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 500;
const SONGLIST_MIN = 150;
const SONGLIST_MAX = 500;

export function useAppStore() {
  const { t } = useTranslation();

  const { settings, updateSettings, settingsReady } = useSettings();
  useMicaThemeSync(settings.theme);

  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastData["type"] = "error") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const {
    songs,
    categories,
    ready: songsReady,
    addSong,
    updateSong,
    togglePin,
    deleteSong,
    deleteSongs,
    addCategory,
    renameCategory,
    updateCategoryIcon,
    deleteCategory,
  } = useSongs(undefined, settings.autoSaveDelay, addToast);

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY.id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < NARROW_WIDTH);

  const sidebarCollapsedRef = useRef(sidebarCollapsed);
  sidebarCollapsedRef.current = sidebarCollapsed;
  const autoCollapsedRef = useRef(false);

  useEffect(() => {
    if (settingsReady) {
      if (window.innerWidth < NARROW_WIDTH) {
        setSidebarCollapsed(true);
        autoCollapsedRef.current = true;
      } else {
        setSidebarCollapsed(!settings.sidebarDefaultOpen);
      }
    }
  }, [settings.sidebarDefaultOpen, settingsReady]);

  useEffect(() => {
    const onResize = () => {
      const narrow = window.innerWidth < NARROW_WIDTH;
      setIsNarrow(narrow);
      if (narrow && !sidebarCollapsedRef.current) {
        autoCollapsedRef.current = true;
        setSidebarCollapsed(true);
      } else if (!narrow && autoCollapsedRef.current) {
        autoCollapsedRef.current = false;
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exitingSongId, setExitingSongId] = useState<string | null>(null);
  const [backups, setBackups] = useState<
    { filename: string; size_kb: number; timestamp: string }[]
  >([]);
  const announceRef = useRef<HTMLDivElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSelectedIds, setDeletingSelectedIds] = useState<string[] | null>(null);

  const [recoveryInfo, setRecoveryInfo] = useState<{
    was_recovered: boolean;
    backups: { filename: string; size_kb: number; timestamp: string }[];
  } | null>(null);

  useEffect(() => {
    invoke<{
      was_recovered: boolean;
      backups: { filename: string; size_kb: number; timestamp: string }[];
    }>("check_db_recovery")
      .then((info) => {
        if (info.was_recovered) {
          setRecoveryInfo(info);
        }
      })
      .catch((err) => {
        logger.error("App", "check_db_recovery invoke failed:", err);
      });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    const cs = getComputedStyle(root);
    const vars = [
      "--bg-mica",
      "--bg-mica-alt",
      "--bg-card",
      "--bg-card-solid",
      "--bg-layer",
      "--bg-chrome",
      "--bg-acrylic",
      "--text-primary",
      "--text-secondary",
      "--accent-default",
    ];
    const vals = vars.map((v) => `${v}=${cs.getPropertyValue(v).trim()}`);
    logger.info("Theme", `Changed to "${theme}" | ${vals.join(" | ")}`);
  }, [settings.theme]);

  useEffect(() => {
    const clamped = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, settings.editorFontSize));
    document.documentElement.style.setProperty("--editor-font-size", `${clamped}px`);
  }, [settings.editorFontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty("--navpane-w", `${settings.sidebarWidth}px`);
  }, [settings.sidebarWidth]);

  useEffect(() => {
    document.documentElement.style.setProperty("--listpane-w", `${settings.songListWidth}px`);
  }, [settings.songListWidth]);

  const sidebarWidthRef = useRef(settings.sidebarWidth);
  sidebarWidthRef.current = settings.sidebarWidth;
  const songListWidthRef = useRef(settings.songListWidth);
  songListWidthRef.current = settings.songListWidth;

  const handleSidebarResize = useCallback(
    (delta: number) => {
      const next = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, sidebarWidthRef.current + delta));
      sidebarWidthRef.current = next;
      updateSettings({ sidebarWidth: next });
    },
    [updateSettings],
  );

  const handleSongListResize = useCallback(
    (delta: number) => {
      const next = Math.max(SONGLIST_MIN, Math.min(SONGLIST_MAX, songListWidthRef.current + delta));
      songListWidthRef.current = next;
      updateSettings({ songListWidth: next });
    },
    [updateSettings],
  );

  const filteredByCategory = useMemo(() => {
    const filtered =
      activeCategory === ALL_CATEGORY.id
        ? songs
        : songs.filter((s) => s.category === activeCategory);
    return [...filtered].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [songs, activeCategory]);

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

  useEffect(() => {
    if (
      activeSong &&
      activeSong.category !== activeCategory &&
      activeCategory !== ALL_CATEGORY.id
    ) {
      setActiveId(null);
    }
  }, [activeSong, activeCategory]);

  const announce = useCallback((msg: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = msg;
    }
  }, []);

  const handleCategoryChange = useCallback((cat: string) => {
    logger.debug("App", `category change: ${cat}`);
    setActiveCategory(cat);
    setActiveId(null);
  }, []);

  const handleAddSong = useCallback(async () => {
    try {
      const cat = activeCategory === ALL_CATEGORY.id ? (categories[0]?.id ?? "") : activeCategory;
      const id = await addSong(cat, settings.defaultSongTemplate);
      setActiveId(id);
      logger.debug("App", `song added: ${id}`);
      announce(t("songCreated"));
    } catch (err) {
      logger.error("App", "Failed to add song:", err);
    }
  }, [activeCategory, categories, addSong, settings.defaultSongTemplate, announce, t]);

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
      if (settings.confirmDelete) {
        setDeletingId(id);
      } else {
        handleConfirmDelete(id);
      }
    },
    [settings.confirmDelete, handleConfirmDelete],
  );

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<Omit<Song, "id" | "createdAt">>) => {
      await updateSong(id, patch);
    },
    [updateSong],
  );

  const handleAddCategory = useCallback(
    async (label: string) => {
      try {
        const id = await addCategory(label);
        setActiveCategory(id);
        logger.debug("App", `category added: ${id}`);
      } catch (err) {
        logger.error("App", "Failed to add category:", err);
      }
    },
    [addCategory],
  );

  const handleRenameCategory = useCallback(
    async (id: string, label: string) => {
      try {
        await renameCategory(id, label);
        logger.debug("App", `category renamed: ${id}`);
      } catch (err) {
        logger.error("App", "Failed to rename category:", err);
      }
    },
    [renameCategory],
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      try {
        if (activeCategory === id) {
          setActiveCategory(ALL_CATEGORY.id);
        }
        await deleteCategory(id);
        logger.debug("App", `category deleted: ${id}`);
        announce(t("categoryDeleted"));
      } catch (err) {
        logger.error("App", "Failed to delete category:", err);
      }
    },
    [activeCategory, deleteCategory, announce, t],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredByCategory.map((s) => s.id)));
  }, [filteredByCategory]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleRequestDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (settings.confirmDelete) {
      setDeletingSelectedIds(Array.from(selectedIds));
    } else {
      handleConfirmDeleteSelected(Array.from(selectedIds));
    }
  }, [selectedIds, settings.confirmDelete]);

  const handleConfirmDeleteSelected = useCallback(
    async (ids: string[]) => {
      setDeletingSelectedIds(null);
      const idSet = new Set(ids);
      if (idSet.has(activeId ?? "")) {
        setActiveId(null);
      }
      try {
        await deleteSongs(ids);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of ids) next.delete(id);
          return next;
        });
        logger.debug("App", `songs deleted: ${ids.length}`);
        announce(t("songDeleted"));
      } catch (err) {
        logger.error("App", "Failed to delete songs:", err);
      }
    },
    [activeId, deleteSongs, announce, t],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || tag === "select";
      if ((e.ctrlKey || e.metaKey) && e.key === "b" && !isInput) {
        e.preventDefault();
        logger.debug("Keys", "Ctrl+B: toggle sidebar");
        setSidebarCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleExportDb = useCallback(async () => {
    try {
      logger.info("App", "Export DB started");
      const db = new TauriDbService();
      await db.exportDb();
      logger.info("App", "Export DB completed");
    } catch (err) {
      logger.error("App", "Export failed:", err);
    }
  }, []);

  const handleImportDb = useCallback(async () => {
    try {
      const file = await open({
        filters: [{ name: "SQLite DB", extensions: ["db"] }],
        multiple: false,
      });
      if (!file) {
        logger.debug("App", "import_db: cancelled");
        return;
      }
      logger.info("App", `import_db: copying from ${file}`);
      const dest = await invoke<string>("get_db_path_str");
      await invoke("copy_file", { src: file, dest });
      logger.info("App", "import_db: done");
      addToast(t("dbImported"), "success");
    } catch (err) {
      logger.error("App", "Import failed:", err);
      addToast(t("importError"), "error");
    }
  }, [addToast, t]);

  const handleClearDb = useCallback(async () => {
    try {
      await invoke("clear_all_data");
      logger.info("App", "clear_db: done");
      addToast(t("dbCleared"), "success");
    } catch (err) {
      logger.error("App", "Clear failed:", err);
      addToast(t("clearError"), "error");
    }
  }, [addToast, t]);

  const refreshBackups = useCallback(async () => {
    try {
      const list =
        await invoke<{ filename: string; size_kb: number; timestamp: string }[]>("list_backups");
      logger.debug("App", `refreshBackups: ${list.length} backups`);
      setBackups(list);
    } catch (err) {
      logger.error("App", "Failed to load backups:", err);
    }
  }, []);

  const handleRestoreBackup = useCallback(
    async (filename: string) => {
      try {
        await invoke("restore_backup", { filename });
        logger.info("App", `restore_backup: ${filename} done`);
        addToast(t("backupRestored"), "success");
        refreshBackups();
      } catch (err) {
        logger.error("App", "Restore failed:", err);
        addToast(String(err), "error");
      }
    },
    [addToast, t, refreshBackups],
  );

  const handleDeleteBackup = useCallback(
    async (filename: string) => {
      try {
        await invoke("delete_backup", { filename });
        logger.info("App", `delete_backup: ${filename} done`);
        addToast(t("backupDeleted"), "success");
        refreshBackups();
      } catch (err) {
        logger.error("App", "Delete backup failed:", err);
        addToast(String(err), "error");
      }
    },
    [addToast, t, refreshBackups],
  );

  useEffect(() => {
    if (settingsOpen) {
      refreshBackups();
    }
  }, [settingsOpen, refreshBackups]);

  const dbStats = useMemo(
    () => ({
      songs: songs.length,
      categories: categories.length,
      sizeKb: 0,
    }),
    [songs, categories],
  );

  useKeyboardShortcuts({
    onNewSong: handleAddSong,
    onFocusSearch: () => {
      document.querySelector<HTMLInputElement>(".search-input")?.focus();
    },
    onRequestDelete: activeId ? () => handleRequestDelete(activeId) : undefined,
    deleteEnabled: activeId !== null,
  });

  return {
    settings,
    updateSettings,
    settingsReady,
    songsReady,
    songs,
    categories,
    filteredByCategory,
    activeSong,
    deletingSong,
    activeId,
    activeCategory,
    counts,
    sidebarCollapsed,
    isNarrow,
    settingsOpen,
    debugOpen,
    deletingId,
    exitingSongId,
    backups,
    dbStats,
    toasts,
    announceRef,
    selectedIds,
    deletingSelectedIds,
    recoveryInfo,
    setActiveId,
    setSidebarCollapsed,
    setSettingsOpen,
    setDebugOpen,
    setDeletingId,
    setDeletingSelectedIds,
    handleCategoryChange,
    handleAddSong,
    handleConfirmDelete,
    handleRequestDelete,
    handleUpdate,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleSidebarResize,
    handleSongListResize,
    handleExportDb,
    handleImportDb,
    handleClearDb,
    refreshBackups,
    handleRestoreBackup,
    handleDeleteBackup,
    removeToast,
    updateCategoryIcon,
    togglePin,
    addToast,
    toggleSelect,
    selectAll,
    deselectAll,
    handleRequestDeleteSelected,
    handleConfirmDeleteSelected,
    dismissRecovery: useCallback(() => setRecoveryInfo(null), []),
  };
}
