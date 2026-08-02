import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { getAutocompleteTags } from "@/types/songTags";
import type { Lang } from "@/i18n/translations";

function songTagCompletion(customTags: string[], lang: Lang) {
  return (ctx: CompletionContext): CompletionResult | null => {
    const line = ctx.state.doc.lineAt(ctx.pos);
    const textBefore = line.text.slice(0, ctx.pos - line.from);

    const bracketMatch = textBefore.match(/\[([^\]]*?)$/);
    if (!bracketMatch) return null;

    const filter = bracketMatch[1].toLowerCase();
    const allTags = getAutocompleteTags(customTags, lang);

    const options = allTags.map((item) => ({
      label: item.label,
      detail: item.tag.label,
      type: "keyword" as const,
    }));

    const from = line.from + bracketMatch.index!;

    return {
      from,
      options: filter
        ? options.filter(
            (o) =>
              o.label.toLowerCase().includes(filter) ||
              (o.detail ?? "").toLowerCase().includes(filter),
          )
        : options,
      validFor: /^\[[^\]]*$/,
    };
  };
}

/** CodeMirror autocompletion extension для тегов песен внутри [...]. */
export function tagAutocompleteExtension(customTags: string[], lang: Lang) {
  return autocompletion({
    override: [songTagCompletion(customTags, lang)],
    activateOnTyping: true,
    maxRenderedOptions: 20,
  });
}
