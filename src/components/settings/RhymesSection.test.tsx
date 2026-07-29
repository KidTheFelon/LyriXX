import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RhymesSection } from "./RhymesSection";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (l: string, k: string) => k,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue({ system: ["Arial", "Segoe UI"], custom: [] }),
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
  autocloseBrackets: true,
  cursorStyle: "line",
  cursorBlinkRate: 530,
  showSectionOutline: true,
  theme: "system",
  compactMode: false,
  confirmDelete: true,
  showWordCount: false,
  sidebarDefaultOpen: true,
  sidebarWidth: 300,
  sidebarFontSize: 13,
  songListWidth: 280,
  animationsEnabled: true,
  transparency: 100,
  titleBarStyle: "custom",
  language: "ru",
  autoSaveDelay: 300,
  exportFormat: "txt",
  defaultSongTemplate: "[Куплет]\n\n\n[Припев]\n\n",
  startupAction: "empty",
  confirmOnClose: true,
  sortSongsBy: "date",
  sortCategoriesBy: "alphabetical",
  customTags: [],
  rhymeLang: "ru",
  rhymeDepth: 2,
  maxRhymeResults: 50,
  autoBackup: true,
  maxBackups: 10,
  minimizeToTray: true,
  accentColor: "",
  reducedMotion: false,
  highContrast: false,
  toastAutosave: true,
  toastErrors: true,
  toastSuccess: true,
};

describe("RhymesSection", () => {
  it('renders section title "rhymeDict"', () => {
    const { getByText } = render(<RhymesSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("rhymeDict")).toBeTruthy();
  });

  it("renders rhyme language button group", () => {
    const { getByText } = render(<RhymesSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("rhymeLanguage")).toBeTruthy();
    expect(getByText("russian")).toBeTruthy();
    expect(getByText("english")).toBeTruthy();
  });

  it("clicking language calls onUpdate", () => {
    const onUpdate = vi.fn();
    const { getByText } = render(<RhymesSection settings={defaultSettings} onUpdate={onUpdate} />);
    fireEvent.click(getByText("english"));
    expect(onUpdate).toHaveBeenCalledWith({ rhymeLang: "en" });
  });

  it("renders rhyme search depth button group", () => {
    const { getByText } = render(<RhymesSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("rhymeSearchDepth")).toBeTruthy();
    expect(getByText("1")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
  });

  it("clicking depth calls onUpdate", () => {
    const onUpdate = vi.fn();
    const { getByText } = render(<RhymesSection settings={defaultSettings} onUpdate={onUpdate} />);
    fireEvent.click(getByText("3"));
    expect(onUpdate).toHaveBeenCalledWith({ rhymeDepth: 3 });
  });
});
