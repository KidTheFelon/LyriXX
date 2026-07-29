# Changelog

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
