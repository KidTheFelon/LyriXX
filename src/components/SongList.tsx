import { useState, useCallback, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/react";
import type { SongListItem } from "@/types/song";
import type { CustomCategory } from "@/types/category";
import type { ExportFormat } from "@/types/settings";
import { useDebounce } from "@/hooks/useDebounce";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { TypewriterInput } from "./TypewriterInput";
import { IconTrash, IconStar, IconClose, IconCopy, IconDuplicate, IconFolder, IconDownload, IconRename, IconWindow } from "./Icons";
import { logger } from "@/services/logger";
import { useTranslation } from "@/i18n";
import { SEARCH_DEBOUNCE_MS } from "@/constants";
import { AnimatedText } from "./AnimatedText";
import { copyToClipboard } from "@/services/clipboard";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

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
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onMoveToCategory: (id: string, categoryId: string) => void;
  categories: CustomCategory[];
  exportFormat: ExportFormat;
  addToast?: (message: string, type?: "error" | "info" | "success") => void;
  openWindowSongIds?: ReadonlySet<string>;
}

interface ContextMenuState {
  x: number;
  y: number;
  songId: string;
  pinned: boolean;
}

interface CategoryMenuState {
  x: number;
  y: number;
  songId: string;
}

function formatDate(ts: number, locale: string): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

interface SongItemProps {
  song: SongListItem;
  isActive: boolean;
  isExiting: boolean;
  isSelected: boolean;
  hasSelection: boolean;
  isOpenInWindow: boolean;
  renamingId: string | null;
  renameValue: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelect: (id: string) => void;
  onDeselectAll: () => void;
  onTogglePin: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onContextMenu: (song: SongListItem) => (e: React.MouseEvent) => void;
  onKeyDown: (id: string) => (e: React.KeyboardEvent) => void;
  handleFinishRename: () => void;
  setRenameValue: (v: string) => void;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  locale: string;
}

function SongItem({
  song,
  isActive,
  isExiting,
  isSelected,
  hasSelection,
  isOpenInWindow,
  renamingId,
  renameValue,
  selectedIds,
  onToggleSelect,
  onSelect,
  onDeselectAll,
  onTogglePin,
  onRequestDelete,
  onContextMenu,
  onKeyDown,
  handleFinishRename,
  setRenameValue,
  renameInputRef,
  locale,
}: SongItemProps) {
  const { t } = useTranslation();
  const songIds =
    hasSelection && selectedIds.has(song.id)
      ? Array.from(selectedIds)
      : [song.id];

  const { ref, isDragging } = useDraggable({
    id: `song-${song.id}`,
    data: { songIds },
  });

  const wasDraggingRef = useRef(false);

  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
    } else if (wasDraggingRef.current) {
      const t = setTimeout(() => { wasDraggingRef.current = false; }, 100);
      return () => clearTimeout(t);
    }
  }, [isDragging]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (wasDraggingRef.current) {
        wasDraggingRef.current = false;
        return;
      }
      if (isOpenInWindow) {
        WebviewWindow.getByLabel(`song-${song.id}`).then((w) => {
          if (w) {
            void w.setFocus();
          } else {
            onSelect(song.id);
          }
        });
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onToggleSelect(song.id);
      } else {
        if (hasSelection) {
          onDeselectAll();
        }
        onSelect(song.id);
      }
    },
    [song.id, isOpenInWindow, onToggleSelect, onSelect, onDeselectAll, hasSelection],
  );

  return (
    <div
      ref={ref}
      className={`song-list-item${isActive ? " active" : ""}${isExiting ? " exiting" : ""}${isSelected ? " selected" : ""}${isDragging ? " dragging" : ""}${isOpenInWindow ? " in-window" : ""}`}
      onClick={handleClick}
      onKeyDown={onKeyDown(song.id)}
      onContextMenu={onContextMenu(song)}
      role="option"
      tabIndex={0}
      aria-selected={isSelected || isActive}
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
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(song.id);
          }}
          title={song.pinned ? t("unpin") : t("pin")}
          aria-label={song.pinned ? t("unpinSong") : t("pinSong")}
          type="button"
        >
          <IconStar size={14} filled={song.pinned} />
        </button>
      )}
      <div className="song-list-item-content">
        {renamingId === song.id ? (
          <input
            ref={renameInputRef}
            className="song-list-item-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleFinishRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFinishRename();
              if (e.key === "Escape") {
                setRenameValue("");
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="song-list-item-title">
              {song.title || t("untitled")}
              {isOpenInWindow && (
                <span className="song-list-item-window-icon" title={t("openInWindow")}>
                  <IconWindow size={11} />
                </span>
              )}
            </div>
            <div className="song-list-item-artist">
              {song.lyrics.split("\n").find((l) => l.trim()) ?? ""}
            </div>
          </>
        )}
      </div>
      <span className="song-list-item-date">{formatDate(song.updatedAt, locale)}</span>
      {!hasSelection && (
        <button
          className="song-list-item-delete"
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete(song.id);
          }}
          title={t("delete")}
          aria-label={t("deleteSong")}
          type="button"
        >
          <IconTrash size={14} />
        </button>
      )}
    </div>
  );
}

/** Список песен: поиск, debounce, pin/delete context menu, multi-select. */
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
  onDuplicate,
  onRename,
  onMoveToCategory,
  categories,
  exportFormat,
  addToast,
  openWindowSongIds,
}: SongListProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [catMenu, setCatMenu] = useState<CategoryMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "ru-RU";

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

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
      if (openWindowSongIds?.has(id)) {
        WebviewWindow.getByLabel(`song-${id}`).then((w) => {
          if (w) {
            void w.setFocus();
          } else {
            onSelect(id);
          }
        });
      } else if (e.ctrlKey || e.metaKey) {
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

  const handleContextMenu = (song: SongListItem) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug("SongList", `context menu: ${song.id}`);
    setCatMenu(null);
    setCtxMenu({ x: e.clientX, y: e.clientY, songId: song.id, pinned: song.pinned });
  };

  const handleCopyLyrics = useCallback(
    async (id: string) => {
      const song = songs.find((s) => s.id === id);
      if (!song) return;
      const ok = await copyToClipboard(song.lyrics);
      if (ok) addToast?.(t("copiedLyrics"), "success");
    },
    [songs, addToast, t],
  );

  const handleExportSong = useCallback(
    async (id: string) => {
      const song = songs.find((s) => s.id === id);
      if (!song) return;
      const title = song.title || t("untitled");
      const artist = song.artist || t("unknown");

      let content: string;
      let ext: string;

      if (exportFormat === "lrc") {
        const lines: string[] = [];
        lines.push(`[ar:${artist}]`);
        lines.push(`[ti:${title}]`);
        lines.push(`[by:LyriXX]`);
        lines.push("");
        for (const line of song.lyrics.split("\n")) {
          lines.push(`[00:00.00]${line}`);
        }
        content = lines.join("\n");
        ext = "lrc";
      } else if (exportFormat === "md") {
        const lines: string[] = [];
        lines.push(`# ${title}`);
        if (artist) lines.push(`**${artist}**`);
        lines.push("");
        lines.push(song.lyrics);
        content = lines.join("\n");
        ext = "md";
      } else {
        content = song.lyrics;
        ext = "txt";
      }

      try {
        const dest = await save({
          filters: [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }],
          defaultPath: `${title}.${ext}`,
        });
        if (!dest) return;
        await invoke("write_text_file", { path: dest, content });
        addToast?.(t("exportedTo").replace("{file}", String(dest.split(/[/\\]/).pop())), "success");
      } catch (err) {
        logger.error("SongList", "export failed:", err);
        addToast?.(t("exportFailed"), "error");
      }
    },
    [songs, exportFormat, addToast],
  );

  const handleExportSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const selected = songs.filter((s) => selectedIds.has(s.id));
    const lines: string[] = [];
    for (const song of selected) {
      const title = song.title || t("untitled");
      const artist = song.artist || t("unknown");
      if (exportFormat === "lrc") {
        lines.push(`[ar:${artist}]`);
        lines.push(`[ti:${title}]`);
        lines.push(`[by:LyriXX]`);
        lines.push("");
        for (const line of song.lyrics.split("\n")) {
          lines.push(`[00:00.00]${line}`);
        }
      } else if (exportFormat === "md") {
        lines.push(`# ${title}`);
        if (artist) lines.push(`**${artist}**`);
        lines.push("");
        lines.push(song.lyrics);
      } else {
        lines.push(song.lyrics);
      }
      lines.push("");
    }
    const content = lines.join("\n");
    const ext = exportFormat === "md" ? "md" : exportFormat === "lrc" ? "lrc" : "txt";
    try {
      const dest = await save({
        filters: [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }],
        defaultPath: `songs.${ext}`,
      });
      if (!dest) return;
      await invoke("write_text_file", { path: dest, content });
      addToast?.(`${t("songsExported")}: ${dest.split(/[/\\]/).pop()}`, "success");
    } catch (err) {
      logger.error("SongList", "export selected failed:", err);
      addToast?.(t("exportFailed"), "error");
    }
  }, [songs, selectedIds, exportFormat, addToast, t]);

  const handleFinishRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (renamingId && trimmed) {
      onRename(renamingId, trimmed);
    }
    setRenamingId(null);
    setRenameValue("");
  }, [renamingId, renameValue, onRename]);

  const openCatMenu = (songId: string, x: number, y: number) => {
    setCtxMenu(null);
    setCatMenu({ x, y, songId });
  };

  const handleMoveToCategory = useCallback(
    (categoryId: string) => {
      if (!catMenu) return;
      onMoveToCategory(catMenu.songId, categoryId);
      setCatMenu(null);
    },
    [catMenu, onMoveToCategory],
  );

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
        {
          id: "duplicate",
          label: t("duplicate"),
          icon: <IconDuplicate size={14} />,
          onClick: () => onDuplicate(ctxMenu.songId),
        },
        {
          id: "rename",
          label: t("renameSong"),
          icon: <IconRename size={14} />,
          onClick: () => {
            const song = songs.find((s) => s.id === ctxMenu.songId);
            setRenameValue(song?.title ?? "");
            setRenamingId(ctxMenu.songId);
          },
        },
        {
          id: "copy-lyrics",
          label: t("copyLyrics"),
          icon: <IconCopy size={14} />,
          onClick: () => handleCopyLyrics(ctxMenu.songId),
        },
        {
          id: "move-category",
          label: t("moveToCategory"),
          icon: <IconFolder size={14} />,
          onClick: () => openCatMenu(ctxMenu.songId, ctxMenu.x + 200, ctxMenu.y),
        },
        {
          id: "export-file",
          label: t("exportToFile"),
          icon: <IconDownload size={14} />,
          onClick: () => handleExportSong(ctxMenu.songId),
        },
        { id: "separator" },
        ...(hasSelection && selectedIds.size > 1
          ? [
              {
                id: "export-selected",
                label: t("exportSelected"),
                icon: <IconDownload size={14} />,
                onClick: () => handleExportSelected(),
              },
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

  const catMenuItems: ContextMenuItem[] = catMenu
    ? (() => {
        const song = songs.find((s) => s.id === catMenu.songId);
        const songCat = song?.category ?? "";
        return [
          {
            id: "cat-back",
            label: `\u2190 ${t("cancel")}`,
            onClick: () => {
              setCatMenu(null);
              const ctxSong = songs.find((s) => s.id === catMenu.songId);
              setCtxMenu({
                x: catMenu.x - 200,
                y: catMenu.y,
                songId: catMenu.songId,
                pinned: ctxSong?.pinned ?? false,
              });
            },
          },
          { id: "cat-separator" },
          {
            id: "cat-none",
            label: t("uncategorized"),
            icon: !songCat ? <IconStar size={14} filled /> : undefined,
            onClick: () => handleMoveToCategory(""),
          },
          ...categories.map((cat) => ({
            id: `cat-${cat.id}`,
            label: cat.label,
            icon: songCat === cat.id ? <IconStar size={14} filled /> : undefined,
            onClick: () => handleMoveToCategory(cat.id),
          })),
        ];
      })()
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
          <div className="song-list-empty">{search ? <AnimatedText translationKey="nothingFound" /> : <AnimatedText translationKey="noEntries" />}</div>
        )}
        {filtered.map((song) => {
          const isSelected = selectedIds.has(song.id);
          const isActive = activeId === song.id && !hasSelection;
          return (
            <SongItem
              key={song.id}
              song={song}
              isActive={isActive}
              isExiting={exitingId === song.id}
              isSelected={isSelected}
              hasSelection={hasSelection}
              isOpenInWindow={!!openWindowSongIds?.has(song.id)}
              renamingId={renamingId}
              renameValue={renameValue}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onSelect={onSelect}
              onDeselectAll={onDeselectAll}
              onTogglePin={onTogglePin}
              onRequestDelete={onRequestDelete}
              onContextMenu={handleContextMenu}
              onKeyDown={handleKeyDown}
              handleFinishRename={handleFinishRename}
              setRenameValue={setRenameValue}
              renameInputRef={renameInputRef}
              locale={locale}
            />
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

      {catMenu && (
        <ContextMenu
          items={catMenuItems}
          x={catMenu.x}
          y={catMenu.y}
          onClose={() => setCatMenu(null)}
        />
      )}
    </div>
  );
}
