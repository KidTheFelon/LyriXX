import { useEffect, useRef, useCallback } from "react";
import { useSongs } from "./useSongs";
import { useSettings } from "./useSettings";
import { useMicaThemeSync } from "./useMicaEffect";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useTranslation } from "@/i18n";
import { useToasts } from "./store/useToasts";
import { useThemeEffects } from "./store/useThemeEffects";
import { useSidebarState } from "./store/useSidebarState";
import { useDbOperations } from "./store/useDbOperations";
import { useSongSelection } from "./store/useSongSelection";
import { useMultiSelect } from "./store/useMultiSelect";
import { useModalState } from "./store/useModalState";

/**
 * Главный store-хук приложения.
 * Композирует все domain-хуки и возвращает полное состояние + обработчики для App.tsx.
 */
export function useAppStore() {
  const { t } = useTranslation();
  const { settings, updateSettings, settingsReady } = useSettings();
  useMicaThemeSync(settings.theme);

  const { toasts, addToast, removeToast } = useToasts(settings);
  useThemeEffects(settings);

  const {
    songs,
    categories,
    ready: songsReady,
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
  } = useSongs(undefined, settings.autoSaveDelay, addToast);

  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    isNarrow,
    handleSidebarResize,
    handleSongListResize,
  } = useSidebarState({ settings, settingsReady, updateSettings });

  const {
    backups,
    recoveryInfo,
    handleExportDb,
    handleImportDb,
    handleClearDb,
    refreshBackups,
    handleRestoreBackup,
    handleDeleteBackup,
    dismissRecovery,
  } = useDbOperations(addToast, t);

  const announceRef = useRef<HTMLDivElement>(null);
  const announce = useCallback((msg: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = msg;
    }
  }, []);

  const {
    activeCategory,
    setActiveCategory,
    activeId,
    setActiveId,
    deletingId,
    setDeletingId,
    exitingSongId,
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
  } = useSongSelection({
    songs,
    categories,
    addSong,
    updateSong,
    deleteSong,
    sortSongsBy: settings.sortSongsBy,
    sortCategoriesBy: settings.sortCategoriesBy,
    confirmDelete: settings.confirmDelete,
    defaultSongTemplate: settings.defaultSongTemplate,
    announce,
    t,
  });

  const {
    selectedIds,
    deletingSelectedIds,
    setDeletingSelectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    handleRequestDeleteSelected,
    handleConfirmDeleteSelected,
  } = useMultiSelect({
    songs: filteredByCategory,
    confirmDelete: settings.confirmDelete,
    deleteSongs,
    setActiveId,
    activeId,
    announce,
    t,
  });

  const { settingsOpen, setSettingsOpen, debugOpen, setDebugOpen } = useModalState();

  const handleDuplicateSong = useCallback(
    async (id: string) => {
      const newId = await duplicateSong(id);
      if (newId) {
        setActiveId(newId);
        addToast(t("songDuplicated"), "success");
      }
    },
    [duplicateSong, setActiveId, addToast, t],
  );

  const handleRenameSong = useCallback(
    (id: string, title: string) => {
      updateSong(id, { title });
      addToast(t("songRenamed"), "success");
    },
    [updateSong, addToast, t],
  );

  const handleMoveToCategory = useCallback(
    (id: string, categoryId: string) => {
      updateSong(id, { category: categoryId });
      addToast(t("songMoved"), "success");
    },
    [updateSong, addToast, t],
  );

  useEffect(() => {
    if (settingsOpen) {
      refreshBackups();
    }
  }, [settingsOpen, refreshBackups]);

  const handleAddCategory = useCallback(
    async (label: string) => {
      try {
        const id = await addCategory(label);
        setActiveCategory(id);
      } catch {
        addToast(t("clearError"), "error");
      }
    },
    [addCategory, setActiveCategory, addToast, t],
  );

  const handleRenameCategory = useCallback(
    async (id: string, label: string) => {
      try {
        await renameCategory(id, label);
      } catch {
        addToast(t("clearError"), "error");
      }
    },
    [renameCategory, addToast, t],
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      try {
        if (activeCategory === id) {
          setActiveCategory("__all__");
        }
        await deleteCategory(id);
        announce(t("categoryDeleted"));
      } catch {
        addToast(t("clearError"), "error");
      }
    },
    [activeCategory, deleteCategory, setActiveCategory, announce, addToast, t],
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
    sortedCategories,
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
    updateSongsCategory,
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
    dismissRecovery,
    handleDuplicateSong,
    handleRenameSong,
    handleMoveToCategory,
    duplicateSong,
  };
}
