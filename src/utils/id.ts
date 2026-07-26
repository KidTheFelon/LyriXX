let nextId = Date.now();

export function generateId(): string {
  return `${nextId++}-${Math.random().toString(36).slice(2, 8)}`;
}
