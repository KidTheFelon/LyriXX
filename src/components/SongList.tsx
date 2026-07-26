import { useState, useCallback } from "react";
import type { SongListItem } from "@/types/song";
import { useDebounce } from "@/hooks/useDebounce";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { TypewriterInput } from "./TypewriterInput";
import { IconTrash, IconStar, IconClose } from "./Icons";
import { logger } from "@/services/logger";
import { useTranslation } from "@/i18n";
import { SEARCH_DEBOUNCE_MS } from "@/constants";

interface SongListProps {
  songs: SongListItem[];
  activeId: string | null;
  exitingId: string | null;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRequestDelete: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRequestDeleteSelected: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  songId: string;
  pinned: boolean;
}

function formatDate(ts: number, locale: string): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function SongList({
  songs,
  activeId,
  exitingId,
  onSelect,
  onTogglePin,
  onRequestDelete,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onRequestDeleteSelected,
}: SongListProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const { t } = useTranslation();
  const locale = "ru-RU";

  const hasSelection = selectedIds.size > 0;

  const filtered = songs.filter((s) => {
    const q = debouncedSearch.toLowerCase();
    const firstLine = s.lyrics.split("\n").find((l) => l.trim()) ?? "";
    return (
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      firstLine.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (id: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        onToggleSelect(id);
      } else {
        onSelect(id);
      }
    } else if (e.key === "Delete" && !hasSelection) {
      e.preventDefault();
      onRequestDelete(id);
    } else if (e.key === "Escape" && hasSelection) {
      e.preventDefault();
      onDeselectAll();
    }
  };

  const handleClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onToggleSelect(id);
      } else {
        if (hasSelection) {
          onDeselectAll();
        }
        onSelect(id);
      }
    },
    [onToggleSelect, onSelect, onDeselectAll, hasSelection],
  );

  const handleDeleteClick = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(id);
  };

  const handlePinClick = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(id);
  };

  const handleContextMenu = (song: SongListItem) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug("SongList", `context menu: ${song.id}`);
    setCtxMenu({ x: e.clientX, y: e.clientY, songId: song.id, pinned: song.pinned });
  };

  const ctxMenuItems: ContextMenuItem[] = ctxMenu
    ? [
        ...(hasSelection
          ? [
              {
                id: "deselect",
                label: t("deselectAll"),
                onClick: () => onDeselectAll(),
              },
              { id: "sep-sel" as const },
            ]
          : []),
        {
          id: "pin",
          label: ctxMenu.pinned ? t("unpin") : t("pin"),
          icon: <IconStar size={14} filled={ctxMenu.pinned} />,
          onClick: () => onTogglePin(ctxMenu.songId),
        },
        { id: "separator" },
        ...(hasSelection && selectedIds.size > 1
          ? [
              {
                id: "delete-selected",
                label: t("deleteSelected").replace("{count}", String(selectedIds.size)),
                danger: true,
                icon: <IconTrash size={14} />,
                onClick: () => onRequestDeleteSelected(),
              },
              { id: "separator" as const },
            ]
          : []),
        {
          id: "delete",
          label: t("delete"),
          danger: true,
          icon: <IconTrash size={14} />,
          onClick: () => onRequestDelete(ctxMenu.songId),
        },
      ]
    : [];

  return (
    <div className="song-list">
      {hasSelection && (
        <div className="song-list-toolbar">
          <button
            className="song-list-toolbar-btn"
            onClick={onDeselectAll}
            title={t("exitSelectMode")}
            type="button"
          >
            <IconClose size={14} />
          </button>
          <span className="song-list-toolbar-count">{selectedIds.size}</span>
          <button
            className="song-list-toolbar-btn"
            onClick={selectedIds.size === filtered.length ? onDeselectAll : onSelectAll}
            type="button"
            title={selectedIds.size === filtered.length ? t("deselectAll") : t("selectAll")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {selectedIds.size === filtered.length ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </>
              ) : (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <polyline points="9 11 12 14 22 4" />
                </>
              )}
            </svg>
          </button>
          <button
            className="song-list-toolbar-btn danger"
            onClick={onRequestDeleteSelected}
            title={t("deleteSelected").replace("{count}", String(selectedIds.size))}
            type="button"
          >
            <IconTrash size={14} />
          </button>
        </div>
      )}

      <div className="song-list-header">
        <div className="search-box">
          <svg
            className="search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <TypewriterInput
            placeholder={t("search")}
            value={search}
            onChange={(val) => setSearch(val)}
            className="search-input"
            ariaLabel={t("searchSongs")}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch("")}
              title={t("clear")}
              type="button"
            >
              <IconClose size={10} />
            </button>
          )}
        </div>
      </div>

      <div className="song-list-items" role="listbox" aria-label={t("songList")}>
        {filtered.length === 0 && (
          <div className="song-list-empty">{search ? t("nothingFound") : t("noEntries")}</div>
        )}
        {filtered.map((song) => {
          const isSelected = selectedIds.has(song.id);
          const isActive = activeId === song.id && !hasSelection;
          return (
            <div
              key={song.id}
              className={`song-list-item${isActive ? " active" : ""}${exitingId === song.id ? " exiting" : ""}${isSelected ? " selected" : ""}`}
              onClick={(e) => handleClick(song.id, e)}
              onKeyDown={handleKeyDown(song.id)}
              onContextMenu={handleContextMenu(song)}
              role="option"
              tabIndex={0}
              aria-selected={isSelected || activeId === song.id}
            >
              {hasSelection && (
                <button
                  className={`song-list-item-checkbox${isSelected ? " checked" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(song.id);
                  }}
                  type="button"
                  aria-checked={isSelected}
                >
                  {isSelected && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )}
              {!hasSelection && (
                <button
                  className={`song-list-item-pin${song.pinned ? " pinned" : ""}`}
                  onClick={handlePinClick(song.id)}
                  title={song.pinned ? t("unpin") : t("pin")}
                  aria-label={song.pinned ? t("unpinSong") : t("pinSong")}
                  type="button"
                >
                  <IconStar size={14} filled={song.pinned} />
                </button>
              )}
              <div className="song-list-item-content">
                <div className="song-list-item-title">{song.title || t("untitled")}</div>
                <div className="song-list-item-artist">
                  {song.lyrics.split("\n").find((l) => l.trim()) ?? ""}
                </div>
              </div>
              <span className="song-list-item-date">{formatDate(song.updatedAt, locale)}</span>
              {!hasSelection && (
                <button
                  className="song-list-item-delete"
                  onClick={handleDeleteClick(song.id)}
                  title={t("delete")}
                  aria-label={t("deleteSong")}
                  type="button"
                >
                  <IconTrash size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {ctxMenu && (
        <ContextMenu
          items={ctxMenuItems}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
