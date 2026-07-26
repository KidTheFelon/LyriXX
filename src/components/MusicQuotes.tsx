import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../i18n";

const QUOTE_COUNT = 108;

function getInitialQuoteIndex(): number {
  return Math.floor(Math.random() * QUOTE_COUNT);
}

export function MusicQuotes() {
  const [index, setIndex] = useState(getInitialQuoteIndex);
  const [visible, setVisible] = useState(true);
  const { t } = useTranslation();

  const changeQuote = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
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
    return () => clearInterval(interval);
  }, [changeQuote]);

  return (
    <div className="editor-empty">
      <div className="editor-empty-icon">
        <img
          src="/icon-128.png"
          alt=""
          width="96"
          height="96"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))" }}
        />
      </div>
      <div className={`music-quote ${visible ? "music-quote--visible" : "music-quote--hidden"}`}>
        <p className="music-quote__text">&laquo;{t(`q${index}`)}&raquo;</p>
        <p className="music-quote__author">&mdash; {t(`qa${index}`)}</p>
      </div>
      <p className="music-quote__hint">{t("quoteHint")}</p>
    </div>
  );
}
