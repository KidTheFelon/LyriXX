/** Режим темы оформления. */
export type ThemeMode = "system" | "light" | "dark";
/** Имя системного шрифта. */
export type FontFamily = string;
/** Размер табуляции в пробелах. */
export type TabSize = 2 | 4;
/** Формат экспорта текста песни. */
export type ExportFormat = "txt" | "md" | "lrc";
/** Язык для поиска рифм. */
export type RhymeLang = "ru" | "en" | "auto";
/** Язык интерфейса. */
export type UILang = "ru" | "en";
/** Стиль курсора редактора. */
export type CursorStyle = "line" | "block" | "underline";
/** Стиль заголовка окна. */
export type TitleBarStyle = "custom" | "native";
/** Действие при запуске приложения. */
export type StartupAction = "empty" | "lastSong";
/** Поле сортировки песен. */
export type SortSongsBy = "date" | "alphabetical" | "manual";
/** Поле сортировки категорий. */
export type SortCategoriesBy = "alphabetical" | "manual" | "songCount";

/** Пользовательский шаблон-пресет для создания песни. */
export interface CustomTemplatePreset {
  /** Отображаемое название пресета. */
  label: string;
  /** Шаблон текста с тегами секций. */
  template: string;
}

/** Настройки редактора текста. */
export interface EditorSettings {
  /** Размер шрифта редактора (px). */
  editorFontSize: number;
  /** Множитель межстрочного интервала. */
  lineHeight: number;
  /** Семейство шрифта. */
  fontFamily: FontFamily;
  /** Проверка орфографии. */
  spellCheck: boolean;
  /** Перенос строк. */
  wordWrap: boolean;
  /** Размер табуляции. */
  tabSize: TabSize;
  /** Показывать номера строк. */
  showLineNumbers: boolean;
  /** Подсвечивать текущую строку. */
  highlightCurrentLine: boolean;
  /** Автозакрытие скобок и кавычек. */
  autocloseBrackets: boolean;
  /** Стиль курсора. */
  cursorStyle: CursorStyle;
  /** Скорость мигания курсора (ms). */
  cursorBlinkRate: number;
}

/** Настройки интерфейса. */
export interface UISettings {
  /** Режим темы. */
  theme: ThemeMode;
  /** Компактный режим. */
  compactMode: boolean;
  /** Сайдбар открыт по умолчанию. */
  sidebarDefaultOpen: boolean;
  /** Ширина сайдбара (px). */
  sidebarWidth: number;
  /** Размер шрифта в сайдбаре (px). */
  sidebarFontSize: number;
  /** Ширина списка песен (px). */
  songListWidth: number;
  /** Анимации включены. */
  animationsEnabled: boolean;
  /** Прозрачность окна (0–100%). */
  transparency: number;
  /** Стиль заголовка окна. */
  titleBarStyle: TitleBarStyle;
  /** Язык интерфейса. */
  language: UILang;
  /** Hex акцентного цвета (пустая строка = системный). */
  accentColor: string;
}

/** Настройки поведения приложения. */
export interface BehaviorSettings {
  /** Подтверждение удаления. */
  confirmDelete: boolean;
  /** Показывать счётчик слов. */
  showWordCount: boolean;
  /** Показывать структуру секций. */
  showSectionOutline: boolean;
  /** Задержка автосохранения (ms). */
  autoSaveDelay: number;
  /** Формат экспорта по умолчанию. */
  exportFormat: ExportFormat;
  /** Шаблон текста для новой песни. */
  defaultSongTemplate: string;
  /** Пользовательские пресеты шаблонов. */
  customTemplatePresets: CustomTemplatePreset[];
  /** Действие при запуске. */
  startupAction: StartupAction;
  /** Подтверждение при закрытии окна. */
  confirmOnClose: boolean;
  /** Сортировка песен. */
  sortSongsBy: SortSongsBy;
  /** Сортировка категорий. */
  sortCategoriesBy: SortCategoriesBy;
  /** Сворачивать в трей при закрытии. */
  minimizeToTray: boolean;
}

/** Настройки рифмовки. */
export interface RhymeSettings {
  /** Пользовательские теги (названия). */
  customTags: string[];
  /** Язык для поиска рифм. */
  rhymeLang: RhymeLang;
  /** Глубина поиска рифм (уровни удалённости). */
  rhymeDepth: number;
  /** Максимальное количество рифм в ответе. */
  maxRhymeResults: number;
}

/** Настройки резервного копирования. */
export interface DbSettings {
  /** Автобэкап при сохранении. */
  autoBackup: boolean;
  /** Максимальное количество бэкапов. */
  maxBackups: number;
}

/** Настройки уведомлений. */
export interface NotificationSettings {
  /** Показывать тост автосохранения. */
  toastAutosave: boolean;
  /** Показывать тост ошибок. */
  toastErrors: boolean;
  /** Показывать тост успешных операций. */
  toastSuccess: boolean;
}

/** Настройки доступности. */
export interface AccessibilitySettings {
  /** Reduced motion — отключает анимации. */
  reducedMotion: boolean;
  /** Высокий контраст. */
  highContrast: boolean;
}

/** Полный набор наложений приложения. */
export type AppSettings = EditorSettings &
  UISettings &
  BehaviorSettings &
  RhymeSettings &
  DbSettings &
  NotificationSettings &
  AccessibilitySettings;

/** Значения настроек по умолчанию (44 поля). */
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
