import { useState, useEffect, useCallback, useRef } from "react";
import { useDroppable } from "@dnd-kit/react";
import { AnimatedText } from "./AnimatedText";

const QUOTE_COUNT = 108;

function getInitialQuoteIndex(): number {
  return Math.floor(Math.random() * QUOTE_COUNT);
}

export function MusicQuotes() {
  const [index, setIndex] = useState(getInitialQuoteIndex);
  const [visible, setVisible] = useState(true);
  const { ref, isDropTarget } = useDroppable({ id: "open-new-window" });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const changeQuote = useCallback(() => {
    setVisible(false);
    timerRef.current = setTimeout(() => {
      setIndex((prev) => {
        let next = Math.floor(Math.random() * QUOTE_COUNT);
        if (QUOTE_COUNT > 1) {
          while (next === prev) next = Math.floor(Math.random() * QUOTE_COUNT);
        }
        return next;
      });
      setVisible(true);
    }, 400);
  }, []);

  useEffect(() => {
    const interval = setInterval(changeQuote, 12000);
    return () => {
      clearInterval(interval);
      clearTimeout(timerRef.current);
    };
  }, [changeQuote]);

  return (
    <div ref={ref} className={`editor-empty${isDropTarget ? " editor-empty--drop-target" : ""}`}>
      <div className="editor-empty-icon">
        <img
          src="/icon-128-inverted.png"
          alt=""
          width="96"
          height="96"
          className="logo-theme-light"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))" }}
        />
        <img
          src="/icon-128.png"
          alt=""
          width="96"
          height="96"
          className="logo-theme-dark"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))" }}
        />
      </div>
      <div className={`music-quote ${visible ? "music-quote--visible" : "music-quote--hidden"}`}>
        <p className="music-quote__text">&laquo;<AnimatedText translationKey={`q${index}`} />&raquo;</p>
        <p className="music-quote__author">&mdash; <AnimatedText translationKey={`qa${index}`} /></p>
      </div>
      <p className="music-quote__hint"><AnimatedText translationKey="quoteHint" /></p>
    </div>
  );
}
