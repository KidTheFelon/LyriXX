import { useState, useCallback } from "react";
import { logger } from "@/services/logger";

interface UseMultiSelectParams {
  songs: { id: string }[];
  confirmDelete: boolean;
  deleteSongs: (ids: string[]) => Promise<void>;
  setActiveId: (id: string | null) => void;
  activeId: string | null;
  announce: (msg: string) => void;
  t: (key: string) => string;
}

export function useMultiSelect({
  songs,
  confirmDelete,
  deleteSongs,
  setActiveId,
  activeId,
  announce,
  t,
}: UseMultiSelectParams) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSelectedIds, setDeletingSelectedIds] = useState<string[] | null>(null);

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
    setSelectedIds(new Set(songs.map((s) => s.id)));
  }, [songs]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

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
    [activeId, deleteSongs, setActiveId, announce, t],
  );

  const handleRequestDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (confirmDelete) {
      setDeletingSelectedIds(Array.from(selectedIds));
    } else {
      handleConfirmDeleteSelected(Array.from(selectedIds));
    }
  }, [selectedIds, confirmDelete, handleConfirmDeleteSelected]);

  return {
    selectedIds,
    setSelectedIds,
    deletingSelectedIds,
    setDeletingSelectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    handleRequestDeleteSelected,
    handleConfirmDeleteSelected,
  };
}
