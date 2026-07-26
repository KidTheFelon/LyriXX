import { useMemo, useCallback, useRef, useState } from "react";
import { parseLyricSections } from "@/types/songTags";
import type { SongTag } from "@/types/songTags";
import { useTranslation } from "@/i18n";
import { logger } from "@/services/logger";

interface SectionOutlineProps {
  lyrics: string;
  allTags: SongTag[];
  onJumpToSection: (lineIndex: number) => void;
  onMoveSection: (fromLineIndex: number, toLineIndex: number) => void;
}

const DRAG_THRESHOLD = 4;

export function SectionOutline({
  lyrics,
  allTags,
  onJumpToSection,
  onMoveSection,
}: SectionOutlineProps) {
  const sections = useMemo(() => parseLyricSections(lyrics, allTags), [lyrics, allTags]);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after">("before");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const overIdxRef = useRef<number | null>(null);
  const overPosRef = useRef<"before" | "after">("before");
  const dragStateRef = useRef<{
    idx: number;
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);
  const lyricsRef = useRef(lyrics);
  lyricsRef.current = lyrics;
  const allTagsRef = useRef(allTags);
  allTagsRef.current = allTags;

  const handlePointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    if (e.button !== 0) return;
    dragStateRef.current = {
      idx,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pointerId: e.pointerId,
    };
    listRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragStateRef.current;
    if (!ds || e.pointerId !== ds.pointerId) return;

    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.moved && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;

    if (!ds.moved) {
      ds.moved = true;
      setDragIdx(ds.idx);
    }

    const list = listRef.current;
    if (!list) return;

    const items = list.querySelectorAll<HTMLElement>(".section-outline-item");
    let found = -1;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        found = i;
        break;
      }
    }

    if (found === -1) {
      overIdxRef.current = null;
      setOverIdx(null);
      return;
    }

    const rect = items[found].getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    overPosRef.current = pos;
    overIdxRef.current = found;
    setOverPos(pos);
    setOverIdx(found);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      dragStateRef.current = null;

      if (e.pointerId !== ds?.pointerId) return;

      if (!ds || !ds.moved) {
        if (ds) {
          logger.debug("Outline", `jump to section: line ${sections[ds.idx].lineIndex}`);
          onJumpToSection(sections[ds.idx].lineIndex);
        }
        setDragIdx(null);
        setOverIdx(null);
        overIdxRef.current = null;
        return;
      }

      const fromIdx = ds.idx;
      let toIdx = overIdxRef.current;
      const pos = overPosRef.current;

      setDragIdx(null);
      setOverIdx(null);
      overIdxRef.current = null;
      overPosRef.current = "before";

      if (toIdx === null || toIdx === fromIdx) return;

      if (pos === "after") {
        toIdx = toIdx + 1;
        if (toIdx > sections.length) toIdx = sections.length;
      }

      if (toIdx === fromIdx || toIdx === fromIdx + 1) return;

      const fromLineIndex = sections[fromIdx].lineIndex;
      const toLineIndex = toIdx < sections.length ? sections[toIdx].lineIndex : -1;

      const currentSections = parseLyricSections(lyricsRef.current, allTagsRef.current);
      const currentFrom = currentSections.find((s) => s.lineIndex === fromLineIndex);
      if (!currentFrom) return;

      logger.debug("Outline", `move section: line ${fromLineIndex} -> ${toLineIndex}`);
      if (toLineIndex === -1) {
        onMoveSection(fromLineIndex, currentSections[currentSections.length - 1].lineIndex);
      } else {
        const currentTo = currentSections.find((s) => s.lineIndex === toLineIndex);
        if (currentTo) {
          onMoveSection(fromLineIndex, toLineIndex);
        }
      }
    },
    [sections, onJumpToSection, onMoveSection],
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    const ds = dragStateRef.current;
    dragStateRef.current = null;
    setDragIdx(null);
    setOverIdx(null);
    overIdxRef.current = null;
    overPosRef.current = "before";
    if (ds && e.pointerId === ds.pointerId) {
      try {
        listRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
  }, []);

  if (sections.length === 0) return null;

  return (
    <div className="section-outline">
      <div className="section-outline-header">{t("sections")}</div>
      <div
        className="section-outline-list"
        ref={listRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {sections.map((sec, idx) => {
          const isDragging = dragIdx === idx;
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
          const dropClass = isOver
            ? overPos === "before"
              ? " drop-target-before"
              : " drop-target-after"
            : "";
          return (
            <div
              key={sec.label}
              className={`section-outline-item${isDragging ? " dragging" : ""}${dropClass}`}
              onPointerDown={(e) => handlePointerDown(e, idx)}
            >
              <span
                className={`section-outline-dot section-outline-dot--${sec.tag?.id ?? "unknown"}`}
              />
              <span className="section-outline-label">{sec.label}</span>
              <span className="section-outline-count">{sec.lineCount - 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
