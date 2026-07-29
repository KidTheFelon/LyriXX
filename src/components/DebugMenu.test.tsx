import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DebugMenu } from "./DebugMenu";
import type { AppSettings } from "@/types/settings";
import type { Song } from "@/types/song";
import type { CustomCategory } from "@/types/category";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (l: string, k: string) => k,
  LanguageContext: { Provider: ({ children }: any) => children },
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const defaultSettings: AppSettings = {
  editorFontSize: 13,
  lineHeight: 1.8,
  fontFamily: "Segoe UI Variable Text",
  spellCheck: true,
  wordWrap: true,
  tabSize: 2,
  showLineNumbers: true,
  highlightCurrentLine: true,
  autocloseBrackets: true,
  cursorStyle: "line",
  cursorBlinkRate: 530,
  theme: "system",
  compactMode: false,
  confirmDelete: true,
  showWordCount: true,
  showSectionOutline: true,
  sidebarDefaultOpen: true,
  sidebarWidth: 260,
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

const baseProps = {
  open: true,
  onClose: vi.fn(),
  settings: defaultSettings,
  songs: [] as Song[],
  categories: [] as CustomCategory[],
};

function getDebugModal() {
  return document.body.querySelector(".debug-modal") as HTMLElement;
}

describe("DebugMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("returns null when open=false", () => {
    const { container } = render(<DebugMenu {...baseProps} open={false} />);
    expect(container.querySelector(".debug-modal")).toBeNull();
    expect(document.body.querySelector(".debug-modal")).toBeNull();
  });

  it("renders debug modal when open=true", () => {
    render(<DebugMenu {...baseProps} />);
    const modal = getDebugModal();
    expect(modal).not.toBeNull();
    expect(modal.getAttribute("aria-label")).toBe("Debug Menu");
  });

  it("has tab buttons for Info, Settings, Logs, etc", () => {
    render(<DebugMenu {...baseProps} />);
    const modal = getDebugModal();
    const tabs = modal.querySelectorAll(".debug-tab");
    const tabTexts = Array.from(tabs).map((t) => t.textContent);
    expect(tabTexts).toContain("Info");
    expect(tabTexts).toContain("Settings");
    expect(tabTexts).toContain("Logs");
    expect(tabTexts).toContain("Perf");
    expect(tabTexts).toContain("SQL");
    expect(tabTexts).toContain("Anims");
    expect(tabTexts).toContain("Actions");
  });

  it("click Close calls onClose", () => {
    const onClose = vi.fn();
    render(<DebugMenu {...baseProps} onClose={onClose} />);
    const modal = getDebugModal();
    const closeBtn = modal.querySelector(".modal-btn-cancel") as HTMLButtonElement;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("Escape key calls onClose", () => {
    const onClose = vi.fn();
    render(<DebugMenu {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
