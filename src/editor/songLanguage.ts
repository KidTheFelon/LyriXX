import { StreamLanguage, type StreamParser } from "@codemirror/language";

interface SongState {
  inTag: boolean;
}

const songParser: StreamParser<SongState> = {
  startState: (): SongState => ({ inTag: false }),

  token(stream, _state): string | null {
    if (stream.match(/^\[[^\]]*\]/)) {
      return "tagName";
    }

    if (stream.match(/^[^\[\n]+/)) {
      return null;
    }

    if (stream.match(/^\n/)) {
      return null;
    }

    stream.next();
    return null;
  },

  blankLine(_state, _indent) {},
};

export function songLanguage() {
  return StreamLanguage.define(songParser);
}

export type { SongState };
