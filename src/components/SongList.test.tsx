import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SongList } from "./SongList";
import type { SongListItem } from "@/types/song";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (l: string, k: string) => k,
  LanguageContext: { Provider: ({ children }: any) => children },
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn().mockResolvedValue([]) }));

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (v: any) => v,
}));

const makeSong = (id: string, title: string, artist = "", pinned = false): SongListItem => ({
  id,
  title,
  artist,
  lyrics: "first line\nsecond line",
  pinned,
  updatedAt: Date.now(),
});

const songs: SongListItem[] = [
  makeSong("1", "Hello World", "Alice"),
  makeSong("2", "Goodbye Moon", "Bob"),
  makeSong("3", "Another Song", "Charlie", true),
];

const baseProps = {
  activeId: null,
  exitingId: null,
  onSelect: vi.fn(),
  onTogglePin: vi.fn(),
  onRequestDelete: vi.fn(),
  selectedIds: new Set<string>(),
  onToggleSelect: vi.fn(),
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn(),
  onRequestDeleteSelected: vi.fn(),
};

describe("SongList", () => {
  it("renders empty state when songs is empty", () => {
    const { getByText } = render(<SongList songs={[]} {...baseProps} />);
    expect(getByText("noEntries")).toBeTruthy();
  });

  it("renders song items with title", () => {
    const { getByText } = render(<SongList songs={songs} {...baseProps} />);
    expect(getByText("Hello World")).toBeTruthy();
    expect(getByText("Goodbye Moon")).toBeTruthy();
    expect(getByText("Another Song")).toBeTruthy();
  });

  it("click on song item calls onSelect", () => {
    const onSelect = vi.fn();
    const { container } = render(<SongList songs={songs} {...baseProps} onSelect={onSelect} />);
    const items = container.querySelectorAll(".song-list-item");
    fireEvent.click(items[0]);
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("search input filters songs", () => {
    const { container } = render(<SongList songs={songs} {...baseProps} />);
    const input = container.querySelector(".search-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Hello" } });
    const items = container.querySelectorAll(".song-list-item");
    expect(items.length).toBe(1);
  });

  it("empty search result shows nothingFound", () => {
    const { container, getByText } = render(<SongList songs={songs} {...baseProps} />);
    const input = container.querySelector(".search-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "zzzzz" } });
    expect(getByText("nothingFound")).toBeTruthy();
  });

  it("click pin button calls onTogglePin", () => {
    const onTogglePin = vi.fn();
    const { container } = render(
      <SongList songs={songs} {...baseProps} onTogglePin={onTogglePin} />,
    );
    const pinBtn = container.querySelector(".song-list-item-pin") as HTMLButtonElement;
    fireEvent.click(pinBtn);
    expect(onTogglePin).toHaveBeenCalledWith("1");
  });

  it("click delete button calls onRequestDelete", () => {
    const onRequestDelete = vi.fn();
    const { container } = render(
      <SongList songs={songs} {...baseProps} onRequestDelete={onRequestDelete} />,
    );
    const deleteBtn = container.querySelector(".song-list-item-delete") as HTMLButtonElement;
    fireEvent.click(deleteBtn);
    expect(onRequestDelete).toHaveBeenCalledWith("1");
  });
});
