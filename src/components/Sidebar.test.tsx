import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import type { CustomCategory } from "@/types/category";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (l: string, k: string) => k,
  LanguageContext: { Provider: ({ children }: any) => children },
}));

vi.mock("@/types/icons", () => ({
  getIconSvg: () => <svg />,
}));

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const categories: CustomCategory[] = [
  { id: "cat1", label: "Pop", icon: "note", order: 0 },
  { id: "cat2", label: "Rock", icon: "guitar", order: 1 },
];

const baseProps = {
  collapsed: false,
  onToggleCollapse: vi.fn(),
  activeCategory: "__all__",
  onCategoryChange: vi.fn(),
  onAddSong: vi.fn(),
  onAddCategory: vi.fn(),
  onRenameCategory: vi.fn(),
  onUpdateCategoryIcon: vi.fn(),
  onDeleteCategory: vi.fn(),
  onOpenSettings: vi.fn(),
  categories,
  counts: { cat1: 5, cat2: 3 },
  songsTotal: 8,
};

describe("Sidebar", () => {
  it("renders All Songs item", () => {
    const { container } = render(<Sidebar {...baseProps} />);
    const nav = container.querySelector(".sidebar-nav")!;
    expect(within(nav).getByText("allSongs")).toBeTruthy();
  });

  it("renders categories from props", () => {
    const { container } = render(<Sidebar {...baseProps} />);
    const nav = container.querySelector(".sidebar-nav")!;
    expect(within(nav).getByText("Pop")).toBeTruthy();
    expect(within(nav).getByText("Rock")).toBeTruthy();
  });

  it("click All Songs calls onCategoryChange with __all__", () => {
    const onCategoryChange = vi.fn();
    const { container } = render(<Sidebar {...baseProps} onCategoryChange={onCategoryChange} />);
    const nav = container.querySelector(".sidebar-nav")!;
    fireEvent.click(within(nav).getByText("allSongs"));
    expect(onCategoryChange).toHaveBeenCalledWith("__all__");
  });

  it("click on category calls onCategoryChange with cat.id", () => {
    const onCategoryChange = vi.fn();
    const { container } = render(<Sidebar {...baseProps} onCategoryChange={onCategoryChange} />);
    const nav = container.querySelector(".sidebar-nav")!;
    fireEvent.click(within(nav).getByText("Pop"));
    expect(onCategoryChange).toHaveBeenCalledWith("cat1");
  });

  it("click create button calls onAddSong", () => {
    const onAddSong = vi.fn();
    const { container } = render(<Sidebar {...baseProps} onAddSong={onAddSong} />);
    const btnAdd = container.querySelector(".btn-add") as HTMLButtonElement;
    fireEvent.click(btnAdd);
    expect(onAddSong).toHaveBeenCalled();
  });

  it("settings button calls onOpenSettings", () => {
    const onOpenSettings = vi.fn();
    const { container } = render(<Sidebar {...baseProps} onOpenSettings={onOpenSettings} />);
    const settingsBtn = container.querySelector(".sidebar-settings-btn") as HTMLButtonElement;
    fireEvent.click(settingsBtn);
    expect(onOpenSettings).toHaveBeenCalled();
  });
});
