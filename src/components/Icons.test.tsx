import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IconTrash, IconEdit, IconStar, IconClose } from "./Icons";

describe("Icons", () => {
  it("IconTrash renders SVG with default size 14", () => {
    const { container } = render(<IconTrash />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("width")).toBe("14");
    expect(svg!.getAttribute("height")).toBe("14");
  });

  it("IconEdit renders SVG with default size 14", () => {
    const { container } = render(<IconEdit />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("width")).toBe("14");
  });

  it("IconStar renders SVG with default size 14", () => {
    const { container } = render(<IconStar />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("width")).toBe("14");
  });

  it("IconClose renders SVG with default size 10", () => {
    const { container } = render(<IconClose />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("width")).toBe("10");
  });

  it("each icon respects custom size prop", () => {
    const icons = [
      { Component: IconTrash, name: "trash" },
      { Component: IconEdit, name: "edit" },
      { Component: IconStar, name: "star" },
      { Component: IconClose, name: "close" },
    ];

    for (const { Component, name } of icons) {
      const { container, unmount } = render(<Component size={32} />);
      const svg = container.querySelector("svg");
      expect(svg!.getAttribute("width")).toBe("32");
      expect(svg!.getAttribute("height")).toBe("32");
      unmount();
    }
  });

  it("IconStar filled=true sets fill attribute to currentColor", () => {
    const { container } = render(<IconStar filled />);
    const svg = container.querySelector("svg");
    expect(svg!.getAttribute("fill")).toBe("currentColor");
  });

  it("IconStar filled=false sets fill attribute to none", () => {
    const { container } = render(<IconStar filled={false} />);
    const svg = container.querySelector("svg");
    expect(svg!.getAttribute("fill")).toBe("none");
  });
});
