import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import type { Song } from "@/types/song";
import type { CustomCategory } from "@/types/category";
import type { ExportFormat, FontFamily, RhymeLang, TabSize } from "@/types/settings";
import { WinDropdown } from "./WinDropdown";
import { TypewriterInput } from "./TypewriterInput";
import { SongLyricsEditor, type SongLyricsEditorHandle } from "@/editor/SongLyricsEditor";
import { SectionOutline } from "./SectionOutline";
import { parseSongTag, parseLyricSections, buildAllTags } from "@/types/songTags";
import { useRhymes } from "@/hooks/useRhymes";
import { countLineSyllables } from "@/utils/syllables";
import { logger } from "@/services/logger";
import { useTranslation } from "@/i18n";
import { MusicQuotes } from "./MusicQuotes";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

interface SongEditorProps {
  song: Song | null;
  onUpdate: (id: string, patch: Partial<Omit<Song, "id" | "createdAt">>) => void;
  categories: CustomCategory[];
  editorFontSize: number;
  lineHeight: number;
  fontFamily: FontFamily;
  spellCheck: boolean;
  wordWrap: boolean;
  showWordCount: boolean;
  customTags: string[];
  tabSize: TabSize;
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
  autocloseBrackets: boolean;
  cursorStyle: string;
  cursorBlinkRate: number;
  showSectionOutline: boolean;
  exportFormat: ExportFormat;
  rhymeLang: RhymeLang;
  rhymeDepth: number;
  maxRhymeResults: number;
  addToast?: (message: string, type?: "error" | "success" | "info") => void;
}

export function SongEditor({
  song,
  onUpdate,
  categories,
  editorFontSize,
  lineHeight,
  fontFamily,
  spellCheck,
  wordWrap,
  showWordCount,
  customTags,
  tabSize,
  showLineNumbers,
  highlightCurrentLine,
  autocloseBrackets,
  cursorStyle,
  cursorBlinkRate,
  showSectionOutline,
  exportFormat,
  rhymeLang,
  rhymeDepth,
  maxRhymeResults,
  addToast,
}: SongEditorProps) {
  const editorRef = useRef<SongLyricsEditorHandle>(null);
  const tagScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const {
    rhymes,
    loading: rhymeLoading,
    error: rhymeError,
    fetchRhymes,
    clearRhymes,
  } = useRhymes(maxRhymeResults);
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const allTags = useMemo(() => buildAllTags(customTags, lang), [customTags, lang]);

  const updateScrollArrows = useCallback(() => {
    const el = tagScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = tagScrollRef.current;
    if (!el) return;
    updateScrollArrows();
    el.addEventListener("scroll", updateScrollArrows, { passive: true });
    const ro = new ResizeObserver(updateScrollArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollArrows);
      ro.disconnect();
    };
  }, [allTags, updateScrollArrows]);

  const handleTagWheel = useCallback((e: React.WheelEvent) => {
    const el = tagScrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  }, []);

  const handleTagScroll = useCallback((dir: "left" | "right") => {
    const el = tagScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  }, []);

  const handleRhymeRequest = useCallback(
    (word: string) => {
      logger.debug("Editor", `rhyme request: "${word}" lang=${rhymeLang} depth=${rhymeDepth}`);
      fetchRhymes(word, rhymeLang, rhymeDepth);
    },
    [fetchRhymes, rhymeLang, rhymeDepth],
  );

  const handleCopyWord = useCallback(
    (word: string) => {
      logger.debug("Editor", `copy word: "${word}"`);
      addToast?.(`${t("copied")}: ${word}`, "success");
    },
    [addToast, t],
  );

  const stats = useMemo(() => {
    if (!showWordCount || !song) return null;
    const text = song.lyrics;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split("\n").length : 0;
    const syllables = text.trim()
      ? text
          .split("\n")
          .reduce((sum, line) => sum + countLineSyllables(line, rhymeLang), 0)
      : 0;
    return { chars, words, lines, syllables };
  }, [song?.lyrics, showWordCount, song, rhymeLang]);

  const handleJumpToSection = useCallback((lineIndex: number) => {
    logger.debug("Editor", `jump to section line ${lineIndex}`);
    editorRef.current?.scrollToLine(lineIndex);
  }, []);

  const handleMoveSection = useCallback(
    (fromLineIndex: number, toLineIndex: number) => {
      if (!song) return;
      logger.debug("Editor", `move section: line ${fromLineIndex} -> ${toLineIndex}`);
      const lines = song.lyrics.split("\n");
      const sections = parseLyricSections(song.lyrics, allTags);
      const fromSection = sections.find((s) => s.lineIndex === fromLineIndex);
      if (!fromSection) return;

      if (fromLineIndex === toLineIndex) return;

      const removed = lines.splice(fromLineIndex, fromSection.lineCount);

      let insertAt = toLineIndex;
      if (fromLineIndex < toLineIndex) {
        insertAt = toLineIndex - fromSection.lineCount;
      }

      if (insertAt < 0) insertAt = 0;
      if (insertAt > lines.length) insertAt = lines.length;

      if (insertAt === fromLineIndex) {
        lines.splice(fromLineIndex, 0, ...removed);
        return;
      }

      lines.splice(insertAt, 0, ...removed);
      onUpdate(song.id, { lyrics: lines.join("\n") });
    },
    [song, onUpdate, allTags],
  );

  const handleInsertTag = useCallback(
    (tagLabel: string) => {
      if (!song) return;
      const lines = song.lyrics.split("\n");
      const lowerLabel = tagLabel.toLowerCase();
      const existingCount = lines.filter((l) => {
        const parsed = parseSongTag(l);
        return parsed && l.toLowerCase().includes(lowerLabel);
      }).length;
      const suffix = existingCount > 0 ? ` ${existingCount + 1}` : "";
      logger.debug("Editor", `insert tag: [${tagLabel}${suffix}]`);
      editorRef.current?.insertText(`[${tagLabel}${suffix}]\n`);
    },
    [song],
  );

  const handleNavigateTag = useCallback(
    (direction: "next" | "prev") => {
      if (!song) return;
      const sections = parseLyricSections(song.lyrics, allTags);
      if (sections.length === 0) return;
      logger.debug("Editor", `navigate section: ${direction}`);
      const currentLine = editorRef.current?.getCursorLine() ?? 0;

      let targetIdx: number;
      if (direction === "next") {
        targetIdx = sections.findIndex((s) => s.lineIndex > currentLine);
        if (targetIdx === -1) targetIdx = 0;
      } else {
        targetIdx = -1;
        for (let i = sections.length - 1; i >= 0; i--) {
          if (sections[i].lineIndex < currentLine) {
            targetIdx = i;
            break;
          }
        }
        if (targetIdx === -1) targetIdx = sections.length - 1;
      }
      editorRef.current?.scrollToLine(sections[targetIdx].lineIndex);
    },
    [song, allTags],
  );

  const handleExportFile = useCallback(async () => {
    if (!song) return;
    logger.info("Editor", `export ${exportFormat}: ${song.title || "Untitled"}`);

    let content: string;
    let ext: string;

    const title = song.title || "Untitled";
    const artist = song.artist || "Unknown";

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

    const dest = await save({
      filters: [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }],
      defaultPath: `${title}.${ext}`,
    });
    if (!dest) {
      logger.debug("Editor", "export: cancelled by user");
      return;
    }
    try {
      logger.debug("Editor", `export: writing ${content.length} bytes to ${dest}`);
      await invoke("write_text_file", { path: dest, content });
      logger.info("Editor", `export: done ${dest}`);
      addToast?.(`Exported to ${dest.split(/[/\\]/).pop()}`, "success");
    } catch (err) {
      logger.error("Editor", "export: write_text_file failed:", err);
      addToast?.("Export failed", "error");
    }
  }, [song, exportFormat, addToast]);

  if (!song) {
    return <MusicQuotes />;
  }

  const hasCategory = categories.some((c) => c.id === song.category);
  const currentLabel = categories.find((c) => c.id === song.category)?.label ?? t("uncategorized");

  const dropdownOptions = categories.map((cat) => ({ value: cat.id, label: cat.label }));

  const dropdownValue = hasCategory ? song.category : "";
  const dropdownLabel = !hasCategory && song.category ? currentLabel : undefined;

  const sections = parseLyricSections(song.lyrics, allTags);

  return (
    <div className="editor">
      <div className="editor-fields">
        <TypewriterInput
          className="editor-title-input"
          placeholder={t("title")}
          value={song.title}
          onChange={(val) => onUpdate(song.id, { title: val })}
          spellCheck={false}
        />
        <TypewriterInput
          className="editor-artist-input"
          placeholder={t("artist")}
          value={song.artist}
          onChange={(val) => onUpdate(song.id, { artist: val })}
          spellCheck={false}
        />

        <div className="editor-divider" />

        <div className="editor-category-row">
          <label className="editor-cat-label">{t("category")}</label>
          <WinDropdown
            value={dropdownValue}
            options={dropdownOptions}
            onChange={(val) => onUpdate(song.id, { category: val })}
            placeholder={t("uncategorized")}
            label={dropdownLabel}
            missing={!hasCategory && !!song.category}
          />
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-body">
          <div className="editor-tag-toolbar">
            {canScrollLeft && (
              <button
                className="editor-tag-scroll-btn editor-tag-scroll-btn--left"
                onClick={() => handleTagScroll("left")}
                type="button"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div className="editor-tag-toolbar-inner" ref={tagScrollRef} onWheel={handleTagWheel}>
              {allTags.map((tag) => {
                const isCustom = tag.id.startsWith("custom-");
                const color = tag.color;
                return (
                  <button
                    key={tag.id}
                    className="editor-tag-pill"
                    style={
                      isCustom
                        ? ({ "--tag-c": color, "--tag-bg": `${color}14` } as React.CSSProperties)
                        : undefined
                    }
                    data-tag={isCustom ? undefined : tag.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleInsertTag(tag.label);
                    }}
                    title={`[${tag.label}]`}
                  >
                    <span
                      className="editor-tag-dot"
                      data-tag={isCustom ? undefined : tag.id}
                      style={isCustom ? { background: color } : undefined}
                    />
                    <span className="editor-tag-label">{tag.label}</span>
                  </button>
                );
              })}
            </div>
            {canScrollRight && (
              <button
                className="editor-tag-scroll-btn editor-tag-scroll-btn--right"
                onClick={() => handleTagScroll("right")}
                type="button"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
          <SongLyricsEditor
            ref={editorRef}
            key={song.id}
            className="editor-lyrics"
            fontSize={editorFontSize}
            lineHeight={lineHeight}
            fontFamily={fontFamily}
            tabSize={tabSize}
            spellCheck={spellCheck}
            placeholder={t("lyrics")}
            value={song.lyrics}
            customTags={customTags}
            allTags={allTags}
            lang={lang}
            showLineNumbers={showLineNumbers}
            highlightCurrentLine={highlightCurrentLine}
            autocloseBrackets={autocloseBrackets}
            cursorStyle={cursorStyle}
            cursorBlinkRate={cursorBlinkRate}
            wordWrap={wordWrap}
            rhymes={rhymes}
            rhymeLoading={rhymeLoading}
            rhymeError={rhymeError}
            onRhymeRequest={handleRhymeRequest}
            onRhymeDismiss={clearRhymes}
            onCopyWord={handleCopyWord}
            onChange={(val) => {
              onUpdate(song.id, { lyrics: val });
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "ArrowDown") {
                e.preventDefault();
                logger.debug("Keys", "Ctrl+Shift+Down: navigate next section");
                handleNavigateTag("next");
              } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "ArrowUp") {
                e.preventDefault();
                logger.debug("Keys", "Ctrl+Shift+Up: navigate prev section");
                handleNavigateTag("prev");
              }
            }}
          />
        </div>
        {showSectionOutline && sections.length > 0 && (
          <SectionOutline
            lyrics={song.lyrics}
            allTags={allTags}
            onJumpToSection={handleJumpToSection}
            onMoveSection={handleMoveSection}
          />
        )}
      </div>
      <div className="editor-statusbar">
        {stats && (
          <span className="editor-stats">
            {stats.lines} {t("lines")} · {stats.words} {t("wordsStat")} · {stats.chars} {t("chars")} · {stats.syllables} {t("syl")}
            {sections.length > 0 && ` · ${sections.length} ${t("sectionsStat")}`}
          </span>
        )}
        <button
          className="editor-export-btn"
          onClick={handleExportFile}
          title={exportFormat.toUpperCase()}
          type="button"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exportFormat.toUpperCase()}
        </button>
        <span className="editor-saved-at">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {t("saved")}{" "}
          {new Date(song.updatedAt).toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
