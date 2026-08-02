import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  placeholder as cmPlaceholder,
  type KeyBinding,
} from "@codemirror/view";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { highlightSelectionMatches } from "@codemirror/search";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { indentOnInput } from "@codemirror/language";
import { songLanguage } from "./songLanguage";
import { fluentTheme, fluentSyntax } from "./fluentTheme";
import { tagAutocompleteExtension } from "./tagCompletion";
import { tagHighlightPlugin } from "./tagHighlight";
import { type SongTag } from "@/types/songTags";
import { type RhymeWord } from "@/hooks/useRhymes";
import { getCurrentWord } from "@/utils/charUtils";
import { RhymePopup } from "@/components/RhymePopup";
import { copyToClipboard } from "@/services/clipboard";
import { logger } from "@/services/logger";

/** Imperative handle компонента SongLyricsEditor: insertText, scrollToLine, getCursorLine. */
export interface SongLyricsEditorHandle {
  /** Вставить текст в позицию курсора. */
  insertText: (text: string) => void;
  /** Прокрутить к указанной строке. */
  scrollToLine: (lineIndex: number) => void;
  /** Номер строки под курсором. */
  getCursorLine: () => number;
}

interface RhymePopupState {
  visible: boolean;
  pos: { top: number; left: number };
  wordRange: { start: number; end: number };
  index: number;
}

const EMPTY_RHYME_STATE: RhymePopupState = {
  visible: false,
  pos: { top: 0, left: 0 },
  wordRange: { start: 0, end: 0 },
  index: 0,
};

interface SongLyricsEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  spellCheck?: boolean;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  wordWrap: boolean;
  tabSize: number;
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
  autocloseBrackets: boolean;
  cursorStyle: string;
  cursorBlinkRate: number;
  customTags: string[];
  allTags: SongTag[];
  lang: string;
  rhymes?: RhymeWord[];
  rhymeLoading?: boolean;
  rhymeError?: string | null;
  onRhymeRequest?: (word: string) => void;
  onRhymeDismiss?: () => void;
  onCopyWord?: (word: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** CodeMirror-редактор текста песен с интеграцией rhyme popup, тегов и подсветки. */
export const SongLyricsEditor = forwardRef<SongLyricsEditorHandle, SongLyricsEditorProps>(
  function SongLyricsEditor(
    {
      value,
      onChange,
      placeholder,
      spellCheck,
      fontSize,
      lineHeight,
      fontFamily,
      wordWrap,
      tabSize,
      showLineNumbers,
      highlightCurrentLine,
      autocloseBrackets,
      cursorStyle,
      cursorBlinkRate,
      customTags,
      allTags,
      lang,
      rhymes,
      rhymeLoading,
      rhymeError,
      onRhymeRequest,
      onRhymeDismiss,
      onCopyWord,
      onKeyDown,
      className,
      style,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const onChangeRef = useRef(onChange);
    const onKeyDownRef = useRef(onKeyDown);
    const onRhymeRequestRef = useRef(onRhymeRequest);
    const onRhymeDismissRef = useRef(onRhymeDismiss);
    const onCopyWordRef = useRef(onCopyWord);
    const rhymesRef = useRef(rhymes);
    const allTagsRef = useRef(allTags);

    onChangeRef.current = onChange;
    onKeyDownRef.current = onKeyDown;
    onRhymeRequestRef.current = onRhymeRequest;
    onRhymeDismissRef.current = onRhymeDismiss;
    onCopyWordRef.current = onCopyWord;
    rhymesRef.current = rhymes;
    allTagsRef.current = allTags;

    const [rhymeState, setRhymeState] = useState<RhymePopupState>(EMPTY_RHYME_STATE);
    const rhymeStateRef = useRef(rhymeState);
    rhymeStateRef.current = rhymeState;

    const handleRhymeSelect = useCallback((rhyme: RhymeWord) => {
      copyToClipboard(rhyme.word);
      onCopyWordRef.current?.(rhyme.word);
      logger.debug("Editor", `rhyme copied: "${rhyme.word}"`);
      setRhymeState(EMPTY_RHYME_STATE);
      onRhymeDismissRef.current?.();
      viewRef.current?.focus();
    }, []);

    const handleRhymeInsert = useCallback((rhyme: RhymeWord) => {
      const view = viewRef.current;
      if (!view) return;
      const pos = view.state.selection.main.head;
      const line = view.state.doc.lineAt(pos);
      const insertPos = line.to;
      view.dispatch({
        changes: { from: insertPos, insert: `\n${rhyme.word}` },
        selection: { anchor: insertPos + 1 + rhyme.word.length },
      });
      logger.debug("Editor", `rhyme inserted: "${rhyme.word}"`);
      setRhymeState(EMPTY_RHYME_STATE);
      onRhymeDismissRef.current?.();
      view.focus();
    }, []);

    const handleRhymeHover = useCallback((index: number) => {
      setRhymeState((s) => ({ ...s, index }));
    }, []);

    const dynamicCompartment = useRef(new Compartment());
    const placeholderCompartment = useRef(new Compartment());
    const tagHighlightCompartment = useRef(new Compartment());
    const autocloseCompartment = useRef(new Compartment());
    const cursorCompartment = useRef(new Compartment());

    useEffect(() => {
      if (!containerRef.current || viewRef.current) return;

      const rhymeKeymap: KeyBinding[] = [
        {
          key: "ArrowDown",
          run: () => {
            const s = rhymeStateRef.current;
            if (!s.visible) return false;
            setRhymeState((p) => ({ ...p, index: p.index + 1 }));
            return true;
          },
        },
        {
          key: "ArrowUp",
          run: () => {
            const s = rhymeStateRef.current;
            if (!s.visible) return false;
            setRhymeState((p) => ({ ...p, index: Math.max(0, p.index - 1) }));
            return true;
          },
        },
        {
          key: "Escape",
          run: () => {
            if (!rhymeStateRef.current.visible) return false;
            setRhymeState(EMPTY_RHYME_STATE);
            onRhymeDismissRef.current?.();
            return true;
          },
        },
        {
          key: "Enter",
          run: () => {
            const s = rhymeStateRef.current;
            if (!s.visible) return false;
            const idx = Math.min(s.index, (rhymesRef.current?.length ?? 0) - 1);
            if (rhymesRef.current && idx >= 0) {
              const r = rhymesRef.current[idx];
              copyToClipboard(r.word);
              onCopyWordRef.current?.(r.word);
            }
            setRhymeState(EMPTY_RHYME_STATE);
            onRhymeDismissRef.current?.();
            viewRef.current?.focus();
            return true;
          },
        },
      ];

      const externalKeymap: KeyBinding[] = [
        {
          key: "Ctrl-Shift-ArrowDown",
          run: () => {
            onKeyDownRef.current?.({
              ctrlKey: true,
              shiftKey: true,
              key: "ArrowDown",
              preventDefault: () => {},
            } as React.KeyboardEvent);
            return true;
          },
        },
        {
          key: "Ctrl-Shift-ArrowUp",
          run: () => {
            onKeyDownRef.current?.({
              ctrlKey: true,
              shiftKey: true,
              key: "ArrowUp",
              preventDefault: () => {},
            } as React.KeyboardEvent);
            return true;
          },
        },
      ];

      const baseExtensions: Extension[] = [
        songLanguage(),
        tagHighlightCompartment.current.of(tagHighlightPlugin(allTagsRef.current)),
        fluentTheme,
        fluentSyntax,
        drawSelection(),
        rectangularSelection(),
        crosshairCursor(),
        indentOnInput(),
        highlightSelectionMatches(),
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
          ...rhymeKeymap,
          ...externalKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          dblclick: (e, view) => {
            if ((e.target as HTMLElement).closest(".rhyme-popup")) return false;
            const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }, false);
            if (pos === null) return false;
            const line = view.state.doc.lineAt(pos);
            const offset = pos - line.from;
            const word = getCurrentWord(line.text, offset);
            if (!word) return false;
            const rect = view.coordsAtPos(pos);
            if (!rect) return false;
            setRhymeState({
              visible: true,
              pos: { top: rect.bottom + 4, left: rect.left },
              wordRange: { start: line.from + word.start, end: line.from + word.end },
              index: 0,
            });
            onRhymeRequestRef.current?.(word.word);
            return true;
          },
          mousedown: () => {
            if (rhymeStateRef.current.visible) {
              setRhymeState(EMPTY_RHYME_STATE);
              onRhymeDismissRef.current?.();
            }
            return false;
          },
        }),
      ];

      const dynamicExts: Extension[] = [];
      if (showLineNumbers) dynamicExts.push(lineNumbers());
      if (highlightCurrentLine)
        dynamicExts.push(highlightActiveLine(), highlightActiveLineGutter());
      if (wordWrap) dynamicExts.push(EditorView.lineWrapping);
      dynamicExts.push(tagAutocompleteExtension(customTags, lang as "ru" | "en"));
      dynamicExts.push(EditorState.tabSize.of(tabSize));
      dynamicExts.push(
        EditorView.editorAttributes.of({ spellcheck: spellCheck ? "true" : "false" }),
      );

      const autocloseExts: Extension[] = [];
      if (autocloseBrackets) {
        autocloseExts.push(closeBrackets());
        autocloseExts.push(keymap.of([...closeBracketsKeymap]));
      }

      const blinkMs = cursorBlinkRate > 0 ? cursorBlinkRate : 999999;
      const cursorStyleTheme = EditorView.theme({
        ".cm-cursor, .cm-dropCursor": {
          animation: cursorBlinkRate > 0 ? `blink ${blinkMs}ms step-end infinite` : "none",
          ...(cursorStyle === "block"
            ? { borderLeftWidth: "1em", borderLeftStyle: "solid", opacity: "0.7" }
            : cursorStyle === "underline"
              ? { borderLeftWidth: "1em", borderLeftStyle: "solid", opacity: "0.5" }
              : {}),
        },
      });
      const cursorExts: Extension[] = [cursorStyleTheme];

      const state = EditorState.create({
        doc: value,
        extensions: [
          ...baseExtensions,
          dynamicCompartment.current.of(dynamicExts),
          placeholderCompartment.current.of(cmPlaceholder(placeholder ?? "")),
          autocloseCompartment.current.of(autocloseExts),
          cursorCompartment.current.of(cursorExts),
        ],
      });

      const view = new EditorView({ state, parent: containerRef.current });
      view.dom.style.fontSize = `${fontSize}px`;
      view.dom.style.lineHeight = String(lineHeight);
      view.dom.style.fontFamily = `"${fontFamily}", sans-serif`;
      viewRef.current = view;
      logger.debug("Editor", "SongLyricsEditor initialized");

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, []);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const currentDoc = view.state.doc.toString();
      if (currentDoc !== value) {
        view.dispatch({ changes: { from: 0, to: currentDoc.length, insert: value } });
      }
    }, [value]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dom.style.fontSize = `${fontSize}px`;
      view.dom.style.lineHeight = String(lineHeight);
      view.dom.style.fontFamily = `"${fontFamily}", sans-serif`;
    }, [fontSize, lineHeight, fontFamily]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const dynamicExts: Extension[] = [];
      if (showLineNumbers) dynamicExts.push(lineNumbers());
      if (highlightCurrentLine)
        dynamicExts.push(highlightActiveLine(), highlightActiveLineGutter());
      if (wordWrap) dynamicExts.push(EditorView.lineWrapping);
      dynamicExts.push(tagAutocompleteExtension(customTags, lang as "ru" | "en"));
      dynamicExts.push(EditorState.tabSize.of(tabSize));
      dynamicExts.push(
        EditorView.editorAttributes.of({ spellcheck: spellCheck ? "true" : "false" }),
      );
      view.dispatch({
        effects: dynamicCompartment.current.reconfigure(dynamicExts),
      });

      const autocloseExts: Extension[] = [];
      if (autocloseBrackets) {
        autocloseExts.push(closeBrackets());
        autocloseExts.push(keymap.of([...closeBracketsKeymap]));
      }
      view.dispatch({
        effects: autocloseCompartment.current.reconfigure(autocloseExts),
      });
    }, [showLineNumbers, highlightCurrentLine, wordWrap, tabSize, spellCheck, customTags, lang, autocloseBrackets]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: tagHighlightCompartment.current.reconfigure(tagHighlightPlugin(allTags)),
      });
    }, [allTags]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: placeholderCompartment.current.reconfigure(cmPlaceholder(placeholder ?? "")),
      });
    }, [placeholder]);

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        const pos = view.state.selection.main.head;
        view.dispatch({
          changes: { from: pos, insert: text },
          selection: { anchor: pos + text.length },
        });
        view.focus();
      },
      scrollToLine: (lineIndex: number) => {
        const view = viewRef.current;
        if (!view) return;
        const doc = view.state.doc;
        const targetLine = doc.line(Math.min(lineIndex + 1, doc.lines));
        view.dispatch({
          selection: { anchor: targetLine.from },
          effects: EditorView.scrollIntoView(targetLine.from, { y: "start", yMargin: 50 }),
        });
        view.focus();
      },
      getCursorLine: () => {
        const view = viewRef.current;
        if (!view) return 0;
        return view.state.doc.lineAt(view.state.selection.main.head).number - 1;
      },
    }), []);

    return (
      <div style={{ position: "relative", height: "100%" }} className={className}>
        <div ref={containerRef} className="cm-song-editor" style={{ height: "100%", ...style }} />
        {rhymeState.visible && (
          <RhymePopup
            rhymes={rhymes ?? []}
            loading={rhymeLoading ?? false}
            error={rhymeError}
            activeIndex={rhymeState.index}
            position={rhymeState.pos}
            onSelect={handleRhymeSelect}
            onInsert={handleRhymeInsert}
            onHover={handleRhymeHover}
          />
        )}
      </div>
    );
  },
);
