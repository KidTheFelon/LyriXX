import { useRef, useEffect } from "react";
import { DEFAULT_SONG_TAGS, type SongTag } from "@/types/songTags";

interface TagAutocompleteItem {
  label: string;
  tag: SongTag;
}

interface TagAutocompleteProps {
  items: TagAutocompleteItem[];
  activeIndex: number;
  position: { top: number; left: number };
  onSelect: (tag: SongTag) => void;
  onHover: (index: number) => void;
}

export function TagAutocomplete({
  items,
  activeIndex,
  position,
  onSelect,
  onHover,
}: TagAutocompleteProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div
      className="tag-autocomplete"
      style={{ position: "fixed", top: position.top, left: position.left }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          ref={i === activeIndex ? activeRef : undefined}
          className={`tag-autocomplete-item${i === activeIndex ? " active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item.tag);
          }}
          onMouseEnter={() => onHover(i)}
        >
          <span
            className="tag-ac-dot"
            style={{
              background: DEFAULT_SONG_TAGS.find((t) => t.id === item.tag.id)?.color ?? "#999",
            }}
          />
          <span className="tag-ac-label">{item.label}</span>
          <span className="tag-ac-hint">{item.tag.label}</span>
        </div>
      ))}
    </div>
  );
}
