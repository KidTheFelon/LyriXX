// ── Размеры шрифта ──
/** Минимальный размер шрифта редактора (px). */
export const FONT_SIZE_MIN = 11;
/** Максимальный размер шрифта редактора (px). */
export const FONT_SIZE_MAX = 24;

// ── Таймеры ──
/** Длительность анимации выхода песни (ms). */
export const EXIT_ANIM_MS = 150;
/** Задержка debounce для поиска (ms). */
export const SEARCH_DEBOUNCE_MS = 150;
/** Задержка debounce для запроса рифм (ms). */
export const RHYME_DEBOUNCE_MS = 100;

// ── Тосты ──
/** Время жизни тоста (ms). */
export const TOAST_VISIBLE_DURATION_MS = 3850;
/** Длительность анимации закрытия тоста (ms). */
export const TOAST_CLOSE_ANIM_MS = 150;

// ── Модальные окна ──
/** Длительность анимации открытия/закрытия модала (ms). */
export const MODAL_ANIM_DURATION_MS = 200;

// ── Layout ──
/** Breakpoint узкого режима (px). */
export const NARROW_WIDTH = 960;

// ── Typewriter-анимация ──
/** Задержка между символами typewriter (s). */
export const TYPEWRITER_CHAR_DELAY = 0.035;
/** Длительность быстрой анимации (s). */
export const ANIM_FAST_DURATION = 0.12;

// ── Редактор ──
/** Дефолтный межстрочный интервал (px). */
export const DEFAULT_LINE_HEIGHT = 20;
/** Дефолтный размер шрифта (px). */
export const DEFAULT_FONT_SIZE = 13;
/** Множитель расчёта ширины символа. */
export const CHAR_WIDTH_FACTOR = 0.6;
/** Ширина символа gutter-колонки (px). */
export const GUTTER_CHAR_WIDTH = 9;
/** Отступ gutter (px). */
export const GUTTER_PADDING = 12;

// ── Autocomplete popup ──
/** Макс. высота popup автодополнения (px). */
export const AC_POPUP_MAX_HEIGHT = 220;
/** Макс. ширина popup автодополнения (px). */
export const AC_POPUP_MAX_WIDTH = 180;

// ── Rhyme popup ──
/** Макс. высота popup рифм (px). */
export const RHYME_POPUP_MAX_HEIGHT = 260;
/** Макс. ширина popup рифм (px). */
export const RHYME_POPUP_MAX_WIDTH = 200;
/** Макс. высота popup рифм в двухколоночном режиме (px). */
export const RHYME_DOUBLED_MAX_HEIGHT = 280;
/** Макс. ширина popup рифм в двухколоночном режиме (px). */
export const RHYME_DOUBLED_MAX_WIDTH = 220;

// ── Rhyme scoring ──
/** Делитель для нормализации оценки рифмы. */
export const RHYME_SCORE_NORMALIZER = 30;
/** Порог «хорошей» рифмы. */
export const RHYME_QUALITY_GOOD = 0.6;
/** Порог «нормальной» рифмы. */
export const RHYME_QUALITY_FAIR = 0.3;
/** Макс. ширина полосы оценки рифмы (px). */
export const RHYME_BAR_MAX_WIDTH = 32;

// ── Icon picker ──
/** Ширина popup выбора иконки (px). */
export const ICON_PICKER_WIDTH = 260;
/** Высота popup выбора иконки (px). */
export const ICON_PICKER_HEIGHT = 216;
/** Отступ icon picker от якоря (px). */
export const ICON_PICKER_GAP = 4;

// ── Dropdown ──
/** Высота элемента WinDropdown (px). */
export const DROPDOWN_ITEM_HEIGHT = 32;
/** Отступ WinDropdown (px). */
export const DROPDOWN_PADDING = 8;
