# Changelog

## [0.4.0](https://github.com/KidTheFelon/LyriXX/compare/lyrixx-v0.3.0...lyrixx-v0.4.0) (2026-07-29)


### Features

* add single-instance plugin to prevent multiple app windows ([7fd03e7](https://github.com/KidTheFelon/LyriXX/commit/7fd03e7a54b3f3583eafaa2f1ae7b7fd139c87e1))
* parenthesized text highlighting, fix keyboard shortcuts for contentEditable, disable CSP for dev ([452cf49](https://github.com/KidTheFelon/LyriXX/commit/452cf491ec6dd41811789da904cb9536e2bd4f0d))


### Bug Fixes

* add missing .gitmodules for quickpoeter submodule ([b423b58](https://github.com/KidTheFelon/LyriXX/commit/b423b5810e75c501740ff888c679c8e7e604c452))
* **ci:** remove lyrixx/ path prefix, files are at repo root ([9a43ad5](https://github.com/KidTheFelon/LyriXX/commit/9a43ad5ecf72222cc460d8d8bfa085ea0b412ed3))
* revert quickpoeter submodule to upstream commit (CI fetch fix) ([d0eeab3](https://github.com/KidTheFelon/LyriXX/commit/d0eeab346f77ad36dbaa38765f6b0bd0692edc80))


### Documentation

* add issue and PR templates ([df9f7c0](https://github.com/KidTheFelon/LyriXX/commit/df9f7c0151eaf0bdc82ddb47b2d03cd9128846f4))
* add v0.3.0 changelog entry ([b65a154](https://github.com/KidTheFelon/LyriXX/commit/b65a1544e8bd9f4c530696068df842d7e9cb18e0))
* add Vision section to CONTRIBUTING.md ([958ff71](https://github.com/KidTheFelon/LyriXX/commit/958ff71e4bd4e1a0b856103ebfe9f9cce5cefa82))
* honest AI-only development disclosure ([9f5d63a](https://github.com/KidTheFelon/LyriXX/commit/9f5d63ab440a4cee52e7fed76cc165f1b9515ebf))
* mention AI-assisted development ([c8e4a75](https://github.com/KidTheFelon/LyriXX/commit/c8e4a7562f7a8d13973407e0dfedb05ab7b02653))
* specify AI tools used (Kilo Code, MiMo, DeepSeek) ([bc0659c](https://github.com/KidTheFelon/LyriXX/commit/bc0659cbdceed76a94636d3f66efc2dfe608160c))
* update AGENTS.md with current project state ([1bf6300](https://github.com/KidTheFelon/LyriXX/commit/1bf6300af48be2389d3aa5b716dfe15f1a918bcb))


### Miscellaneous

* bump version to 0.3.0 ([6dbd6ec](https://github.com/KidTheFelon/LyriXX/commit/6dbd6ecb2594cd7fcb2e37cf20947a4e77bbe0fd))

## [0.3.0] — 2026-07-29

### Added

- Подсветка скобок `()` в редакторе (курсив, третичный цвет)
- GitHub issue и PR шаблоны

### Changed

- `useKeyboardShortcuts`: учёт `contentEditable` элементов в проверке `isInput`
- CSP отключён в `tauri.conf.json` для dev-режима
- quickpoeter: очистка зависимостей, удалён dead code, фикс lifetime-ов
- Версия: 0.2.0 → 0.3.0

## [0.2.0] — 2026-07-22

### Added

- Рифмы: встроенный словарь Зализняка + word2vec через quickpoeter, попап в редакторе
- Теги секций: `[Куплет]`, `[Припев]`, `[Бридж]` и т.д. — 14 встроенных + пользовательские
- Навигатор секций (SectionOutline): клик для прыжка, drag-and-drop для перемещения
- TypewriterInput: кастомная textarea с подсветкой тегов, автодополнением, рифмами
- Контекстное меню (ContextMenu): правый клик, portal, навигация клавиатурой
- Тост-уведомления (Toast): error/success/info
- framer-motion для анимаций

### Changed

- CSS разбит на 15 файлов по папкам (было 1 fluent.css)
- 11 Tauri-команд (было 10): добавлен `get_rhymes`
- Бандлинг активен (`bundle.active: true`)

## [0.1.0] — 2026-07-21

### Added

- Создание, редактирование, удаление песен
- Две категории: «Песни» и «Заготовки»
- Поиск по названию или исполнителю
- Автосохранение в SQLite (rusqlite)
- Кастомный тайтлбар с Mica-эффектом (Windows 11)
- Тёмная/светлая тема
- Клавиатурные сокращения (Ctrl+N, Ctrl+F, Delete)
- Подтверждение удаления
- Fluent Design / WinUI 3 стилизация
- Accessibility: ARIA, skip-link, screen reader
- Error Boundary
- Debounce поиска
- Индикатор сохранения
- Pre-commit hooks (Prettier + tsc)
- ESLint + Prettier
- Система миграций БД (PRAGMA user_version)
- Экспорт базы данных
