let nextId = Date.now();

/** Генерирует уникальный id: timestamp + случайная строка. */
export function generateId(): string {
  return `${nextId++}-${Math.random().toString(36).slice(2, 8)}`;
}
