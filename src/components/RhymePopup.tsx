import { useRef, useEffect, useState, useMemo } from "react";
import type { RhymeWord } from "@/hooks/useRhymes";
import { useTranslation } from "@/i18n";
import {
  RHYME_SCORE_NORMALIZER,
  RHYME_QUALITY_GOOD,
  RHYME_QUALITY_FAIR,
  RHYME_BAR_MAX_WIDTH,
} from "@/constants";

type PosFilter = "all" | "noun" | "adj" | "verb" | "adv" | "pronoun" | "preposition" | "conjunction" | "article" | "interjection" | "other";

const POS_MAP: Record<string, PosFilter> = {
  с: "noun",
  п: "adj",
  г: "verb",
  н: "adv",
  мс: "pronoun",
  "мс-п": "pronoun",
  предл: "preposition",
  союз: "conjunction",
  артикль: "article",
  межд: "interjection",
};

function resolvePosList(codes?: string[]): Set<PosFilter> {
  const set = new Set<PosFilter>();
  if (!codes) {
    set.add("other");
    return set;
  }
  let mapped = false;
  for (const code of codes) {
    const f = POS_MAP[code];
    if (f) {
      set.add(f);
      mapped = true;
    }
  }
  if (!mapped) set.add("other");
  return set;
}

function matchesFilter(codes: string[] | undefined, filter: PosFilter): boolean {
  if (filter === "all") return true;
  const cats = resolvePosList(codes);
  return cats.has(filter);
}

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
  const [posFilter, setPosFilter] = useState<PosFilter>("all");

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (copiedIndex === null) return;
    const timer = setTimeout(() => setCopiedIndex(null), 1200);
    return () => clearTimeout(timer);
  }, [copiedIndex]);

  const availablePos = useMemo(() => {
    const set = new Set<PosFilter>();
    for (const r of rhymes) {
      for (const cat of resolvePosList(r.part_of_speech)) {
        set.add(cat);
      }
    }
    return set;
  }, [rhymes]);

  const filtered = useMemo(() => {
    if (posFilter === "all") return rhymes;
    return rhymes.filter((r) => matchesFilter(r.part_of_speech, posFilter));
  }, [rhymes, posFilter]);

  const mappedActiveIndex = useMemo(() => {
    if (posFilter === "all") return activeIndex;
    const activeWord = rhymes[activeIndex];
    if (!activeWord) return -1;
    return filtered.findIndex((r) => r === activeWord);
  }, [rhymes, filtered, activeIndex, posFilter]);

  const POS_FILTERS: { key: PosFilter; label: string }[] = [
    { key: "all", label: t("posAll") },
    { key: "noun", label: t("posNoun") },
    { key: "adj", label: t("posAdj") },
    { key: "verb", label: t("posVerb") },
    { key: "adv", label: t("posAdv") },
    { key: "pronoun", label: t("posPronoun") },
    { key: "preposition", label: t("posPreposition") },
    { key: "conjunction", label: t("posConjunction") },
    { key: "article", label: t("posArticle") },
    { key: "interjection", label: t("posInterjection") },
    { key: "other", label: t("posOther") },
  ];

  const visibleFilters = POS_FILTERS.filter(
    (f) => f.key === "all" || availablePos.has(f.key),
  );

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
      {!loading && !error && rhymes.length > 0 && (
        <div className="rhyme-popup__filters">
          {visibleFilters.map((f) => (
            <button
              key={f.key}
              className={`rhyme-popup__filter${posFilter === f.key ? " active" : ""}`}
              onClick={() => setPosFilter(f.key)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {filtered.map((rhyme, i) => {
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
            ref={i === mappedActiveIndex ? activeRef : undefined}
            className={`rhyme-popup__item${i === mappedActiveIndex ? " rhyme-popup__item--active" : ""}`}
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
