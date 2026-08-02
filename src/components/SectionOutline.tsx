import { useMemo, useCallback, useRef } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import { parseLyricSections } from "@/types/songTags";
import type { SongTag } from "@/types/songTags";
import { AnimatedText } from "./AnimatedText";
import { logger } from "@/services/logger";

interface SectionOutlineProps {
  lyrics: string;
  allTags: SongTag[];
  onJumpToSection: (lineIndex: number) => void;
  onMoveSection: (fromLineIndex: number, toLineIndex: number) => void;
}

function SectionItem({
  sec,
  stableId,
  index,
  onJumpToSection,
  wasJustDraggedRef,
}: {
  sec: ReturnType<typeof parseLyricSections>[number];
  stableId: string;
  index: number;
  onJumpToSection: (lineIndex: number) => void;
  wasJustDraggedRef: React.MutableRefObject<boolean>;
}) {
  const { ref, isDragging } = useSortable({
    id: stableId,
    index,
  });

  const handleClick = useCallback(() => {
    if (wasJustDraggedRef.current) {
      wasJustDraggedRef.current = false;
      return;
    }
    onJumpToSection(sec.lineIndex);
  }, [sec.lineIndex, onJumpToSection, wasJustDraggedRef]);

  return (
    <div
      ref={ref}
      className={`section-outline-item${isDragging ? " dragging" : ""}`}
      onClick={handleClick}
    >
      <span
        className={`section-outline-dot section-outline-dot--${sec.tag?.id ?? "unknown"}`}
      />
      <span className="section-outline-label">{sec.label}</span>
      <span className="section-outline-count">{sec.lineCount - 1}</span>
    </div>
  );
}

/** Drag-and-drop навигатор секций с jump-to и reorder. */
export function SectionOutline({
  lyrics,
  allTags,
  onJumpToSection,
  onMoveSection,
}: SectionOutlineProps) {
  const sections = useMemo(
    () => parseLyricSections(lyrics, allTags),
    [lyrics, allTags],
  );
  const wasJustDraggedRef = useRef(false);
  const lyricsRef = useRef(lyrics);
  lyricsRef.current = lyrics;
  const allTagsRef = useRef(allTags);
  allTagsRef.current = allTags;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;
      const { source } = event.operation;
      if (!source || !isSortable(source)) return;

      const { initialIndex, index } = source;
      if (initialIndex === index) return;

      wasJustDraggedRef.current = true;
      setTimeout(() => {
        wasJustDraggedRef.current = false;
      }, 0);

      const currentSections = parseLyricSections(
        lyricsRef.current,
        allTagsRef.current,
      );
      const fromLineIndex = currentSections[initialIndex]?.lineIndex;
      if (fromLineIndex === undefined) return;

      let toLineIndex: number;
      if (index < currentSections.length) {
        if (index > initialIndex) {
          toLineIndex =
            currentSections[index].lineIndex +
            currentSections[index].lineCount;
        } else {
          toLineIndex = currentSections[index].lineIndex;
        }
      } else {
        const last = currentSections[currentSections.length - 1];
        toLineIndex = last.lineIndex + last.lineCount;
      }

      logger.debug(
        "Outline",
        `move section: line ${fromLineIndex} -> ${toLineIndex} (from idx ${initialIndex} to ${index})`,
      );
      onMoveSection(fromLineIndex, toLineIndex);
    },
    [onMoveSection],
  );

  const stableIds = useMemo(() => {
    const tagCounts = new Map<string, number>();
    return sections.map((sec) => {
      const tagId = sec.tag?.id ?? "unknown";
      const count = tagCounts.get(tagId) ?? 0;
      tagCounts.set(tagId, count + 1);
      return `${tagId}-${count}`;
    });
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <div className="section-outline">
      <div className="section-outline-header"><AnimatedText translationKey="sections" /></div>
      <div className="section-outline-list">
        <DragDropProvider onDragEnd={handleDragEnd}>
          {sections.map((sec, idx) => (
            <SectionItem
              key={stableIds[idx]}
              stableId={stableIds[idx]}
              sec={sec}
              index={idx}
              onJumpToSection={onJumpToSection}
              wasJustDraggedRef={wasJustDraggedRef}
            />
          ))}
        </DragDropProvider>
      </div>
    </div>
  );
}
