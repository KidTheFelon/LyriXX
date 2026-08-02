/** Специальная категория "Все песни". */
export const ALL_CATEGORY = { id: "__all__" } as const;

/** Модель пользовательской категории. */
export interface CustomCategory {
  /** Уникальный идентификатор. */
  id: string;
  /** Отображаемое название. */
  label: string;
  /** ID иконки из CATEGORY_ICONS. */
  icon: string;
}
