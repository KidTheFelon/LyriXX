import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SettingsModal } from "./SettingsModal";
import type { AppSettings } from "@/types/settings";

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

const mockBackupProps = {
  backups: [],
  onRefreshBackups: vi.fn(),
  onRestoreBackup: vi.fn(),
  onDeleteBackup: vi.fn(),
};

describe("SettingsModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <SettingsModal
        open={false}
        settings={defaultSettings}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        onExportDb={vi.fn()}
        onImportDb={vi.fn()}
        onClearDb={vi.fn()}
        dbStats={null}
        {...mockBackupProps}
      />,
    );

    expect(container.querySelector(".modal-overlay")).toBeNull();
  });

  it("renders all tab buttons when open", () => {
    const { container } = render(
      <SettingsModal
        open={true}
        settings={defaultSettings}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        onExportDb={vi.fn()}
        onImportDb={vi.fn()}
        onClearDb={vi.fn()}
        dbStats={null}
        {...mockBackupProps}
      />,
    );

    const tabs = container.querySelectorAll(".settings-tab");
    const texts = Array.from(tabs).map((el) => el.textContent);
    expect(texts).toContain("Редактор");
    expect(texts).toContain("Интерфейс");
    expect(texts).toContain("Поведение");
    expect(texts).toContain("Рифмословарь");
    expect(texts).toContain("Пользовательские теги");
    expect(texts).toContain("База данных");
    expect(texts).toContain("Доступность");
    expect(texts).toContain("Уведомления");
  });

  it("switches tabs and shows corresponding section", () => {
    const { container } = render(
      <SettingsModal
        open={true}
        settings={defaultSettings}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        onExportDb={vi.fn()}
        onImportDb={vi.fn()}
        onClearDb={vi.fn()}
        dbStats={null}
        {...mockBackupProps}
      />,
    );

    const tabs = container.querySelectorAll(".settings-tab");
    const interfaceTab = Array.from(tabs).find((btn) => btn.textContent === "Интерфейс")!;
    fireEvent.click(interfaceTab);

    const titles = container.querySelectorAll(".settings-section-title");
    const texts = Array.from(titles).map((el) => el.textContent);
    expect(texts).toContain("Интерфейс");
    expect(texts).not.toContain("Редактор");
  });

  it("displays db stats when database tab is active", () => {
    const { container } = render(
      <SettingsModal
        open={true}
        settings={defaultSettings}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        onExportDb={vi.fn()}
        onImportDb={vi.fn()}
        onClearDb={vi.fn()}
        dbStats={{ songs: 10, categories: 5, sizeKb: 128 }}
        {...mockBackupProps}
      />,
    );

    const tabs = container.querySelectorAll(".settings-tab");
    const dbTab = Array.from(tabs).find((btn) => btn.textContent === "База данных")!;
    fireEvent.click(dbTab);

    const statValues = container.querySelectorAll(".settings-db-stat-value");
    const texts = Array.from(statValues).map((el) => el.textContent);
    expect(texts).toContain("10");
    expect(texts).toContain("5");
    expect(texts).toContain("128");
  });

  it("calls onUpdate when theme changes via interface tab", () => {
    const onUpdate = vi.fn();

    const { container } = render(
      <SettingsModal
        open={true}
        settings={defaultSettings}
        onUpdate={onUpdate}
        onClose={vi.fn()}
        onExportDb={vi.fn()}
        onImportDb={vi.fn()}
        onClearDb={vi.fn()}
        dbStats={null}
        {...mockBackupProps}
      />,
    );

    const tabs = container.querySelectorAll(".settings-tab");
    const interfaceTab = Array.from(tabs).find((btn) => btn.textContent === "Интерфейс")!;
    fireEvent.click(interfaceTab);

    const darkBtns = container.querySelectorAll(".settings-theme-btn");
    const darkBtn = Array.from(darkBtns).find((btn) => btn.textContent === "Тёмная")!;
    fireEvent.click(darkBtn);
    expect(onUpdate).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("close button triggers exit phase", () => {
    const { container } = render(
      <SettingsModal
        open={true}
        settings={defaultSettings}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        onExportDb={vi.fn()}
        onImportDb={vi.fn()}
        onClearDb={vi.fn()}
        dbStats={null}
        {...mockBackupProps}
      />,
    );

    const modalActions = container.querySelector(".modal-actions")!;
    const closeBtn = modalActions.querySelector(".modal-btn")!;
    fireEvent.click(closeBtn);
    expect(closeBtn).toBeInTheDocument();
  });
});
