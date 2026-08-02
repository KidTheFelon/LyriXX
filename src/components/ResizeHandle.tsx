import { useCallback, useRef } from "react";

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  direction?: "horizontal" | "vertical";
}

/** Drag-хэндл для изменения ширины колонок sidebar/songlist. */
export function ResizeHandle({ onResize, direction = "horizontal" }: ResizeHandleProps) {
  const startX = useRef(0);
  const startY = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startX.current = e.clientX;
      startY.current = e.clientY;

      const onMouseMove = (ev: MouseEvent) => {
        const delta =
          direction === "horizontal" ? ev.clientX - startX.current : ev.clientY - startY.current;
        startX.current = ev.clientX;
        startY.current = ev.clientY;
        onResize(delta);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [onResize, direction],
  );

  return (
    <div
      className={`resize-handle resize-handle--${direction}`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
      tabIndex={0}
    />
  );
}
