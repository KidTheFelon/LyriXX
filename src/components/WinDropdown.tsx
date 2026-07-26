import { useState, useRef, useEffect, useCallback } from "react";
import { DROPDOWN_ITEM_HEIGHT, DROPDOWN_PADDING } from "@/constants";

interface WinDropdownOption {
  value: string;
  label: string;
}

interface WinDropdownProps {
  value: string;
  options: WinDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Override display label when value not in options (e.g. deleted category) */
  label?: string;
  className?: string;
  missing?: boolean;
}

export function WinDropdown({
  value,
  options,
  onChange,
  placeholder,
  label,
  className,
  missing,
}: WinDropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [posStyle, setPosStyle] = useState<React.CSSProperties>({});

  const matched = options.find((o) => o.value === value);
  const displayLabel = label ?? matched?.label ?? "";

  useEffect(() => {
    if (!open || !triggerRef.current || !flyoutRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = options.length * DROPDOWN_ITEM_HEIGHT + DROPDOWN_PADDING;
    const bottomSpace = window.innerHeight - rect.bottom;
    const topSpace = rect.top;
    setPosStyle({
      left: `${rect.left}px`,
      top:
        bottomSpace < estimatedHeight && topSpace > estimatedHeight
          ? `${rect.top - estimatedHeight - 4}px`
          : `${rect.bottom + 4}px`,
      minWidth: `${rect.width}px`,
    });
    const selected = flyoutRef.current.querySelector<HTMLButtonElement>(
      ".win-dropdown-item-selected",
    );
    (selected ?? flyoutRef.current.querySelector<HTMLButtonElement>(".win-dropdown-item"))?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        flyoutRef.current &&
        !flyoutRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = flyoutRef.current?.querySelectorAll<HTMLButtonElement>(".win-dropdown-item");
        if (!items || items.length === 0) return;
        const currentIndex = Array.from(items).findIndex((el) => el === document.activeElement);
        let nextIndex: number;
        if (currentIndex === -1) {
          nextIndex = e.key === "ArrowDown" ? 0 : items.length - 1;
        } else {
          nextIndex =
            e.key === "ArrowDown"
              ? Math.min(currentIndex + 1, items.length - 1)
              : Math.max(currentIndex - 1, 0);
        }
        items[nextIndex]?.focus();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const active = document.activeElement;
        if (active && flyoutRef.current?.contains(active)) {
          (active as HTMLButtonElement).click();
        }
      }
    },
    [open, close],
  );

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`win-dropdown-trigger${missing ? " win-dropdown-missing" : ""}${className ? ` ${className}` : ""}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`win-dropdown-text${!matched && !label && !value ? " win-dropdown-placeholder" : ""}`}
        >
          {displayLabel || placeholder || ""}
        </span>
        <svg className="win-dropdown-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          ref={flyoutRef}
          className="win-dropdown-flyout"
          style={posStyle}
          role="listbox"
          onKeyDown={handleKeyDown}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`win-dropdown-item${opt.value === value ? " win-dropdown-item-selected" : ""}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
            >
              <span className="win-dropdown-item-label">{opt.label}</span>
              {opt.value === value && (
                <svg
                  className="win-dropdown-check"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
