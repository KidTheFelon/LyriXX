export interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  category: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SongListItem = Pick<
  Song,
  "id" | "title" | "artist" | "lyrics" | "pinned" | "updatedAt"
>;
