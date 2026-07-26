import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const fluentHighlightStyle = HighlightStyle.define([
  { tag: tags.content, color: "var(--text-primary)" },
]);

export const fluentTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "inherit",
  },
  ".cm-content": {
    caretColor: "var(--text-primary)",
    fontFamily: "inherit",
    padding: "0",
  },
  ".cm-line": {
    padding: "0 2px",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--text-primary)",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "var(--accent-default) !important",
    color: "var(--text-on-accent) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--accent-light)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--text-disabled)",
    fontFamily: "inherit",
    fontSize: "inherit",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 0",
    minWidth: "2em",
    textAlign: "right",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--fill-subtle)",
    border: "1px solid var(--stroke-control)",
    color: "var(--text-tertiary)",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--bg-card-solid)",
    border: "1px solid var(--stroke-card)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-flyout)",
  },
  ".cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: "var(--font-family-text)",
      fontSize: "12px",
    },
    "& > ul > li": {
      padding: "4px 8px",
    },
    "& > ul > li[aria-selected]": {
      backgroundColor: "var(--accent-light)",
      color: "var(--text-primary)",
    },
  },
  ".cm-panels": {
    backgroundColor: "var(--bg-mica)",
    color: "var(--text-primary)",
  },
  ".cm-panel.cm-search": {
    backgroundColor: "var(--bg-card-solid)",
    "& input, & button, & label": {
      fontFamily: "var(--font-family-text)",
      fontSize: "12px",
    },
  },
  "&.cm-focused": {
    outline: "none",
  },
});

export const fluentSyntax = syntaxHighlighting(fluentHighlightStyle);
