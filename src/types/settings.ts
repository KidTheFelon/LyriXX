export type ThemeMode = "system" | "light" | "dark";
export type FontFamily = string;
export type TabSize = 2 | 4;
export type ExportFormat = "txt" | "md" | "lrc";
export type RhymeLang = "ru" | "en" | "auto";
export type UILang = "ru" | "en";
export type CursorStyle = "line" | "block" | "underline";
export type TitleBarStyle = "custom" | "native";
export type StartupAction = "empty" | "lastSong";
export type SortSongsBy = "date" | "alphabetical" | "manual";
export type SortCategoriesBy = "alphabetical" | "manual" | "songCount";

export interface AppSettings {
  editorFontSize: number;
  lineHeight: number;
  fontFamily: FontFamily;
  spellCheck: boolean;
  wordWrap: boolean;
  tabSize: TabSize;
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
  autocloseBrackets: boolean;
  cursorStyle: CursorStyle;
  cursorBlinkRate: number;
  theme: ThemeMode;
  compactMode: boolean;
  confirmDelete: boolean;
  showWordCount: boolean;
  showSectionOutline: boolean;
  sidebarDefaultOpen: boolean;
  sidebarWidth: number;
  sidebarFontSize: number;
  songListWidth: number;
  animationsEnabled: boolean;
  transparency: number;
  titleBarStyle: TitleBarStyle;
  language: UILang;
  autoSaveDelay: number;
  exportFormat: ExportFormat;
  defaultSongTemplate: string;
  startupAction: StartupAction;
  confirmOnClose: boolean;
  sortSongsBy: SortSongsBy;
  sortCategoriesBy: SortCategoriesBy;
  customTags: string[];
  rhymeLang: RhymeLang;
  rhymeDepth: number;
  maxRhymeResults: number;
  autoBackup: boolean;
  maxBackups: number;
  minimizeToTray: boolean;
  accentColor: string;
  reducedMotion: boolean;
  highContrast: boolean;
  toastAutosave: boolean;
  toastErrors: boolean;
  toastSuccess: boolean;
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
  autocloseBrackets: true,
  cursorStyle: "line",
  cursorBlinkRate: 530,
  theme: "system",
  compactMode: false,
  confirmDelete: true,
  showWordCount: false,
  showSectionOutline: true,
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
  rhymeLang: "auto",
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
