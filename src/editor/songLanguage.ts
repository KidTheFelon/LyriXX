import { StreamLanguage, type StreamParser } from "@codemirror/language";
import { Tag } from "@lezer/highlight";

const parenthesized = Tag.define();

interface SongState {
  inTag: boolean;
}

const songParser: StreamParser<SongState> = {
  startState: (): SongState => ({ inTag: false }),

  token(stream, _state): string | null {
    if (stream.match(/^\[[^\]]*\]/)) {
      return "tagName";
    }

    if (stream.match(/^\([^)]*\)/)) {
      return "parenthesized";
    }

    if (stream.match(/^[^\[\(\n]+/)) {
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

/** Создаёт CodeMirror StreamLanguage для текста песен (теги [tag] + скобки). */
export function songLanguage() {
  return StreamLanguage.define({
    tokenTable: { parenthesized },
    ...songParser,
  });
}

export { parenthesized };
export type { SongState };
