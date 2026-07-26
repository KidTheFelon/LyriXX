import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { BehaviorSection } from "./BehaviorSection";

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
};

describe("BehaviorSection", () => {
  it('renders section title "behavior"', () => {
    const { getByText } = render(<BehaviorSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("behavior")).toBeTruthy();
  });

  it("renders autosave delay slider", () => {
    const { getByText } = render(<BehaviorSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("autosaveDelay")).toBeTruthy();
  });

  it("changing autosave delay calls onUpdate", () => {
    const onUpdate = vi.fn();
    const { getByRole } = render(
      <BehaviorSection settings={defaultSettings} onUpdate={onUpdate} />,
    );
    const sliders = document.querySelectorAll('input[type="range"]');
    fireEvent.change(sliders[0], { target: { value: "500" } });
    expect(onUpdate).toHaveBeenCalledWith({ autoSaveDelay: 500 });
  });

  it("renders export format button group with TXT/Markdown/LRC", () => {
    const { getByText } = render(<BehaviorSection settings={defaultSettings} onUpdate={vi.fn()} />);
    expect(getByText("exportFormat")).toBeTruthy();
    expect(getByText("TXT")).toBeTruthy();
    expect(getByText("Markdown")).toBeTruthy();
    expect(getByText("LRC")).toBeTruthy();
  });

  it("clicking export format calls onUpdate", () => {
    const onUpdate = vi.fn();
    const { getByText } = render(
      <BehaviorSection settings={defaultSettings} onUpdate={onUpdate} />,
    );
    fireEvent.click(getByText("Markdown"));
    expect(onUpdate).toHaveBeenCalledWith({ exportFormat: "md" });
  });

  it("renders new song template textarea", () => {
    const { getByText, container } = render(
      <BehaviorSection settings={defaultSettings} onUpdate={vi.fn()} />,
    );
    expect(getByText("newSongTemplate")).toBeTruthy();
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe("[Куплет]\n\n\n[Припев]\n\n");
  });

  it("changing template calls onUpdate", () => {
    const onUpdate = vi.fn();
    const { container } = render(
      <BehaviorSection settings={defaultSettings} onUpdate={onUpdate} />,
    );
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "new" } });
    expect(onUpdate).toHaveBeenCalledWith({ defaultSongTemplate: "new" });
  });
});
