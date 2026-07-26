import { useRef, useMemo, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeCharIds, type CharEntry } from "@/utils/charUtils";
import { ANIM_FAST_DURATION, TYPEWRITER_CHAR_DELAY } from "@/constants";

interface TypewriterInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  spellCheck?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export interface TypewriterInputHandle {
  insertText: (text: string) => void;
}

export const TypewriterInput = forwardRef<TypewriterInputHandle, TypewriterInputProps>(
  function TypewriterInput(
    { value, onChange, placeholder, spellCheck, className, style, ariaLabel },
    ref,
  ) {
    const nativeRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const prevValRef = useRef(value);
    const idsRef = useRef<number[]>([]);
    const nextIdRef = useRef(0);
    const seenRef = useRef<Set<number>>(new Set());
    const initRef = useRef(false);
    const composingRef = useRef(false);

    const syncOverlay = useCallback(() => {
      const n = nativeRef.current;
      const o = overlayRef.current;
      if (!n || !o) return;
      const cs = getComputedStyle(n);
      const keys = [
        "fontFamily",
        "fontSize",
        "lineHeight",
        "fontWeight",
        "letterSpacing",
        "wordSpacing",
        "textIndent",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
      ] as const;
      for (const k of keys) {
        (o.style as unknown as Record<string, string>)[k] = (
          cs as unknown as Record<string, string>
        )[k];
      }
    }, []);

    useEffect(() => {
      syncOverlay();
    }, [className, style, syncOverlay]);

    useEffect(() => {
      initRef.current = true;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        insertText: (text: string) => {
          const n = nativeRef.current;
          if (!n) return;
          const start = n.selectionStart ?? 0;
          const end = n.selectionEnd ?? start;
          const before = value.slice(0, start);
          const after = value.slice(end);
          const newVal = before + text + after;
          const pos = start + text.length;
          onChange(newVal);
          setTimeout(() => {
            const t = nativeRef.current;
            if (t) {
              t.focus();
              t.setSelectionRange(pos, pos);
            }
          }, 0);
        },
      }),
      [value, onChange],
    );

    const entries: CharEntry[] = useMemo(() => {
      const nv = value;
      const ov = prevValRef.current;

      if (ov === nv && idsRef.current.length === nv.length) {
        return idsRef.current.map((id, i) => ({ id, ch: nv[i], newInBatch: 0 }));
      }

      const oldIds = idsRef.current;
      const newIds = computeCharIds(nv, ov, oldIds, nextIdRef);
      idsRef.current = newIds;
      prevValRef.current = nv;

      const batchStart = (() => {
        if (oldIds.length === 0 || newIds.length === 0) return 0;
        const lim = Math.min(oldIds.length, newIds.length);
        for (let i = 0; i < lim; i++) {
          if (oldIds[i] !== newIds[i]) return i;
        }
        return lim;
      })();

      let batchLen = 0;
      for (let i = batchStart; i < newIds.length; i++) {
        if (!seenRef.current.has(newIds[i])) {
          batchLen++;
        } else {
          break;
        }
      }

      for (const id of newIds) {
        seenRef.current.add(id);
      }

      return newIds.map((id, i) => {
        const rel = i - batchStart;
        const batchPos = rel >= 0 && rel < batchLen ? rel + 1 : 0;
        return { id, ch: nv[i], newInBatch: batchPos };
      });
    }, [value]);

    const firstMount = !initRef.current;
    const longPaste = entries.some((e) => e.newInBatch > 5);
    const composing = composingRef.current;
    const noAnim = firstMount || longPaste || composing;

    const nativeCls = composing
      ? (className ?? "")
      : className
        ? `${className} typewriter-native`
        : "typewriter-native";

    const nativeInlineStyle: React.CSSProperties = composing
      ? { ...style }
      : { ...style, color: "transparent" };

    const renderChar = useCallback(
      ({ id, ch, newInBatch }: CharEntry) => {
        const isNew = newInBatch > 0;
        const delay = isNew && !noAnim ? (newInBatch - 1) * TYPEWRITER_CHAR_DELAY : 0;

        return (
          <motion.span
            key={id}
            initial={isNew && !noAnim ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: ANIM_FAST_DURATION, ease: "easeOut" as const },
            }}
            transition={
              isNew && !noAnim
                ? { opacity: { duration: ANIM_FAST_DURATION, ease: "easeOut" as const, delay } }
                : { opacity: { duration: 0 } }
            }
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        );
      },
      [noAnim],
    );

    return (
      <div style={{ position: "relative" }}>
        <input
          ref={nativeRef}
          className={nativeCls}
          style={nativeInlineStyle}
          placeholder={placeholder}
          spellCheck={spellCheck}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          aria-label={ariaLabel}
        />
        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <AnimatePresence>{entries.map((e) => renderChar(e))}</AnimatePresence>
        </div>
      </div>
    );
  },
);
