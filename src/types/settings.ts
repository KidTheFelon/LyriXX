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

export interface CustomTemplatePreset {
  label: string;
  template: string;
}

export interface EditorSettings {
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
}

export interface UISettings {
  theme: ThemeMode;
  compactMode: boolean;
  sidebarDefaultOpen: boolean;
  sidebarWidth: number;
  sidebarFontSize: number;
  songListWidth: number;
  animationsEnabled: boolean;
  transparency: number;
  titleBarStyle: TitleBarStyle;
  language: UILang;
  accentColor: string;
}

export interface BehaviorSettings {
  confirmDelete: boolean;
  showWordCount: boolean;
  showSectionOutline: boolean;
  autoSaveDelay: number;
  exportFormat: ExportFormat;
  defaultSongTemplate: string;
  customTemplatePresets: CustomTemplatePreset[];
  startupAction: StartupAction;
  confirmOnClose: boolean;
  sortSongsBy: SortSongsBy;
  sortCategoriesBy: SortCategoriesBy;
  minimizeToTray: boolean;
}

export interface RhymeSettings {
  customTags: string[];
  rhymeLang: RhymeLang;
  rhymeDepth: number;
  maxRhymeResults: number;
}

export interface DbSettings {
  autoBackup: boolean;
  maxBackups: number;
}

export interface NotificationSettings {
  toastAutosave: boolean;
  toastErrors: boolean;
  toastSuccess: boolean;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
}

export type AppSettings = EditorSettings &
  UISettings &
  BehaviorSettings &
  RhymeSettings &
  DbSettings &
  NotificationSettings &
  AccessibilitySettings;

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
  customTemplatePresets: [],
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
