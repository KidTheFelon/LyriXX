import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { CustomTagsSection } from "./CustomTagsSection";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (l: string, k: string) => k,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue({ system: ["Arial", "Segoe UI"], custom: [] }),
}));

vi.mock("@/types/songTags", () => ({
  getLocalizedDefaultTags: () => [
    { id: "verse", label: "Куплет", color: "#0078d4" },
    { id: "chorus", label: "Припев", color: "#107c10" },
    { id: "bridge", label: "Бридж", color: "#d83b01" },
  ],
}));

const defaultSettings = {
  editorFontSize: 13,
  lineHeight: 1.8,
  fontFamily: "Segoe UI Variable Text",
  spellCheck: true,
  wordWrap: true,
  tabSize: 4,
  showLineNumbers: false,
  highlightCurrentLine: true,
  theme: "system",
  compactMode: false,
  confirmDelete: true,
  showWordCount: false,
  sidebarDefaultOpen: true,
  sidebarWidth: 300,
  songListWidth: 280,
  language: "ru",
  autoSaveDelay: 300,
  exportFormat: "txt",
  defaultSongTemplate: "[Куплет]\n\n\n[Припев]\n\n",
  customTags: [],
  rhymeLang: "ru",
  rhymeDepth: 2,
  autoBackup: true,
  maxBackups: 10,
};

describe("CustomTagsSection", () => {
  it('renders section title "customTags"', () => {
    const { getByText } = render(
      <CustomTagsSection settings={defaultSettings} onUpdate={vi.fn()} />,
    );
    expect(getByText("customTags")).toBeTruthy();
  });

  it("renders builtin tags", () => {
    const { getByText } = render(
      <CustomTagsSection settings={defaultSettings} onUpdate={vi.fn()} />,
    );
    expect(getByText("builtinTags")).toBeTruthy();
    expect(getByText("Куплет")).toBeTruthy();
    expect(getByText("Припев")).toBeTruthy();
    expect(getByText("Бридж")).toBeTruthy();
  });

  it("renders input for new tag", () => {
    const { getByPlaceholderText } = render(
      <CustomTagsSection settings={defaultSettings} onUpdate={vi.fn()} />,
    );
    expect(getByPlaceholderText("newTag")).toBeTruthy();
  });

  it("renders add button", () => {
    const { getByText } = render(
      <CustomTagsSection settings={defaultSettings} onUpdate={vi.fn()} />,
    );
    expect(getByText("add")).toBeTruthy();
  });

  it("adding tag via button calls onUpdate", () => {
    const onUpdate = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <CustomTagsSection settings={defaultSettings} onUpdate={onUpdate} />,
    );
    const input = getByPlaceholderText("newTag");
    fireEvent.change(input, { target: { value: "MyTag" } });
    fireEvent.click(getByText("add"));
    expect(onUpdate).toHaveBeenCalledWith({ customTags: ["MyTag"] });
  });

  it("adding tag via Enter key calls onUpdate", () => {
    const onUpdate = vi.fn();
    const { getByPlaceholderText } = render(
      <CustomTagsSection settings={defaultSettings} onUpdate={onUpdate} />,
    );
    const input = getByPlaceholderText("newTag");
    fireEvent.change(input, { target: { value: "MyTag" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onUpdate).toHaveBeenCalledWith({ customTags: ["MyTag"] });
  });

  it("does not add empty tag", () => {
    const onUpdate = vi.fn();
    const { getByText } = render(
      <CustomTagsSection settings={defaultSettings} onUpdate={onUpdate} />,
    );
    fireEvent.click(getByText("add"));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("renders custom tags with remove button", () => {
    const settings = { ...defaultSettings, customTags: ["Custom1", "Custom2"] };
    const { getByText } = render(<CustomTagsSection settings={settings} onUpdate={vi.fn()} />);
    expect(getByText("yourTags")).toBeTruthy();
    expect(getByText("Custom1")).toBeTruthy();
    expect(getByText("Custom2")).toBeTruthy();
  });

  it("removing custom tag calls onUpdate", () => {
    const onUpdate = vi.fn();
    const settings = { ...defaultSettings, customTags: ["Custom1", "Custom2"] };
    const { getAllByText } = render(<CustomTagsSection settings={settings} onUpdate={onUpdate} />);
    const removeButtons = getAllByText("x");
    fireEvent.click(removeButtons[0]);
    expect(onUpdate).toHaveBeenCalledWith({ customTags: ["Custom2"] });
  });
});
