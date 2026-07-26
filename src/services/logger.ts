import { invoke } from "@tauri-apps/api/core";

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const minLevel: number = import.meta.env.DEV ? 0 : 2;

export interface LogEntry {
  time: string;
  level: Level;
  tag: string;
  message: string;
  source: "frontend" | "backend";
}

type LogListener = (entry: LogEntry) => void;

const MAX_BUFFER = 500;
const buffer: LogEntry[] = [];
const pendingFlush: LogEntry[] = [];
const listeners = new Set<LogListener>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushToFile() {
  if (pendingFlush.length === 0) return;
  const lines = pendingFlush
    .splice(0)
    .map((e) => `${e.time} [${e.level.toUpperCase()}] [${e.tag}] ${e.message}`);
  invoke("write_frontend_log", { line: lines.join("\n") }).catch((err) => {
    console.error("[Logger] flushToFile failed:", err);
  });
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushToFile();
  }, 500);
}

function log(level: Level, tag: string, message: string, ...args: unknown[]) {
  const time = new Date().toISOString().slice(11, 23);
  const full = args.length ? `${message} ${args.map(String).join(" ")}` : message;
  const entry: LogEntry = { time, level, tag, message: full, source: "frontend" };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
  pendingFlush.push(entry);
  scheduleFlush();
  for (const fn of listeners) fn(entry);
  if (LEVELS[level] < minLevel) return;
  const con =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "info"
          ? console.info
          : console.debug;
  con(`[${time}] [${level.toUpperCase()}] [${tag}] ${message}`, ...args);
}

export const logger = {
  debug: (tag: string, msg: string, ...args: unknown[]) => log("debug", tag, msg, ...args),
  info: (tag: string, msg: string, ...args: unknown[]) => log("info", tag, msg, ...args),
  warn: (tag: string, msg: string, ...args: unknown[]) => log("warn", tag, msg, ...args),
  error: (tag: string, msg: string, ...args: unknown[]) => log("error", tag, msg, ...args),
  subscribe(fn: LogListener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getBuffer(): readonly LogEntry[] {
    return buffer;
  },
  flushNow() {
    flushToFile();
  },
};
