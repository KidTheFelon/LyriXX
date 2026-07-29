import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DatabaseSection } from "./DatabaseSection";

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

const defaultProps = {
  onExportDb: vi.fn(),
  onImportDb: vi.fn(),
  onClearDb: vi.fn(),
  dbStats: { songs: 5, categories: 2, sizeKb: 128 },
  settings: defaultSettings,
  onUpdate: vi.fn(),
  backups: [{ filename: "backup_20260725_120000.db", size_kb: 64, timestamp: "20260725_120000" }],
  onRefreshBackups: vi.fn(),
  onRestoreBackup: vi.fn(),
  onDeleteBackup: vi.fn(),
};

describe("DatabaseSection", () => {
  it('renders section title "database"', () => {
    const { getByText } = render(<DatabaseSection {...defaultProps} />);
    expect(getByText("database")).toBeTruthy();
  });

  it("renders db stats when provided", () => {
    const { container } = render(<DatabaseSection {...defaultProps} />);
    const stats = container.querySelector(".settings-db-stats") as HTMLElement;
    expect(stats).toBeTruthy();
    expect(stats.querySelector(".settings-db-stat-value")?.textContent).toBe("5");
    expect(stats.querySelector(".settings-db-stat-label")?.textContent).toBe("songs");
  });

  it("renders export and import buttons", () => {
    const { getByText } = render(<DatabaseSection {...defaultProps} />);
    expect(getByText("exportDb")).toBeTruthy();
    expect(getByText("importDb")).toBeTruthy();
  });

  it("export button calls onExportDb", () => {
    const onExportDb = vi.fn();
    const { getByText } = render(<DatabaseSection {...defaultProps} onExportDb={onExportDb} />);
    fireEvent.click(getByText("exportDb"));
    expect(onExportDb).toHaveBeenCalled();
  });

  it("import button calls onImportDb", () => {
    const onImportDb = vi.fn();
    const { getByText } = render(<DatabaseSection {...defaultProps} onImportDb={onImportDb} />);
    fireEvent.click(getByText("importDb"));
    expect(onImportDb).toHaveBeenCalled();
  });

  it("renders auto backup toggle", () => {
    const { getByText } = render(<DatabaseSection {...defaultProps} />);
    expect(getByText("autoBackup")).toBeTruthy();
  });

  it("renders max backups button group when auto backup is on", () => {
    const { getByText } = render(<DatabaseSection {...defaultProps} />);
    expect(getByText("maxBackups")).toBeTruthy();
    expect(getByText("10")).toBeTruthy();
  });

  it("hides max backups when auto backup is off", () => {
    const settings = { ...defaultSettings, autoBackup: false };
    const { queryByText } = render(<DatabaseSection {...defaultProps} settings={settings} />);
    expect(queryByText("maxBackups")).toBeNull();
  });

  it("renders backups list", () => {
    const { getByText } = render(<DatabaseSection {...defaultProps} />);
    expect(getByText("backups (1)")).toBeTruthy();
  });

  it("shows no backups message when empty", () => {
    const { getByText } = render(<DatabaseSection {...defaultProps} backups={[]} />);
    expect(getByText("noBackups")).toBeTruthy();
  });

  it("restore button shows confirmation", () => {
    const { getByText } = render(<DatabaseSection {...defaultProps} />);
    fireEvent.click(getByText("restoreBackup"));
    expect(getByText("restoreConfirm")).toBeTruthy();
  });

  it("confirm restore calls onRestoreBackup", () => {
    const onRestoreBackup = vi.fn();
    const { getByText } = render(
      <DatabaseSection {...defaultProps} onRestoreBackup={onRestoreBackup} />,
    );
    fireEvent.click(getByText("restoreBackup"));
    const confirmBtns = document.querySelectorAll(".modal-btn-confirm.modal-btn--sm");
    fireEvent.click(confirmBtns[0]);
    expect(onRestoreBackup).toHaveBeenCalledWith("backup_20260725_120000.db");
  });

  it("delete backup calls onDeleteBackup", () => {
    const onDeleteBackup = vi.fn();
    const { getByText } = render(
      <DatabaseSection {...defaultProps} onDeleteBackup={onDeleteBackup} />,
    );
    const deleteBtns = document.querySelectorAll(".modal-btn-danger.modal-btn--sm");
    fireEvent.click(deleteBtns[0]);
    expect(onDeleteBackup).toHaveBeenCalledWith("backup_20260725_120000.db");
  });

  it("clear db button shows confirmation then calls onClearDb", () => {
    const onClearDb = vi.fn();
    const { getByText } = render(<DatabaseSection {...defaultProps} onClearDb={onClearDb} />);
    fireEvent.click(getByText("clearDb"));
    fireEvent.click(getByText("yesDelete"));
    expect(onClearDb).toHaveBeenCalled();
  });
});
