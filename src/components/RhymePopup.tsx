import { useRef, useEffect, useState } from "react";
import type { RhymeWord } from "@/hooks/useRhymes";
import { useTranslation } from "@/i18n";
import {
  RHYME_SCORE_NORMALIZER,
  RHYME_QUALITY_GOOD,
  RHYME_QUALITY_FAIR,
  RHYME_BAR_MAX_WIDTH,
} from "@/constants";

interface RhymePopupProps {
  rhymes: RhymeWord[];
  loading: boolean;
  error?: string | null;
  activeIndex: number;
  position: { top: number; left: number };
  onSelect: (rhyme: RhymeWord) => void;
  onInsert: (rhyme: RhymeWord) => void;
  onHover: (index: number) => void;
}

export function RhymePopup({
  rhymes,
  loading,
  error,
  activeIndex,
  position,
  onSelect,
  onInsert,
  onHover,
}: RhymePopupProps) {
  const activeRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (copiedIndex === null) return;
    const timer = setTimeout(() => setCopiedIndex(null), 1200);
    return () => clearTimeout(timer);
  }, [copiedIndex]);

  return (
    <div
      className="rhyme-popup"
      style={{ position: "fixed", top: position.top, left: position.left }}
    >
      {loading && rhymes.length === 0 && (
        <div className="rhyme-popup__loading">{t("searching")}</div>
      )}
      {!loading && error && <div className="rhyme-popup__empty">{error}</div>}
      {!loading && !error && rhymes.length === 0 && (
        <div className="rhyme-popup__empty">{t("noRhymes")}</div>
      )}
      {rhymes.map((rhyme, i) => {
        const quality = Math.max(0, Math.min(1, 1 - rhyme.score / RHYME_SCORE_NORMALIZER));
        const color =
          quality > RHYME_QUALITY_GOOD
            ? "var(--tag-verse)"
            : quality > RHYME_QUALITY_FAIR
              ? "var(--tag-chorus)"
              : "var(--text-tertiary)";
        const isCopied = copiedIndex === i;
        return (
          <div
            key={`${rhyme.word}-${i}`}
            ref={i === activeIndex ? activeRef : undefined}
            className={`rhyme-popup__item${i === activeIndex ? " rhyme-popup__item--active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(rhyme);
              setCopiedIndex(i);
            }}
            onMouseEnter={() => onHover(i)}
          >
            <span className="rhyme-popup__word">
              {isCopied ? <span className="rhyme-popup__copied">{t("copied")}</span> : rhyme.word}
            </span>
            <span className="rhyme-popup__meta">
              {rhyme.syllables && (
                <span className="rhyme-popup__syllables">
                  {rhyme.syllables} {t("syl")}
                </span>
              )}
              <span
                className="rhyme-popup__bar"
                style={{ background: color, width: `${quality * RHYME_BAR_MAX_WIDTH}px` }}
              />
              <button
                className="rhyme-popup__insert-btn"
                title={t("insertNewLine")}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onInsert(rhyme);
                }}
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
                  <polyline points="9 10 4 15 9 20" />
                  <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                </svg>
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
