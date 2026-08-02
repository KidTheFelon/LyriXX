import { ViewPlugin, Decoration, DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { parseSongTagWithCustoms, type SongTag } from "@/types/songTags";

function getTagColor(
  raw: string,
  allTags: SongTag[],
  isDark: boolean,
): { color: string; bg: string } | null {
  const trimmed = raw.trim();
  const result = parseSongTagWithCustoms(trimmed, allTags);
  if (!result) return null;
  const tag = result.tag;
  const color = isDark ? tag.colorDark : tag.color;
  return { color, bg: `${color}14` };
}

function buildDecorations(view: EditorView, allTags: SongTag[], isDark: boolean): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    const doc = view.state.doc;
    const startLine = doc.lineAt(from);
    const endLine = doc.lineAt(to);

    for (let i = startLine.number; i <= endLine.number; i++) {
      const line = doc.line(i);
      const text = line.text;

      const fullLineTag = /^\[([^\]]+)\]\s*$/;
      const match = fullLineTag.exec(text);
      if (match) {
        const c = getTagColor(match[0], allTags, isDark);
        if (c) {
          builder.add(
            line.from,
            line.to,
            Decoration.mark({
              class: "lyric-tag",
              attributes: { style: `color:${c.color};background:${c.bg}` },
            }),
          );
        }
        continue;
      }

      const inlineMatch = /^\[([^\]]+)\]/.exec(text);
      if (inlineMatch) {
        const c = getTagColor(inlineMatch[0], allTags, isDark);
        if (c) {
          builder.add(
            line.from,
            line.from + inlineMatch[0].length,
            Decoration.mark({
              class: "lyric-tag",
              attributes: { style: `color:${c.color};background:${c.bg}` },
            }),
          );
        }
      }
    }
  }
  return builder.finish();
}

function detectDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** CodeMirror ViewPlugin для подсветки [tag]-строк цветом тега. */
export function tagHighlightPlugin(allTags: SongTag[]) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      tags: SongTag[];
      isDark: boolean;

      constructor(view: EditorView) {
        this.tags = allTags;
        this.isDark = detectDark();
        this.decorations = buildDecorations(view, allTags, this.isDark);
      }

      update(update: ViewUpdate) {
        const newDark = detectDark();
        if (update.docChanged || update.viewportChanged || newDark !== this.isDark) {
          this.isDark = newDark;
          this.decorations = buildDecorations(update.view, this.tags, this.isDark);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}
