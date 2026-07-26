import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const menu = ref.current;
    const rect = menu.getBoundingClientRect();
    const pad = 8;
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - pad) {
      left = window.innerWidth - rect.width - pad;
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = window.innerHeight - rect.height - pad;
    }
    menu.style.left = `${Math.max(pad, left)}px`;
    menu.style.top = `${Math.max(pad, top)}px`;
    const first = menu.querySelector<HTMLButtonElement>(".context-menu-item");
    first?.focus();
  }, [x, y]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const btns = ref.current?.querySelectorAll<HTMLButtonElement>(".context-menu-item");
        if (!btns?.length) return;
        const cur = Array.from(btns).findIndex((el) => el === document.activeElement);
        let next: number;
        if (cur === -1) {
          next = e.key === "ArrowDown" ? 0 : btns.length - 1;
        } else {
          next = e.key === "ArrowDown" ? Math.min(cur + 1, btns.length - 1) : Math.max(cur - 1, 0);
        }
        btns[next]?.focus();
      }
    },
    [onClose],
  );

  return createPortal(
    <div ref={ref} className="context-menu" role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, i) => {
        if (item.id === "separator") {
          return <div key={i} className="context-menu-separator" role="separator" />;
        }
        return (
          <button
            key={item.id}
            type="button"
            className={`context-menu-item${item.danger ? " context-menu-item-danger" : ""}${item.disabled ? " context-menu-item-disabled" : ""}`}
            role="menuitem"
            disabled={item.disabled}
            tabIndex={-1}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.();
                onClose();
              }
            }}
          >
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span className="context-menu-label">{item.label ?? ""}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
