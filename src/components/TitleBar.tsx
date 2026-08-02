import { useState, useCallback } from "react";
import { getWindowAPI, type WindowAPI } from "@/services/window";
import { useTranslation } from "@/i18n";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

let _win: WindowAPI | null = null;
function getWin(): WindowAPI {
  if (!_win) {
    _win = getWindowAPI();
  }
  return _win;
}

/** Кастомный заголовок окна с кнопками minimize/maximize/close. */
export function TitleBar({ title }: { title?: string }) {
  const win = getWin();
  const { t } = useTranslation();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [maximized, setMaximized] = useState(false);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      win.isMaximized().then(setMaximized);
      setCtxMenu({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const menuItems: ContextMenuItem[] = ctxMenu
    ? [
        {
          id: "move",
          label: t("move"),
          disabled: false,
          onClick: () => {
            setCtxMenu(null);
            win.startDragging();
          },
        },
        { id: "separator" },
        {
          id: "minimize",
          label: t("minimize"),
          onClick: () => {
            setCtxMenu(null);
            win.minimize();
          },
        },
        {
          id: "maximize",
          label: maximized ? t("restore") : t("maximize"),
          onClick: () => {
            setCtxMenu(null);
            win.toggleMaximize();
          },
        },
        { id: "separator" },
        {
          id: "close",
          label: t("close"),
          danger: true,
          onClick: () => {
            setCtxMenu(null);
            win.close();
          },
        },
      ]
    : [];

  return (
    <div data-tauri-drag-region className="titlebar" onContextMenu={handleContextMenu}>
      <div className="titlebar-left">
        <img src="/icon-64.png" alt="" width="16" height="16" className="titlebar-icon logo-theme-dark" />
        <img src="/icon-64-inverted.png" alt="" width="16" height="16" className="titlebar-icon logo-theme-light" />
      </div>
      <span className="titlebar-title">{title !== undefined ? (title || t("untitled")) : "LyriXX"}</span>
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
      {ctxMenu && (
        <ContextMenu
          items={menuItems}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
