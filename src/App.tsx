import React, { Suspense, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useAppStore } from "./hooks/useAppStore";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { SongList } from "./components/SongList";
import { SongEditor } from "./components/SongEditor";
import { ResizeHandle } from "./components/ResizeHandle";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/Toast";
import { ConfirmModal } from "./components/ConfirmModal";
import { RecoveryModal } from "./components/RecoveryModal";
import { LanguageContext, useTranslation } from "./i18n";
import { openSongWindow } from "./services/window";
import { useOpenWindows } from "./hooks/useOpenWindows";
import { AnimatedText, AnimatedTextProvider } from "./components/AnimatedText";
import { logger } from "./services/logger";

const SettingsModal = React.lazy(() =>
  import("./components/SettingsModal").then((m) => ({ default: m.SettingsModal })),
);
const DebugMenu = React.lazy(() =>
  import("./components/DebugMenu").then((m) => ({ default: m.DebugMenu })),
);

function ModalSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="modal-overlay" role="presentation">
          <div className="modal" style={{ padding: 24 }}>
            <div className="spinner" />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

import "./styles/theme.css";
import "./styles/base.css";
import "./styles/animations.css";
import "./styles/layout/app.css";
import "./styles/layout/titlebar.css";
import "./styles/navigation/sidebar.css";
import "./styles/songs/song-list.css";
import "./styles/editor/editor.css";
import "./styles/components/resize-handle.css";
import "./styles/components/modal.css";
import "./styles/components/context-menu.css";
import "./styles/components/toast.css";

const loadDeferredStyles = () => import("./styles/deferred").catch(() => {});
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(loadDeferredStyles);
} else {
  setTimeout(loadDeferredStyles, 0);
}

function AppInner() {
  const { t } = useTranslation();
  const store = useAppStore();
  const openWindowSongIds = useOpenWindows();

  useEffect(() => {
    logger.info("App", "AppInner mounted");
  }, []);

  useEffect(() => {
    if (store.songsReady && store.settingsReady) {
      logger.info("App", `ready: ${store.songs.length} songs, ${store.sortedCategories.length} categories`);
    }
  }, [store.songsReady, store.settingsReady, store.songs.length, store.sortedCategories.length]);

  const songsRef = useRef(store.songs);
  songsRef.current = store.songs;

  const cursorRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const handleDropToCategory = useCallback(
    (songIds: string[], categoryId: string) => {
      const alreadyIn = songIds.every((id) => {
        const s = songsRef.current.find((song) => song.id === id);
        return s && s.category === categoryId;
      });
      if (alreadyIn) {
        store.addToast(t("allSongsAlreadyInCategory"), "info");
        return;
      }
      store.updateSongsCategory(songIds, categoryId);
      store.addToast(t("songsMoved"), "success");
    },
    [store.updateSongsCategory, store.addToast, t],
  );

  const handleDndEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;
      const { source, target } = event.operation;
      if (!source) return;

      const songIds = (source as unknown as { data?: { songIds?: string[] } }).data?.songIds;

      if (!target) return;

      if (target.id === "open-new-window") {
        if (songIds?.length === 1) {
          const song = songsRef.current.find((s) => s.id === songIds[0]);
          if (song) openSongWindow(song.id, song.title || t("untitled"));
        }
        return;
      }

      if (songIds && songIds.length > 0) {
        const categoryId = String(target.id);
        handleDropToCategory(songIds, categoryId);
      }
    },
    [handleDropToCategory],
  );

  if (!store.songsReady || !store.settingsReady) {
    return (
      <div
        className={`app${store.settings.compactMode ? " app--compact" : ""}${store.isNarrow ? " app--narrow" : ""}`}
      >
        <TitleBar />
        <div className="app-loading">
          <div className="spinner" />
          <span style={{ marginLeft: 10 }}><AnimatedText translationKey="loading" /></span>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={store.settings.language}>
      <AnimatedTextProvider variant="mask-glow">
      <div
        className={`app${store.settings.compactMode ? " app--compact" : ""}${store.isNarrow ? " app--narrow" : ""}`}
      >
        <a href="#editor-area" className="skip-link">
          <AnimatedText translationKey="goToEditor" />
        </a>
        <div aria-live="polite" className="sr-only" ref={store.announceRef} />
        <TitleBar />
        <div className="app-body">
          <DragDropProvider onDragEnd={handleDndEnd}>
          <ErrorBoundary>
            <Sidebar
              collapsed={store.sidebarCollapsed}
              onToggleCollapse={() => store.setSidebarCollapsed((v) => !v)}
              activeCategory={store.activeCategory}
              onCategoryChange={store.handleCategoryChange}
              onAddSong={store.handleAddSong}
              onAddCategory={store.handleAddCategory}
              onRenameCategory={store.handleRenameCategory}
              onDeleteCategory={store.handleDeleteCategory}
              onUpdateCategoryIcon={store.updateCategoryIcon}
              onOpenSettings={() => store.setSettingsOpen(true)}
              onOpenDebug={() => store.setDebugOpen(true)}
              categories={store.sortedCategories}
              counts={store.counts}
              songsTotal={store.songs.length}
              sidebarFontSize={store.settings.sidebarFontSize}
            />
          </ErrorBoundary>
          {!store.sidebarCollapsed && <ResizeHandle onResize={store.handleSidebarResize} />}
          <ErrorBoundary>
            <SongList
              songs={store.filteredByCategory}
              activeId={store.activeId}
              exitingId={store.exitingSongId}
              onSelect={store.setActiveId}
              onTogglePin={store.togglePin}
              onRequestDelete={store.handleRequestDelete}
              selectedIds={store.selectedIds}
              onToggleSelect={store.toggleSelect}
              onSelectAll={store.selectAll}
              onDeselectAll={store.deselectAll}
              onRequestDeleteSelected={store.handleRequestDeleteSelected}
              onDuplicate={store.handleDuplicateSong}
              onRename={store.handleRenameSong}
              onMoveToCategory={store.handleMoveToCategory}
              categories={store.sortedCategories}
              exportFormat={store.settings.exportFormat}
              addToast={store.addToast}
              openWindowSongIds={openWindowSongIds}
            />
          </ErrorBoundary>
          <ResizeHandle onResize={store.handleSongListResize} />
          <div id="editor-area" tabIndex={-1}>
            <ErrorBoundary>
              <SongEditor
                song={store.activeSong}
                onUpdate={store.handleUpdate}
                categories={store.sortedCategories}
                editorFontSize={store.settings.editorFontSize}
                lineHeight={store.settings.lineHeight}
                fontFamily={store.settings.fontFamily}
                spellCheck={store.settings.spellCheck}
                wordWrap={store.settings.wordWrap}
                showWordCount={store.settings.showWordCount}
                customTags={store.settings.customTags}
                tabSize={store.settings.tabSize}
                showLineNumbers={store.settings.showLineNumbers}
                highlightCurrentLine={store.settings.highlightCurrentLine}
                autocloseBrackets={store.settings.autocloseBrackets}
                cursorStyle={store.settings.cursorStyle}
                cursorBlinkRate={store.settings.cursorBlinkRate}
                showSectionOutline={store.settings.showSectionOutline}
                exportFormat={store.settings.exportFormat}
                rhymeLang={store.settings.rhymeLang}
                rhymeDepth={store.settings.rhymeDepth}
                maxRhymeResults={store.settings.maxRhymeResults}
                addToast={store.addToast}
              />
            </ErrorBoundary>
          </div>
          </DragDropProvider>
        </div>
        {createPortal(
          <ModalSuspense>
            <ErrorBoundary>
              <SettingsModal
                open={store.settingsOpen}
                settings={store.settings}
                onUpdate={store.updateSettings}
                onExportDb={store.handleExportDb}
                onImportDb={store.handleImportDb}
                onClearDb={store.handleClearDb}
                dbStats={store.dbStats}
                backups={store.backups}
                onRefreshBackups={store.refreshBackups}
                onRestoreBackup={store.handleRestoreBackup}
                onDeleteBackup={store.handleDeleteBackup}
                onClose={() => store.setSettingsOpen(false)}
              />
            </ErrorBoundary>
          </ModalSuspense>,
          document.body,
        )}

        {createPortal(
          <ModalSuspense>
            <ErrorBoundary>
              <ConfirmModal
                open={!!store.deletingId}
                title={t("deleteSong?")}
                message={
                  store.deletingSong
                    ? `\u00AB${store.deletingSong.title || t("untitled")}\u00BB ${t("willBeDeletedForever")}`
                    : ""
                }
                confirmLabel={t("delete")}
                onConfirm={store.handleConfirmDelete}
                onCancel={() => store.setDeletingId(null)}
              />
            </ErrorBoundary>
          </ModalSuspense>,
          document.body,
        )}

        {createPortal(
          <ModalSuspense>
            <ErrorBoundary>
              <ConfirmModal
                open={!!store.deletingSelectedIds}
                title={t("deleteSongs?")}
                message={
                  store.deletingSelectedIds
                    ? t("deleteSongsMsg").replace(
                        "{count}",
                        String(store.deletingSelectedIds.length),
                      )
                    : ""
                }
                danger
                confirmLabel={t("delete")}
                onConfirm={() => store.handleConfirmDeleteSelected(store.deletingSelectedIds!)}
                onCancel={() => store.setDeletingSelectedIds(null)}
              />
            </ErrorBoundary>
          </ModalSuspense>,
          document.body,
        )}

        <ToastContainer toasts={store.toasts} onRemove={store.removeToast} />

        {createPortal(
          <RecoveryModal
            open={!!store.recoveryInfo?.was_recovered}
            backups={store.recoveryInfo?.backups ?? []}
            onDismissed={store.dismissRecovery}
          />,
          document.body,
        )}

        {createPortal(
          <ModalSuspense>
            <ErrorBoundary
              key={String(store.debugOpen)}
              fallback={
                <div
                  className="modal-overlay"
                  onClick={() => store.setDebugOpen(false)}
                  role="presentation"
                >
                  <div
                    className="modal debug-modal"
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="debug-header">
                      <h2 className="modal-title"><AnimatedText translationKey="errSomethingWrong" /></h2>
                      <button
                        className="modal-btn modal-btn-cancel"
                        type="button"
                        onClick={() => store.setDebugOpen(false)}
                      >
                        <AnimatedText translationKey="close" />
                      </button>
                    </div>
                    <div className="debug-content">
                      <p style={{ opacity: 0.7 }}>
                        <AnimatedText translationKey="errDebugBoundary" />
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <DebugMenu
                open={store.debugOpen}
                onClose={() => store.setDebugOpen(false)}
                settings={store.settings}
                songs={store.songs}
                categories={store.sortedCategories}
              />
            </ErrorBoundary>
          </ModalSuspense>,
          document.body,
        )}
      </div>
      </AnimatedTextProvider>
    </LanguageContext.Provider>
  );
}

/** Корневой компонент приложения: рендерит все модалы, порталы, sidebar, song list, editor, i18n. */
export default function App() {
  return <AppInner />;
}
