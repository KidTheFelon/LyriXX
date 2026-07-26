import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ResizeHandle } from "./ResizeHandle";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("ResizeHandle", () => {
  it("renders a div with role=separator", () => {
    const { container } = render(<ResizeHandle onResize={vi.fn()} />);
    const separators = container.querySelectorAll("[role='separator']");
    expect(separators.length).toBe(1);
  });

  it("has correct aria-orientation for horizontal direction", () => {
    const { container } = render(<ResizeHandle onResize={vi.fn()} direction="horizontal" />);
    const handle = container.querySelector(".resize-handle--horizontal")!;
    expect(handle.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("has correct aria-orientation for vertical direction", () => {
    const { container } = render(<ResizeHandle onResize={vi.fn()} direction="vertical" />);
    const handle = container.querySelector(".resize-handle--vertical")!;
    expect(handle.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("calls onResize with delta on mouse drag", () => {
    const onResize = vi.fn();
    const { container } = render(<ResizeHandle onResize={onResize} direction="horizontal" />);
    const handle = container.querySelector(".resize-handle")!;

    fireEvent.mouseDown(handle, { clientX: 100, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 130, clientY: 50 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalledWith(30);
  });

  it("vertical drag uses clientY delta", () => {
    const onResize = vi.fn();
    const { container } = render(<ResizeHandle onResize={onResize} direction="vertical" />);
    const handle = container.querySelector(".resize-handle")!;

    fireEvent.mouseDown(handle, { clientX: 50, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 50, clientY: 140 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalledWith(40);
  });
});
