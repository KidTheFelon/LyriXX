export type ThemeMode = "system" | "light" | "dark";
export type FontFamily = string;
export type TabSize = 2 | 4;
export type ExportFormat = "txt" | "md" | "lrc";
export type RhymeLang = "ru" | "en" | "auto";
export type UILang = "ru" | "en";

export interface AppSettings {
  editorFontSize: number;
  lineHeight: number;
  fontFamily: FontFamily;
  spellCheck: boolean;
  wordWrap: boolean;
  tabSize: TabSize;
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
  theme: ThemeMode;
  compactMode: boolean;
  confirmDelete: boolean;
  showWordCount: boolean;
  showSectionOutline: boolean;
  sidebarDefaultOpen: boolean;
  sidebarWidth: number;
  songListWidth: number;
  language: UILang;
  autoSaveDelay: number;
  exportFormat: ExportFormat;
  defaultSongTemplate: string;
  customTags: string[];
  rhymeLang: RhymeLang;
  rhymeDepth: number;
  autoBackup: boolean;
  maxBackups: number;
  minimizeToTray: boolean;
  accentColor: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
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
  showSectionOutline: true,
  sidebarDefaultOpen: true,
  sidebarWidth: 300,
  songListWidth: 280,
  language: "ru",
  autoSaveDelay: 300,
  exportFormat: "txt",
  defaultSongTemplate: "[Куплет]\n\n\n[Припев]\n\n",
  customTags: [],
  rhymeLang: "auto",
  rhymeDepth: 2,
  autoBackup: true,
  maxBackups: 10,
  minimizeToTray: true,
  accentColor: "",
};
