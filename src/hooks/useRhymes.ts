import { useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { logger } from "@/services/logger";
import { RHYME_DEBOUNCE_MS } from "@/constants";

export interface RhymeWord {
  word: string;
  score: number;
  syllables?: string;
  part_of_speech?: string[];
}

export interface RhymeResponse {
  rhymes: RhymeWord[];
  input_syllables: number | null;
}

export function useRhymes(maxResults?: number) {
  const [rhymes, setRhymes] = useState<RhymeWord[]>([]);
  const [inputSyllables, setInputSyllables] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryWord, setQueryWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number>(0);

  const detectLang = useCallback((word: string): string => {
    let cyrillic = 0;
    let latin = 0;
    for (const ch of word) {
      const code = ch.codePointAt(0)!;
      if (code >= 0x0400 && code <= 0x04ff) cyrillic++;
      else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) latin++;
    }
    return cyrillic > latin ? "ru" : "en";
  }, []);

  const fetchRhymes = useCallback(
    (word: string, lang?: string, depth?: number) => {
      clearTimeout(timerRef.current);

      if (word.length < 2) {
        logger.debug("Rhymes", `fetchRhymes: word too short (${word.length}), clearing`);
        setRhymes([]);
        setInputSyllables(null);
        setQueryWord("");
        setError(null);
        return;
      }

      const detectedLang = lang && lang !== "auto" ? lang : detectLang(word);

      setQueryWord(word);
      setError(null);

      timerRef.current = window.setTimeout(async () => {
        setLoading(true);
        logger.debug("Rhymes", `fetchRhymes: ${word} (${detectedLang}) depth=${depth ?? 2}`);
        try {
          const response = await invoke<RhymeResponse>("get_rhymes", {
            word,
            lang: detectedLang,
            depth: depth ?? 2,
          });
          setRhymes(maxResults ? response.rhymes.slice(0, maxResults) : response.rhymes);
          setInputSyllables(response.input_syllables);
          logger.debug("Rhymes", `found ${response.rhymes.length} rhymes for ${word}`);
        } catch (e) {
          setRhymes([]);
          setInputSyllables(null);
          setError(typeof e === "string" ? e : "Rhyme error");
          logger.error("Rhymes", `Failed to fetch rhymes for ${word}:`, e);
        } finally {
          setLoading(false);
        }
      }, RHYME_DEBOUNCE_MS);
    },
    [detectLang],
  );

  const clearRhymes = useCallback(() => {
    logger.debug("Rhymes", "clearRhymes");
    setRhymes([]);
    setInputSyllables(null);
    setQueryWord("");
    setError(null);
  }, []);

  return { rhymes, inputSyllables, loading, queryWord, error, fetchRhymes, clearRhymes };
}
