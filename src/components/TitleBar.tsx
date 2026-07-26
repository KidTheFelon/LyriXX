import { getWindowAPI, type WindowAPI } from "@/services/window";
import { useTranslation } from "@/i18n";

let _win: WindowAPI | null = null;
function getWin(): WindowAPI {
  if (!_win) {
    _win = getWindowAPI();
  }
  return _win;
}

export function TitleBar() {
  const win = getWin();
  const { t } = useTranslation();

  return (
    <div data-tauri-drag-region className="titlebar">
      <span className="titlebar-title">LyriXX</span>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn"
          onClick={() => win.minimize()}
          aria-label={t("minimize")}
          type="button"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="0" y="4.5" width="10" height="1" rx="0.5" fill="currentColor" />
          </svg>
        </button>
        <button
          className="titlebar-btn"
          onClick={() => win.toggleMaximize()}
          aria-label={t("maximize")}
          type="button"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect
              x="1.5"
              y="1.5"
              width="7"
              height="7"
              rx="1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={() => win.close()}
          aria-label={t("close")}
          type="button"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line
              x1="1.5"
              y1="1.5"
              x2="8.5"
              y2="8.5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <line
              x1="8.5"
              y1="1.5"
              x2="1.5"
              y2="8.5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
