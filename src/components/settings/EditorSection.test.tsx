import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { EditorSection } from "./EditorSection";

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
  accentColor: "",
};

describe("EditorSection", () => {
  it('renders section title "editor"', () => {
    const { getByText } = render(<EditorSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("editor")).toBeTruthy();
  });

  it("renders font size slider", () => {
    const { getByText, getByRole } = render(
      <EditorSection settings={defaultSettings} onUpdate={vi.fn()} />,
    );
    expect(getByText("fontSize")).toBeTruthy();
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it("renders line spacing slider", () => {
    const { getByText } = render(<EditorSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("lineSpacing")).toBeTruthy();
  });

  it("renders tab size button group (2 and 4)", () => {
    const { getByText } = render(<EditorSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("tabSize")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
  });

  it("spell check toggle exists", () => {
    const { getByText } = render(<EditorSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("spellCheck")).toBeTruthy();
  });
});
