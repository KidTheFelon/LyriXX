import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
import { UISection } from "./UISection";

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

function renderSection() {
  const result = render(<UISection settings={defaultSettings} onUpdate={vi.fn()} />);
  const section = result.container.querySelector(".settings-section") as HTMLElement;
  return { ...result, section };
}

describe("UISection", () => {
  it('renders section title "interface"', () => {
    const { section } = renderSection();
    expect(within(section).getByText("interface")).toBeTruthy();
  });

  it("renders theme button group with system/light/dark", () => {
    const { section } = renderSection();
    expect(within(section).getByText("theme")).toBeTruthy();
    expect(within(section).getByText("systemTheme")).toBeTruthy();
    expect(within(section).getByText("lightTheme")).toBeTruthy();
    expect(within(section).getByText("darkTheme")).toBeTruthy();
  });

  it("clicking theme calls onUpdate", () => {
    const onUpdate = vi.fn();
    const result = render(<UISection settings={defaultSettings} onUpdate={onUpdate} />);
    const section = result.container.querySelector(".settings-section") as HTMLElement;
    fireEvent.click(within(section).getByText("darkTheme"));
    expect(onUpdate).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("renders compact mode toggle", () => {
    const { section } = renderSection();
    expect(within(section).getByText("compactMode")).toBeTruthy();
  });

  it("renders confirm delete toggle", () => {
    const { section } = renderSection();
    expect(within(section).getByText("confirmDelete")).toBeTruthy();
  });

  it("renders word count status bar toggle", () => {
    const { section } = renderSection();
    expect(within(section).getByText("wordCountStatusBar")).toBeTruthy();
  });

  it("renders sidebar default open toggle", () => {
    const { section } = renderSection();
    expect(within(section).getByText("sidebarDefaultOpen")).toBeTruthy();
  });

  it("renders sidebar width slider", () => {
    const { section } = renderSection();
    expect(within(section).getByText("sidebarWidth")).toBeTruthy();
  });

  it("renders language button group with ru/en", () => {
    const { section } = renderSection();
    expect(within(section).getByText("interfaceLanguage")).toBeTruthy();
    expect(within(section).getByText("russian")).toBeTruthy();
    expect(within(section).getByText("english")).toBeTruthy();
  });

  it("clicking language calls onUpdate", () => {
    const onUpdate = vi.fn();
    const result = render(<UISection settings={defaultSettings} onUpdate={onUpdate} />);
    const section = result.container.querySelector(".settings-section") as HTMLElement;
    fireEvent.click(within(section).getByText("english"));
    expect(onUpdate).toHaveBeenCalledWith({ language: "en" });
  });
});
