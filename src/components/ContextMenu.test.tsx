import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("ContextMenu", () => {
  const baseItems: ContextMenuItem[] = [
    { id: "copy", label: "Copy", onClick: vi.fn() },
    { id: "paste", label: "Paste", onClick: vi.fn() },
  ];

  it("renders menu items", () => {
    const { getByText } = render(
      <ContextMenu items={baseItems} x={100} y={100} onClose={vi.fn()} />,
    );
    expect(getByText("Copy")).toBeTruthy();
    expect(getByText("Paste")).toBeTruthy();
  });

  it("click on item calls onClick and then onClose", async () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    const items: ContextMenuItem[] = [{ id: "act", label: "Action", onClick }];

    const { getByText } = render(<ContextMenu items={items} x={100} y={100} onClose={onClose} />);
    await (async () => {
      fireEvent.click(getByText("Action"));
    })();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("click on disabled item does not call onClick", async () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    const items: ContextMenuItem[] = [{ id: "off", label: "Off", onClick, disabled: true }];

    const { getByText } = render(<ContextMenu items={items} x={100} y={100} onClose={onClose} />);
    await (async () => {
      fireEvent.click(getByText("Off"));
    })();
    expect(onClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("separator renders between items", () => {
    const items: ContextMenuItem[] = [
      { id: "a", label: "A", onClick: vi.fn() },
      { id: "separator" },
      { id: "b", label: "B", onClick: vi.fn() },
    ];
    render(<ContextMenu items={items} x={100} y={100} onClose={vi.fn()} />);
    const separators = document.body.querySelectorAll(".context-menu-separator");
    expect(separators.length).toBe(1);
  });

  it("escape key calls onClose", async () => {
    const onClose = vi.fn();
    const { getByRole } = render(
      <ContextMenu items={baseItems} x={100} y={100} onClose={onClose} />,
    );
    const menu = getByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
