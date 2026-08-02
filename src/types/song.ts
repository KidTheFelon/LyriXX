/** Полная модель песни. */
/** Песня. */
export interface Song {
  /** Уникальный идентификатор. */
  id: string;
  /** Название песни. */
  title: string;
  /** Имя исполнителя. */
  artist: string;
  /** Текст песни с тегами секций. */
  lyrics: string;
  /** ID категории. */
  category: string;
  /** Закреплена ли в списке. */
  pinned: boolean;
  /** Timestamp создания (ms). */
  createdAt: number;
  /** Timestamp последнего обновления (ms). */
  updatedAt: number;
}

/** Сокращённый элемент списка песен (без полного текста). */
export type SongListItem = Pick<
  Song,
  "id" | "title" | "artist" | "lyrics" | "pinned" | "updatedAt" | "category"
>;
