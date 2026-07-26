# LyriXX — songwriting notebook

Tauri 2.11.5 + React 19.2.7 + TypeScript 7.0.2 + Vite 8.1.5. Fluent Design / WinUI 3 CSS. SQLite (rusqlite 0.31).

## Commands

| Command                                   | Description                                |
| ----------------------------------------- | ------------------------------------------ |
| `npm run dev` / `npm run dev:web`         | Vite dev server (localhost:1420, no Tauri) |
| `npm run build`                           | `tsc && vite build`                        |
| `npm run tauri dev`                       | Full Tauri dev (front + Rust)              |
| `npm run tauri build`                     | Bundle (.msi/.exe)                         |
| `npm run typecheck` / `npm run lint`      | `tsc --noEmit`                             |
| `npm run lint:eslint`                     | ESLint (`src/**/*.{ts,tsx}`)               |
| `npm run format` / `npm run format:check` | Prettier                                   |
| `npm run test` / `npm run test:watch`     | vitest                                     |
| `npm run prepare`                         | simple-git-hooks (postinstall)             |

Project root: `lyrixx/`. For full dev docs see `docs/CONTRIBUTING.md`.

## Key files

### Components

- `src/components/TypewriterInput.tsx` — custom textarea, tag highlighting, autocomplete, rhyme popup
- `src/components/SongEditor.tsx` — main editor: title/artist/category + lyrics + SectionOutline + rhymes
- `src/components/Sidebar.tsx` — category sidebar: CRUD, context menu, portal menus
- `src/components/SongList.tsx` — song list: search, debounce, pin/delete context menu
- `src/components/SectionOutline.tsx` — drag-and-drop section navigator
- `src/components/SettingsModal.tsx` — 6-tab settings modal: editor/interface/behavior/rhymes/tags/database
- `src/components/ConfirmModal.tsx` — generic confirm dialog, danger mode, focus trap
- `src/components/ContextMenu.tsx` — portal-based right-click menu, keyboard nav
- `src/components/TitleBar.tsx` — custom titlebar, Tauri drag region
- `src/components/Toast.tsx` — toast notifications, error/success/info
- `src/components/ErrorBoundary.tsx` — class error boundary
- `src/components/TagAutocomplete.tsx` — tag autocomplete popup
- `src/components/IconPicker.tsx` — category icon grid picker
- `src/components/WinDropdown.tsx` — WinUI-styled dropdown
- `src/components/RhymePopup.tsx` — rhyme suggestions, score bars
- `src/components/ResizeHandle.tsx` — draggable column resize handle
- `src/components/DebugMenu.tsx` — debug panel: backend logs, SQL queries, DB stats
- `src/components/Icons.tsx` — SVG icon components
- `src/components/settings/` — 7 files: UISection, EditorSection, BehaviorSection, RhymesSection, CustomTagsSection, DatabaseSection, shared

### Hooks

- `src/hooks/useSongs.ts` — CRUD songs/categories, autosave debounce
- `src/hooks/useSettings.ts` — load/save AppSettings
- `src/hooks/useRhymes.ts` — fetch rhymes via Tauri `get_rhymes`
- `src/hooks/useKeyboardShortcuts.ts` — Ctrl+N/F/Del
- `src/hooks/useMicaEffect.ts` — Windows 11 Mica effect
- `src/hooks/useDebounce.ts` — generic debounce

### Types

- `src/types/songTags.ts` — **14 built-in tags** + custom tags, parsing, autocomplete
- `src/types/settings.ts` — AppSettings (20 fields), DEFAULT_SETTINGS
- `src/types/song.ts` — Song, SongListItem interfaces
- `src/types/category.ts` — CustomCategory, ALL_CATEGORY
- `src/types/icons.tsx` — 20+ category icons as SVG JSX

### i18n

- `src/i18n/translations.ts` — ru/en dictionaries (~120 keys), getTagLabel
- `src/i18n/index.ts` — LanguageContext, useTranslation() hook

### Services

- `src/services/storage.ts` — SongsDb interface + TauriDbService
- `src/services/logger.ts` — debug/info/warn/error
- `src/services/window.ts` — WindowAPI singleton: minimize/toggleMaximize/close

### Utils

- `src/utils/charUtils.ts` — computeCharIds, getCurrentWord for typewriter animation
- `src/utils/id.ts` — generateId (timestamp + random)
- `src/constants.ts` — font sizes, animation durations, popup dimensions, rhyme thresholds

### App

- `src/App.tsx` — main app: all hooks, modals, portals, i18n, ErrorBoundary

### Rust (src-tauri/src/)

- `src-tauri/src/db.rs` — SQLite (rusqlite 0.31, bundled), migrations (LATEST_VERSION=1), **15 Tauri commands**: load_songs, save_song, delete_song, load_categories, save_category, delete_category, load_setting, save_setting, get_db_path_str, copy_file, clear_all_data, list_backups, delete_backup, restore_backup, get_db_file_info
- `src-tauri/src/rhyme.rs` — RhymeEngine (quickpoeter: Zaliznyak + word2vec), get_rhymes, MAX_RHYME_RESULTS=50
- `src-tauri/src/fonts.rs` — get_system_fonts: Windows registry font enumeration
- `src-tauri/src/mica.rs` — Windows 11 Mica/Acrylic effect setup
- `src-tauri/src/lib.rs` — Tauri Builder, 21 command handlers, splash→main transition, tracing/logging
- `src-tauri/src/main.rs` — entry point
- `src-tauri/quickpoeter/` — vendored quickpoeter crate (Zaliznyak + word2vec rhyme engine)

### CSS (15+ files)

`styles/`: theme.css (light+dark), base.css, animations.css. `styles/layout/`: app.css, titlebar.css. `styles/navigation/`: sidebar.css. `styles/songs/`: song-list.css. `styles/editor/`: editor.css. `styles/components/`: modal.css, settings.css, toast.css, accessibility.css, icon-picker.css, context-menu.css, dropdown.css, debug-menu.css, resize-handle.css.

## Tests (7 files)

`useSongs.test.ts`, `useDebounce.test.ts`, `id.test.ts`, `charUtils.test.ts`, `TagAutocomplete.test.tsx`, `RhymePopup.test.tsx`, `SettingsModal.test.tsx`. Run: `npm run test`.

## Pre-commit

simple-git-hooks + lint-staged: `*.{ts,tsx}` → prettier + tsc, `*.{json,css,md}` → prettier.
