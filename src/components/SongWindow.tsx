import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Song } from "@/types/song";
import { TitleBar } from "./TitleBar";
import { SongEditor } from "./SongEditor";
import { ErrorBoundary } from "./ErrorBoundary";
import { ToastContainer } from "./Toast";
import { useSettings } from "@/hooks/useSettings";
import { useSongs } from "@/hooks/useSongs";
import { useMicaThemeSync } from "@/hooks/useMicaEffect";
import { useThemeEffects } from "@/hooks/store/useThemeEffects";
import { useToasts } from "@/hooks/store/useToasts";
import { LanguageContext, getTranslation } from "@/i18n";
import { AnimatedText, AnimatedTextProvider } from "./AnimatedText";

import "@/styles/theme.css";
import "@/styles/base.css";
import "@/styles/animations.css";
import "@/styles/layout/app.css";
import "@/styles/layout/titlebar.css";
import "@/styles/editor/editor.css";
import "@/styles/components/toast.css";
import "@/styles/components/dropdown.css";
import "@/styles/components/context-menu.css";
import "@/styles/components/modal.css";

export function SongWindow({ songId }: { songId: string }) {
  const { settings, settingsReady } = useSettings();
  useMicaThemeSync(settings.theme);
  useThemeEffects(settings);

  const { songs, categories, ready: songsReady, updateSong } = useSongs();
  const { toasts, addToast, removeToast } = useToasts(settings);

  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    if (songsReady) {
      setSong(songs.find((s) => s.id === songId) ?? null);
    }
  }, [songs, songsReady, songId]);

  useEffect(() => {
    const win = getCurrentWindow();
    const title = song?.title || getTranslation(settings.language, "untitled");
    void win.setTitle(title);
  }, [song?.title, settings.language]);

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<Omit<Song, "id" | "createdAt">>) => {
      updateSong(id, patch);
    },
    [updateSong],
  );

  const sortedCategories = categories;

  if (!songsReady || !settingsReady) {
    return (
      <div className="app">
        <TitleBar title={song?.title} />
        <div className="app-loading">
          <div className="spinner" />
          <span style={{ marginLeft: 10 }}><AnimatedText translationKey="loading" /></span>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={settings.language}>
      <AnimatedTextProvider variant="mask-glow">
      <div className={`app${settings.compactMode ? " app--compact" : ""}`}>
        <TitleBar title={song?.title} />
        <div className="app-body">
          <div id="editor-area" tabIndex={-1} style={{ flex: 1 }}>
            <ErrorBoundary>
              {song ? (
                <SongEditor
                  song={song}
                  onUpdate={handleUpdate}
                  categories={sortedCategories}
                  editorFontSize={settings.editorFontSize}
                  lineHeight={settings.lineHeight}
                  fontFamily={settings.fontFamily}
                  spellCheck={settings.spellCheck}
                  wordWrap={settings.wordWrap}
                  showWordCount={settings.showWordCount}
                  customTags={settings.customTags}
                  tabSize={settings.tabSize}
                  showLineNumbers={settings.showLineNumbers}
                  highlightCurrentLine={settings.highlightCurrentLine}
                  autocloseBrackets={settings.autocloseBrackets}
                  cursorStyle={settings.cursorStyle}
                  cursorBlinkRate={settings.cursorBlinkRate}
                  showSectionOutline={settings.showSectionOutline}
                  exportFormat={settings.exportFormat}
                  rhymeLang={settings.rhymeLang}
                  rhymeDepth={settings.rhymeDepth}
                  maxRhymeResults={settings.maxRhymeResults}
                  addToast={addToast}
                />
              ) : (
                <div className="song-list-empty"><AnimatedText translationKey="noEntries" /></div>
              )}
            </ErrorBoundary>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
      </AnimatedTextProvider>
    </LanguageContext.Provider>
  );
}
