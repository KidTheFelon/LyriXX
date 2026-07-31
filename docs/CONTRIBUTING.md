# LyriXX — руководство для разработчиков

## Vision: почему существует LyriXX

### Проблема

Существующие инструменты для написания песен раздражают:

1. **Нет структуры.** Блокнот/Google Docs — сплошной текст. Нет понятия «куплет», «припев», «бридж». Теряешься в длинных текстах.
2. **Нет единого инструмента.** Рифмовщик — в одном сервисе, текстовый редактор — в другом, структура песни — в третьем. Постоянные переключения.
3. **Нет удобного хранилища.** Песни разбросаны по папкам, файлам, заметкам. Поиск превращается в ад.
4. **Рифмовка оторвана от процесса.** Чтобы подобрать рифму — уходишь на сайт, копируешь, вставляешь. Потеря флоу.
5. **Уродливые интерфейсы.** Специализированные songwriter-тулзы выглядят как из 2005 года.

### Решение

LyriXX — **одно приложение**, где живёт весь процесс написания песни:

- **Структура** — Section Outline с drag-and-drop: куплет, припев, бридж — видишь и управляешь.
- **Рифмы на лету** — Quickpoeter (Зализняк + word2vec) для русского, **RhymeBrain** для английского. Встроены в редактор, работают без выхода из приложения.
- **Единое хранилище** — SQLite, все песни в одной БД. Поиск, категории, пин.
- **Гладкий внешний вид** — Fluent Design стили, прозрачность, системный трей. Приложение выглядит ухоженно и современно.

### Философия

| Принцип | Что значит |
| --- | --- |
| **Минимализм** | Ничего лишнего. Фокус на тексте песни, не на UI-шуме. |
| **Скорость** | Мгновенный отклик. Tauri + SQLite — никакого lag. |
| **Локальность** | Данные не покидают машину. Пока не рассматривались варианты доступнее, чем хранение локально. |
| **Анимации и эстетика** | Музыканты должны **кайфовать** от пользования инструментом. Анимации — не декор, а часть опыта. Приложение пока не даёт полного спектра ощущений, но уже чувствуются зачатки того, что хотелось бы увидеть. |
| **Портабельность** | Программа должна легко переноситься. Размер — не главный приоритет, но остаётся важным для удобства переноса. |
| **Безопасность данных** | Локальное хранение как гарантия: никаких утечек, никакой зависимости от серверов. |

### Стек и почему

- **Tauri 2** — лёгкий, быстрый, нативный. Размер и производительность важны.
- **SQLite (rusqlite)** — встроенная БД, zero-config, данные в одном файле рядом с exe.
- **React + TypeScript** — быстрый UI, типизация, проверено.
- **Quickpoeter** — vendored Rust-движок рифм (Зализняк + word2vec). Работает локально, без API. **Русский**.
- **RhymeBrain** — движок рифм для **английского**.

### Ключевые фичи (чем отличаемся)

1. **Встроенные рифмы** — не внешний сервис, а часть редактора. Двуязычные (RU через Quickpoeter, EN через RhymeBrain).
2. **Section Outline** — drag-and-drop навигация по секциям песни.
3. **Всё вместе** — интеграция, а не набор разрозненных тулзов.

### Аудитория

Все, кто пишет песни. Не профессионалы vs хобби — просто люди, которым нужен удобный инструмент.

### Дорожная карта (будущее)

- **Резервное копирование в облако** — если появится возможность, попробуем добавить облачные бэкапы для сохранности данных.

### Цель

- **Сейчас** — просто хорошая тулза. Делать одну вещь хорошо.
- **Долгосрочно** — open-source сообщество songwriter-разработчиков. Windows приоритет, кроссплатформенность — возможно.

---

## Стек

| Слой          | Технология                                                                |
| ------------- | ------------------------------------------------------------------------- |
| Фронтенд      | React 19.2.7 + TypeScript 7.0.2 + Vite 8.1.5                              |
| Бэкенд        | Tauri 2.11.5 + Rust (rusqlite 0.31, quickpoeter, reqwest, tracing, serde) |
| Редактор      | CodeMirror 6 (autocomplete, language, state, view)                        |
| Стили         | Fluent Design / WinUI 3 CSS custom properties (~3700 строк, 17 файлов)    |
| Тема          | `data-theme` на `<html>` (system / light / dark)                          |
| Тайтлбар      | кастомный (`decorations: false`, `transparent: true`)                     |
| Анимации      | framer-motion 12                                                          |
| Плагины Tauri | `tauri-plugin-opener`, `tauri-plugin-dialog`, `tray-icon`                 |
| Windows       | window-vibrancy (Mica/Acrylic), winreg, windows crate                     |

## Быстрый старт

```bash
npm install
npm run dev:web       # UI только (без Tauri, http://localhost:1420)
# или
npm run tauri dev     # полный Tauri (требуется Rust toolchain + quickpoeter)
```

## Команды

| Команда                | Описание                                    |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Vite dev server (localhost:5173)            |
| `npm run dev:web`      | Vite dev server (localhost:1420, без Tauri) |
| `npm run build`        | `tsc && vite build`                         |
| `npm run preview`      | Vite preview                                |
| `npm run tauri`        | Tauri CLI                                   |
| `npm run tauri dev`    | Полный Tauri dev (фронт + Rust)             |
| `npm run tauri build`  | Tauri bundle (.msi/.exe)                    |
| `npm run typecheck`    | `tsc --noEmit`                              |
| `npm run lint`         | алиас для typecheck                         |
| `npm run format`       | Prettier (запись)                           |
| `npm run format:check` | Prettier (проверка)                         |
| `npm run test`         | `vitest run`                                |
| `npm run test:watch`   | `vitest` (watch mode)                       |
| `npm run prepare`      | `simple-git-hooks` (postinstall)            |

## Структура проекта

```
├── src/                          # Фронтенд (React + TS)
│   ├── components/               #    20 UI-компонентов + settings/ (10 файлов)
│   │   ├── SongList.tsx          #      список песен (поиск, pin, удаление)
│   │   ├── SongEditor.tsx        #      редактор песни (поля, текст, категория)
│   │   ├── TypewriterInput.tsx   #      textarea с подсветкой тегов, автодополнением и попапом рифм
│   │   ├── SectionOutline.tsx    #      навигатор секций (drag-and-drop, framer-motion)
│   │   ├── Sidebar.tsx           #      боковая панель (категории, создание, настройки)
│   │   ├── TitleBar.tsx          #      кастомный тайтлбар (—□×)
│   │   ├── SettingsModal.tsx     #      настройки (ленивая загрузка, 9 секций)
│   │   ├── ConfirmModal.tsx      #      confirm-диалог (danger mode, focus trap)
│   │   ├── ContextMenu.tsx       #      контекстное меню (portal, keyboard nav)
│   │   ├── Toast.tsx             #      тост-уведомления (error/success/info)
│   │   ├── ErrorBoundary.tsx     #      class component Error Boundary
│   │   ├── WinDropdown.tsx       #      WinUI-стилизованный select
│   │   ├── IconPicker.tsx        #      выбор иконки категории
│   │   ├── TagAutocomplete.tsx   #      popup автодополнения тегов
│   │   ├── RhymePopup.tsx        #      popup рифм (score bars, doubled view)
│   │   ├── ResizeHandle.tsx      #      drag-хэндл ресайза колонок
│   │   ├── DebugMenu.tsx         #      дебаг-панель (логи бэкенда, SQL, статистика БД)
│   │   ├── MusicQuotes.tsx       #      случайные музыкальные цитаты
│   │   ├── RecoveryModal.tsx     #      модалка восстановления БД
│   │   └── Icons.tsx             #      SVG-иконки как React-компоненты
│   ├── components/settings/      #   10 файлов
│   │   ├── UISection.tsx         #      тема, акцент, язык, sidebar, анимации, прозрачность
│   │   ├── EditorSection.tsx     #      шрифт, размер, курсор, автозакрытие, перенос
│   │   ├── BehaviorSection.tsx   #      автосохранение, шаблон, сортировка, трей, экспорт
│   │   ├── RhymesSection.tsx     #      язык, глубина, макс. результатов рифм
│   │   ├── CustomTagsSection.tsx #      пользовательские теги
│   │   ├── DatabaseSection.tsx   #      бэкапы, очистка, экспорт
│   │   ├── AccessibilitySection.tsx #   доступность (reduced motion, high contrast)
│   │   ├── NotificationsSection.tsx #   toast-уведомления
│   │   ├── ShortcutsSection.tsx  #      горячие клавиши
│   │   └── shared.tsx            #      общие компоненты секций
│   ├── editor/                   #    логика редактора (CodeMirror + подсветка)
│   │   ├── SongLyricsEditor.tsx  #      CodeMirror-обёртка для текста песни
│   │   ├── fluentTheme.ts        #      тема CodeMirror в стиле Fluent Design
│   │   ├── tagHighlight.ts       #      подсветка тегов секций
│   │   ├── tagCompletion.ts      #      автодополнение тегов
│   │   └── songLanguage.ts       #      язык/синтаксис для CodeMirror
│   ├── hooks/
│   │   ├── useAppStore.ts        #      глобальное состояние (zustand-like)
│   │   ├── useSongs.ts           #      CRUD песен/категорий, автосохранение
│   │   ├── useSettings.ts        #      настройки (тема, шрифт, теги)
│   │   ├── useRhymes.ts          #      запрос рифм через Tauri (debounce 100ms)
│   │   ├── useMicaEffect.ts      #      Windows Mica-эффект
│   │   ├── useDebounce.ts        #      generic debounce hook
│   │   └── useKeyboardShortcuts.ts  #   Ctrl+N/F/Del
│   ├── services/
│   │   ├── storage.ts            #      SongsDb interface + TauriDbService (invoke → Rust)
│   │   ├── logger.ts             #      уровни debug/info/warn/error, фильтр DEV
│   │   ├── window.ts             #      getWindowAPI() singleton + fallback
│   │   └── clipboard.ts          #      обёртка над Tauri clipboard API
│   ├── i18n/
│   │   ├── translations.ts       #      ru/en словари (~160 ключей), getTagLabel
│   │   └── index.ts              #      LanguageContext, useTranslation() hook
│   ├── types/
│   │   ├── song.ts               #      интерфейс Song, SongListItem
│   │   ├── category.ts           #      интерфейс CustomCategory, ALL_CATEGORY
│   │   ├── settings.ts           #      AppSettings (44 поля), DEFAULT_SETTINGS
│   │   ├── songTags.ts           #      14 стандартных тегов, парсинг, автодополнение
│   │   └── icons.tsx             #      20+ SVG иконок категорий
│   ├── utils/
│   │   ├── id.ts                 #      generateId()
│   │   └── charUtils.ts          #      computeCharIds, getCurrentWord
│   ├── constants.ts              #      размеры шрифтов, таймауты, пороги
│   ├── styles/
│   │   ├── theme.css             #      CSS-переменные, светлая/тёмная темы
│   │   ├── base.css              #      reset, body, scrollbar, typewriter-native
│   │   ├── animations.css        #      @keyframes анимации
│   │   ├── deferred.ts           #      отложенная загрузка стилей
│   │   ├── layout/               #      app.css, titlebar.css
│   │   ├── navigation/           #      sidebar.css
│   │   ├── songs/                #      song-list.css
│   │   ├── editor/               #      editor.css (рифмы, секции, теги)
│   │   └── components/           #      modal, settings, toast, context-menu,
│   │                              #      dropdown, icon-picker, debug-menu,
│   │                              #      resize-handle, accessibility (9 файлов)
│   └── App.tsx                   #      главный layout, хуки, порталы, ErrorBoundary
├── src-tauri/                    # Бэкенд (Rust / Tauri 2)
│   ├── src/
│   │   ├── main.rs               #      точка входа, windows_subsystem
│   │   ├── lib.rs                #      Tauri Builder, системный трей, splash→main,
│   │   │                         #      tracing/logging, 5 команд (mica, логи, трей)
│   │   ├── db.rs                 #      SQLite (rusqlite 0.31 bundled), миграции,
│   │   │                         #      18 команд (CRUD, бэкапы, очистка, восстановление)
│   │   ├── rhyme.rs              #      RhymeEngine (quickpoeter: Zaliznyak + word2vec)
│   │   ├── english_rhyme.rs      #      английские рифмы (reqwest API)
│   │   ├── lang_detect.rs        #      определение языка текста
│   │   ├── fonts.rs              #      get_system_fonts (Win registry)
│   │   └── mica.rs               #      Windows 11 Mica/Acrylic эффект
│   ├── quickpoeter/              #      vendored quickpoeter crate
│   ├── capabilities/
│   │   └── default.json          #      разрешения (window, dialog, opener)
│   └── icons/
├── public/
├── vite.config.ts                #      @/ алиас
├── vitest.config.ts
├── tsconfig.json                 #      strict, @/*, noUnusedLocals/Parameters
├── .prettierrc                   #      semi, no singleQuote, printWidth 100, LF
└── package.json
```

## Коммит-конвенции

Формат: `тип: описание на русском (прошедшее время)`

### Типы коммитов

| Тег | Когда использовать | Пример |
| --- | --- | --- |
| `feat` | Новая фича | `feat: добавил смену акцентного цвета` |
| `fix` | Исправление бага в поведении | `fix: убрал несуществующий проп из RhymePopup` |
| `build` | Компиляция, зависимости, предупреждения компилятора | `build: исправил предупреждения компилятора в Rust` |
| `refactor` | Изменение кода без изменения поведения | `refactor: вынес логику в отдельный модуль` |
| `test` | Добавление/изменение тестов | `test: добавил тесты для рифмовки` |
| `docs` | Документация | `docs: обновил CONTRIBUTING.md` |
| `style` | Форматирование, пробелы, точки с запятой (не влияет на логику) | `style: отформатировал db.rs` |
| `perf` | Оптимизация производительности | `perf: кешировал результат рифмовки` |
| `ci` | CI/CD, GitHub Actions, release-please, workflow-файлы | `ci: добавил workflow_dispatch` |
| `chore` | Прочее без изменений в коде (обновление зависимостей, манифестов) | `chore: обновил release-please манифест` |
| `revert` | Откат предыдущего коммита | `revert: откатил изменение шрифтов` |

### Границы между похожими тегами

| Ситуация | Тег | Почему |
| --- | --- | --- |
| Исправлен warning компилятора Rust/TS | `build:` | Проблема в сборке, не в логике |
| Исправлен CI workflow файл | `ci:` | Это конфигурация CI, даже если это «баг» |
| Исправлен баг в UI/логике приложения | `fix:` | Меняется поведение для пользователя |
| Удалён мёртвый код, вынесена функция | `refactor:` | Код изменился, поведение — нет |
| Обновлены npm/cargo зависимости | `chore:` | Не влияет на код |
| Исправлены отступы, форматирование | `style:` | Не влияет на логику |

### Правила

- Описание — на **русском** языке, в **прошедшем времени**
- Одно изменение — один коммит. Если в patch попадают разные вещи — разделять
- Не начинать описание с заглавной буквы после двоеточия
- Если нужен scope — `fix(editor): ...`, `fix(db): ...`, `ci(release): ...`

## Конвенции именования

| Категория  | Формат                   | Пример                                |
| ---------- | ------------------------ | ------------------------------------- |
| Компоненты | PascalCase, named export | `SongList`, `TitleBar`                |
| Хуки       | camelCase, `use`-prefix  | `useSongs`, `useRhymes`               |
| Сервисы    | camelCase                | `storage`, `logger`                   |
| Типы       | camelCase                | `song`, `category`, `songTags`        |
| Пропсы     | `{Name}Props`            | `SongListProps`                       |
| Алиас      | `@/` → `./src/*`         | `import { Song } from "@/types/song"` |

## Паттерны

- **Состояние:** `useAppStore` (hook-based store) + `useState` / `useCallback`
- **Слой данных:** `SongsDb` (TS-интерфейс) → `TauriDbService` (invoke в Rust)
- **Редактор текста:** CodeMirror 6 (`SongLyricsEditor.tsx`) с Fluent-темой, подсветкой тегов, автодополнением
- **Автосохранение:** debounce (настраивается, по умолчанию 300ms)
- **Логгирование:** `logger` с уровнями, фильтр `isDEV`, ротация по дням
- **Window API:** `getWindowAPI()` singleton, fallback для не-Tauri среды
- **Ошибки:** `ErrorBoundary` оборачивает Sidebar/SongList/SongEditor, try/catch + logger
- **Доступность:** ARIA, skip-link, sr-only, focus-lock в модалках
- **Темы:** CSS-токены через `data-theme`, системная по умолчанию
- **Pre-commit:** `lint-staged` + `simple-git-hooks` (Prettier + tsc)
- **Анимации:** framer-motion (SectionOutline, TypewriterInput, Toast, Modals)
- **Теги песен:** `[Куплет]`, `[Припев]`, `[Бридж]` и т.д. — парсятся из текста, подсвечиваются цветом
- **Рифмы:** quickpoeter (Zaliznyak + word2vec) → `RhymeEngine` в Rust → `useRhymes` hook → попап в TypewriterInput
- **i18n:** LanguageContext + useTranslation(), ru/en словари (~160 ключей)
- **Системный трей:** `minimizeToTray` — сворачивание в трей при закрытии

## База данных

SQLite (rusqlite, bundled), файл `{exe_dir}/data/lyrixx.db` (создаётся автоматически).

### Загрузка

`init()` → `get_db_path()` → `Connection::open()` → `migrate()` → `DbState { db: Mutex<Connection> }`

### Миграции

Через `PRAGMA user_version` в `db.rs::migrate()`.

- `LATEST_VERSION: i32 = 1`
- v0→v1: `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE songs ADD COLUMN pinned`
- Новая миграция: увеличить `LATEST_VERSION`, дописать `if current < N { ... pragma_update }`
- Проверка: `cd src-tauri && cargo check`

### Tauri-команды (25 шт.)

**db.rs (18):** `load_songs`, `save_song`, `delete_song`, `delete_songs`, `load_categories`, `save_category`, `delete_category`, `load_setting`, `save_setting`, `get_db_path_str`, `copy_file`, `write_text_file`, `list_backups`, `delete_backup`, `restore_backup`, `check_db_recovery`, `clear_all_data`, `get_db_file_info`

**lib.rs (5):** `set_mica_theme`, `write_frontend_log`, `get_backend_logs`, `get_sql_queries`, `toggle_minimize_to_tray`

**rhyme.rs (1):** `get_rhymes`

**fonts.rs (1):** `get_system_fonts`

### Структуры

- `SongRecord`: id, title, artist, lyrics, category, pinned, created_at, updated_at
- `CategoryRecord`: id, label, icon
- `RhymeWord`: word, score, syllables
- `BackupInfo`: filename, created_at, size_bytes
- `RecoveryInfo`: needs_recovery, backup_count
- `DbFileInfo`: path, size_bytes, modified_at
- `SqlQueryEntry`: time, command, sql, duration_ms, success, error

### RhymeEngine

Загружает словарь рифм (Zaliznyak + word2vec) при старте через `quickpoeter`.
`get_rhymes(word, lang)` → `string2word()` → `FindingInfo::new()` → `wc.find_best()` → `Vec<RhymeWord>`.
Управляемое состояние Tauri: `RhymeEngine { inner: Mutex<(WordCollector, GeneralSettings)> }`.

### Дополнительные модули

- `english_rhyme.rs` — поиск английских рифм через внешний API (reqwest)
- `lang_detect.rs` — определение языка текста (RU/EN)
- `fonts.rs` — перечисление системных шрифтов через Win Registry
- `mica.rs` — Windows 11 Mica/Acrylic эффект (window-vibrancy)

## Стили

CSS разбит на 17 файлов по папкам:

| Папка         | Файлы                                                                                                 | Назначение                    |
| ------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------- |
| `styles/`     | theme.css, base.css, animations.css                                                                   | Переменные, reset, анимации   |
| `styles/`     | deferred.ts                                                                                           | Отложенная загрузка стилей    |
| `layout/`     | app.css, titlebar.css                                                                                 | Общая сетка, тайтлбар         |
| `navigation/` | sidebar.css                                                                                           | Боковая панель                |
| `songs/`      | song-list.css                                                                                         | Список песен                  |
| `editor/`     | editor.css                                                                                            | Редактор, рифмы, секции, теги |
| `components/` | modal, settings, toast, context-menu, dropdown, icon-picker, debug-menu, resize-handle, accessibility | UI-компоненты (9 файлов)      |

Темы через CSS-переменные: `--accent`, `--bg-*`, `--fg-*`, `--border-*`, `--card-*` и т.д.

## Тесты

vitest v4, `src/**/*.test.{ts,tsx}`, environment node.

```bash
npm run test           # однократно
npm run test:watch     # watch mode
```

### Покрытие (35 тестовых файлов)

| Область    | Файлы                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Компоненты | ConfirmModal, ContextMenu, DebugMenu, ErrorBoundary, Icons, RhymePopup, ResizeHandle, SettingsModal, Sidebar, SongList, TagAutocomplete, Toast, TypewriterInput |
| Настройки  | UISection, EditorSection, BehaviorSection, CustomTagsSection, RhymesSection, DatabaseSection, shared                                                            |
| Хуки       | useSongs, useSettings, useRhymes, useKeyboardShortcuts, useDebounce                                                                                             |
| Сервисы    | storage, logger, window                                                                                                                                         |
| Типы       | songTags                                                                                                                                                        |
| Утилиты    | id, charUtils                                                                                                                                                   |
| Editor     | fluentTheme, songLanguage                                                                                                                                       |
| i18n       | translations                                                                                                                                                    |
| Константы  | constants                                                                                                                                                       |

## Настройки (44 поля)

| Ключ                   | Тип                                | По умолчанию                 | Описание                            |
| ---------------------- | ---------------------------------- | ---------------------------- | ----------------------------------- |
| `editorFontSize`       | number                             | 13                           | Размер шрифта редактора             |
| `lineHeight`           | number                             | 1.8                          | Межстрочный интервал                |
| `fontFamily`           | string                             | "Segoe UI Variable Text"     | Семейство шрифта                    |
| `spellCheck`           | boolean                            | true                         | Проверка орфографии                 |
| `wordWrap`             | boolean                            | true                         | Перенос слов                        |
| `tabSize`              | 2 \| 4                             | 4                            | Размер табуляции                    |
| `showLineNumbers`      | boolean                            | false                        | Номера строк                        |
| `highlightCurrentLine` | boolean                            | true                         | Подсветка текущей строки            |
| `autocloseBrackets`    | boolean                            | true                         | Автозакрытие скобок/тегов           |
| `cursorStyle`          | "line"/"block"/"underline"         | "line"                       | Стиль курсора                       |
| `cursorBlinkRate`      | number                             | 530                          | Скорость мигания курсора (ms)       |
| `theme`                | "system"/"light"/"dark"            | "system"                     | Тема оформления                     |
| `compactMode`          | boolean                            | false                        | Компактный режим                    |
| `confirmDelete`        | boolean                            | true                         | Подтверждение удаления              |
| `showWordCount`        | boolean                            | false                        | Счётчик слов                        |
| `showSectionOutline`   | boolean                            | true                         | Панель навигации по секциям         |
| `sidebarDefaultOpen`   | boolean                            | true                         | Боковая панель открыта по умолчанию |
| `sidebarWidth`         | number                             | 300                          | Ширина боковой панели (px)          |
| `sidebarFontSize`      | number                             | 13                           | Размер шрифта боковой панели (px)   |
| `songListWidth`        | number                             | 280                          | Ширина списка песен (px)            |
| `animationsEnabled`    | boolean                            | true                         | Анимации интерфейса                 |
| `transparency`         | number                             | 100                          | Прозрачность окна (%)               |
| `titleBarStyle`        | "custom"/"native"                  | "custom"                     | Стиль заголовка окна                |
| `language`             | "ru"/"en"                          | "ru"                         | Язык интерфейса                     |
| `autoSaveDelay`        | number                             | 300                          | Задержка автосохранения (ms)        |
| `exportFormat`         | "txt"/"md"/"lrc"                   | "txt"                        | Формат экспорта                     |
| `defaultSongTemplate`  | string                             | "[Куплет]\n\n\n[Припев]\n\n" | Шаблон новой песни                  |
| `startupAction`        | "empty"/"lastSong"                 | "empty"                      | Действие при запуске                |
| `confirmOnClose`       | boolean                            | true                         | Подтверждение при закрытии          |
| `sortSongsBy`          | "date"/"alphabetical"/"manual"     | "date"                       | Сортировка песен                    |
| `sortCategoriesBy`     | "alphabetical"/"manual"/"songCount"| "alphabetical"               | Сортировка категорий                |
| `customTags`           | string[]                           | []                           | Пользовательские теги               |
| `rhymeLang`            | "ru"/"en"/"auto"                   | "auto"                       | Язык поиска рифм                    |
| `rhymeDepth`           | number                             | 2                            | Глубина поиска рифм                 |
| `maxRhymeResults`      | number                             | 50                           | Макс. результатов рифм              |
| `autoBackup`           | boolean                            | true                         | Автоматические бэкапы               |
| `maxBackups`           | number                             | 10                           | Макс. количество бэкапов            |
| `minimizeToTray`       | boolean                            | true                         | Сворачивать в трей                  |
| `accentColor`          | string                             | ""                           | Акцентный цвет                      |
| `reducedMotion`        | boolean                            | false                        | Уменьшенное движение                |
| `highContrast`         | boolean                            | false                        | Высокий контраст                    |
| `toastAutosave`        | boolean                            | true                         | Уведомлять об автосохранении        |
| `toastErrors`          | boolean                            | true                         | Уведомлять об ошибках               |
| `toastSuccess`         | boolean                            | true                         | Уведомлять об успехе                |

## Сборка

```bash
npm run build            # tsc + vite build
npm run tauri build      # компилирует .exe в src-tauri/target/release/LyriXX.exe
```

Бандлинг активен (`bundle.active: true`). NSIS-инсталлятор отключён (`nsis: null`).

## Проверки

```bash
npm run typecheck        # tsc --noEmit
npm run format:check     # Prettier
```

Pre-commit хук (simple-git-hooks + lint-staged) автоматически запускает Prettier + tsc для `*.{ts,tsx}` и Prettier для `*.{json,css,md}`.

---

## Процесс разработки

Этот проект полностью создан с помощью ИИ (vibe coding). Автор не имеет опыта программирования — весь код, архитектурные решения и документация сгенерированы ИИ без ручного код-ревью. Инструменты: Kilo Code, MiMo 2.5 Free, DeepSeek V4 Flash Free.
