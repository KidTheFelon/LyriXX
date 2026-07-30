import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "@/i18n";
import { logger, type LogEntry } from "@/services/logger";
import { copyToClipboard } from "@/services/clipboard";
import type { AppSettings } from "@/types/settings";
import type { Song } from "@/types/song";
import type { CustomCategory } from "@/types/category";

interface BackendLogEntry {
  time: string;
  level: string;
  target: string;
  message: string;
}

interface SqlQueryEntry {
  time: string;
  command: string;
  sql: string;
  duration_ms: number;
  success: boolean;
  error: string | null;
}

interface DbFileInfo {
  path: string;
  size_bytes: number;
  last_modified: string;
  migration_version: number;
}

interface DebugMenuProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  songs: Song[];
  categories: CustomCategory[];
}

type Tab =
  "info" | "settings" | "logs" | "performance" | "sql" | "animations" | "actions" | "splash";

const MAX_LOGS = 200;

const ANIMATION_PRESETS = [
  { name: "fadeIn", css: "fadeIn 0.3s ease-out both" },
  { name: "fadeOut", css: "fadeOut 0.3s ease-in both" },
  { name: "modalIn", css: "modalIn 0.2s ease-out both" },
  { name: "overlayIn", css: "overlayIn 0.2s ease-out both" },
  { name: "spin", css: "spin 0.6s linear infinite" },
  { name: "toastIn", css: "toastIn 0.25s ease-out both" },
  { name: "win-dropdown-fade-in", css: "win-dropdown-fade-in 0.15s ease-out both" },
  { name: "settingsTabIn", css: "settingsTabIn 0.2s ease-out both" },
  { name: "settingsGroupIn", css: "settingsGroupIn 0.2s ease-out both" },
  { name: "settingsTagIn", css: "settingsTagIn 0.2s ease-out both" },
  { name: "settingsConfirmSlideIn", css: "settingsConfirmSlideIn 0.2s ease-out both" },
];

export function DebugMenu({ open, onClose, settings, songs, categories }: DebugMenuProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("info");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [perfSnapshot, setPerfSnapshot] = useState(() => getPerfSnapshot());
  const [fps, setFps] = useState("N/A");
  const logsRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);
  const [logSource, setLogSource] = useState<"all" | "frontend" | "backend">("all");

  const [sqlQueries, setSqlQueries] = useState<SqlQueryEntry[]>([]);
  const sqlLogsRef = useRef<HTMLDivElement>(null);

  const [animKey, setAnimKey] = useState(0);

  const [splashStatus, setSplashStatus] = useState<string>("init");
  const [splashTheme, setSplashTheme] = useState<"light" | "dark" | "system">("system");
  const splashFrameRef = useRef<HTMLIFrameElement>(null);

  const splashStatuses = [
    "init",
    "config",
    "db",
    "backup",
    "plugins",
    "tray",
    "rhymes",
    "frontend",
    "ready",
  ] as const;

  const applySplashTheme = useCallback((theme: "light" | "dark" | "system") => {
    setSplashTheme(theme);
    const frame = splashFrameRef.current;
    if (!frame?.contentWindow) return;
    const t = theme === "system" ? "" : theme;
    frame.contentWindow.postMessage({ type: "setTheme", theme: t }, "*");
  }, []);

  const applySplashStatus = useCallback((status: string) => {
    setSplashStatus(status);
    const frame = splashFrameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage({ type: "setStatus", status }, "*");
  }, []);

  const [dbFileInfo, setDbFileInfo] = useState<DbFileInfo | null>(null);
  const [forceError, setForceError] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
    });
  }, []);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setPerfSnapshot(getPerfSnapshot());

      const frontendLogs = logger.getBuffer().map((e) => ({ ...e }));

      invoke<BackendLogEntry[]>("get_backend_logs")
        .then((backendLogs) => {
          const mapped: LogEntry[] = backendLogs.map((e) => ({
            time: e.time,
            level: e.level as LogEntry["level"],
            tag: e.target,
            message: e.message,
            source: "backend" as const,
          }));
          const merged = [...frontendLogs, ...mapped].sort((a, b) => a.time.localeCompare(b.time));
          setLogs(merged.slice(-MAX_LOGS));
        })
        .catch((err) => {
          logger.warn("Debug", "Failed to load backend logs:", err);
          setLogs(frontendLogs);
        });

      invoke<SqlQueryEntry[]>("get_sql_queries")
        .then((queries) => setSqlQueries(queries))
        .catch((err) => {
          logger.warn("Debug", "Failed to load SQL queries:", err);
          setSqlQueries([]);
        });

      invoke<DbFileInfo>("get_db_file_info")
        .then((info) => setDbFileInfo(info))
        .catch((err) => {
          logger.warn("Debug", "Failed to load DB file info:", err);
          setDbFileInfo(null);
        });
    }
    prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const unsub = logger.subscribe((entry) => {
      addLog(entry);
    });
    return unsub;
  }, [open, addLog]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (sqlLogsRef.current) {
      sqlLogsRef.current.scrollTop = sqlLogsRef.current.scrollHeight;
    }
  }, [sqlQueries]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let running = true;
    let frameCount = 0;
    let lastTime = performance.now();

    const measure = () => {
      if (!running) return;
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(String(frameCount));
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);

    const iv = setInterval(() => setPerfSnapshot(getPerfSnapshot()), 1000);
    return () => {
      running = false;
      clearInterval(iv);
    };
  }, [open]);

  const sysInfo = getSystemInfo();
  const filteredLogs = logSource === "all" ? logs : logs.filter((l) => l.source === logSource);

  const formatBytesJS = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyDebugReport = useCallback(async () => {
    const lines: string[] = [];
    lines.push("=== LyriXX Debug Report ===");
    lines.push(`Date: ${new Date().toISOString()}`);
    lines.push(`App: LyriXX v${import.meta.env.PACKAGE_VERSION}`);
    lines.push(`Platform: ${sysInfo.platform}`);
    lines.push(`Viewport: ${sysInfo.viewportWidth}x${sysInfo.viewportHeight}`);
    lines.push(`DPR: ${sysInfo.dpr}`);
    lines.push(`Theme: ${settings.theme}`);
    lines.push(`Language: ${settings.language}`);
    lines.push(`Songs: ${songs.length}`);
    lines.push(`Categories: ${categories.length}`);
    lines.push(`Build: ${import.meta.env.DEV ? "development" : "production"}`);
    if (dbFileInfo) {
      lines.push(`DB Path: ${dbFileInfo.path}`);
      lines.push(`DB Size: ${formatBytesJS(dbFileInfo.size_bytes)}`);
      lines.push(`DB Modified: ${dbFileInfo.last_modified}`);
      lines.push(`DB Migration: v${dbFileInfo.migration_version}`);
    }
    lines.push(`Memory: ${perfSnapshot.memoryUsed} / ${perfSnapshot.memoryLimit}`);
    lines.push(`DOM Nodes: ${perfSnapshot.domNodes}`);
    lines.push(`FPS: ${fps}`);
    lines.push(`Window Perf: ${perfSnapshot.navigationTiming}`);
    lines.push("");
    lines.push(`=== Last ${Math.min(logs.length, 50)} Logs ===`);
    const recent = logs.slice(-50);
    for (const l of recent) {
      lines.push(`[${l.time}] ${l.level.toUpperCase()} [${l.source}] [${l.tag}] ${l.message}`);
    }
    if (sqlQueries.length > 0) {
      lines.push("");
      lines.push(`=== SQL: ${sqlQueries.length} queries ===`);
      const failed = sqlQueries.filter((q) => !q.success);
      const avg = sqlQueries.reduce((s, q) => s + q.duration_ms, 0) / sqlQueries.length;
      lines.push(`Total: ${sqlQueries.length}, Failed: ${failed.length}, Avg: ${avg.toFixed(2)}ms`);
      for (const q of failed) {
        lines.push(`  FAIL: ${q.command} (${q.duration_ms.toFixed(2)}ms) ${q.error ?? ""}`);
      }
    }
    const text = lines.join("\n");
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } else {
      setCopiedReport(false);
    }
  }, [sysInfo, settings, songs, categories, dbFileInfo, perfSnapshot, logs, sqlQueries, fps]);

  if (!open) return null;

  if (forceError) {
    throw new Error("Debug menu: forced crash test");
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal debug-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Debug Menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="debug-header">
          <h2 className="modal-title">Debug Menu</h2>
          <button className="modal-btn modal-btn-cancel" type="button" onClick={onClose}>
            {t("close")}
          </button>
        </div>

        <div className="debug-tabs">
          {(
            [
              "info",
              "settings",
              "logs",
              "performance",
              "sql",
              "animations",
              "actions",
              "splash",
            ] as Tab[]
          ).map((id) => (
            <button
              key={id}
              className={`debug-tab${tab === id ? " debug-tab--active" : ""}`}
              type="button"
              onClick={() => setTab(id)}
            >
              {id === "info"
                ? "Info"
                : id === "settings"
                  ? "Settings"
                  : id === "logs"
                    ? "Logs"
                    : id === "performance"
                      ? "Perf"
                      : id === "sql"
                        ? "SQL"
                        : id === "animations"
                          ? "Anims"
                          : id === "splash"
                            ? "Splash"
                            : "Actions"}
            </button>
          ))}
        </div>

        <div className="debug-body">
          {tab === "info" && (
            <div className="debug-section">
              <DebugRow label="App" value={`LyriXX v${import.meta.env.PACKAGE_VERSION}`} />
              <DebugRow label="Platform" value={sysInfo.platform} />
              <DebugRow label="User Agent" value={sysInfo.userAgent} />
              <DebugRow label="Screen" value={`${sysInfo.screenWidth}×${sysInfo.screenHeight}`} />
              <DebugRow
                label="Viewport"
                value={`${sysInfo.viewportWidth}×${sysInfo.viewportHeight}`}
              />
              <DebugRow label="DPR" value={String(sysInfo.dpr)} />
              <DebugRow label="Theme" value={settings.theme} />
              <DebugRow label="Language" value={settings.language} />
              <DebugRow label="Songs" value={String(songs.length)} />
              <DebugRow label="Categories" value={String(categories.length)} />
              <DebugRow
                label="Build Mode"
                value={import.meta.env.DEV ? "development" : "production"}
              />
            </div>
          )}

          {tab === "settings" && (
            <div className="debug-section">
              <pre className="debug-json">{JSON.stringify(settings, null, 2)}</pre>
            </div>
          )}

          {tab === "logs" && (
            <div className="debug-section debug-logs-wrap">
              <div className="debug-logs-toolbar">
                {(["all", "frontend", "backend"] as const).map((src) => (
                  <button
                    key={src}
                    className={`debug-tab${logSource === src ? " debug-tab--active" : ""}`}
                    type="button"
                    onClick={() => setLogSource(src)}
                  >
                    {src === "all" ? "All" : src === "frontend" ? "Frontend" : "Backend"}
                  </button>
                ))}
              </div>
              <div className="debug-logs" ref={logsRef}>
                {filteredLogs.length === 0 && (
                  <span className="debug-logs-empty">No logs captured.</span>
                )}
                {filteredLogs.map((entry, i) => (
                  <div key={i} className={`debug-log-line debug-log-${entry.level}`}>
                    <span className="debug-log-time">{entry.time}</span>
                    <span className="debug-log-level">{entry.level.toUpperCase()}</span>
                    <span className="debug-log-source">
                      {entry.source === "backend" ? "RS" : "JS"}
                    </span>
                    <span className="debug-log-tag">[{entry.tag}]</span>
                    <span className="debug-log-msg">{entry.message}</span>
                  </div>
                ))}
              </div>
              <button
                className="modal-btn modal-btn-cancel"
                type="button"
                style={{ marginTop: 8, alignSelf: "flex-end" }}
                onClick={() => setLogs([])}
              >
                Clear
              </button>
            </div>
          )}

          {tab === "performance" && (
            <div className="debug-section">
              <DebugRow label="Memory Used" value={perfSnapshot.memoryUsed} />
              <DebugRow label="Memory Limit" value={perfSnapshot.memoryLimit} />
              <DebugRow label="DOM Nodes" value={String(perfSnapshot.domNodes)} />
              <DebugRow label="Window Performance" value={perfSnapshot.navigationTiming} />
              <DebugRow label="FPS" value={fps} />
            </div>
          )}

          {tab === "sql" && (
            <div className="debug-section debug-logs-wrap">
              <div className="debug-sql-summary">
                <DebugRow label="Total Queries" value={String(sqlQueries.length)} />
                <DebugRow
                  label="Avg Duration"
                  value={
                    sqlQueries.length > 0
                      ? `${(sqlQueries.reduce((sum, q) => sum + q.duration_ms, 0) / sqlQueries.length).toFixed(2)}ms`
                      : "N/A"
                  }
                />
                <DebugRow
                  label="Failed"
                  value={String(sqlQueries.filter((q) => !q.success).length)}
                />
              </div>
              <div className="debug-logs" ref={sqlLogsRef}>
                {sqlQueries.length === 0 && (
                  <span className="debug-logs-empty">No SQL queries captured yet.</span>
                )}
                {sqlQueries.map((entry, i) => (
                  <div
                    key={i}
                    className={`debug-sql-line ${entry.success ? "" : "debug-sql-error"}`}
                  >
                    <div className="debug-sql-header">
                      <span className="debug-log-time">{entry.time}</span>
                      <span className="debug-sql-command">{entry.command}</span>
                      <span className="debug-sql-duration">{entry.duration_ms.toFixed(2)}ms</span>
                      <span
                        className={`debug-sql-status ${entry.success ? "debug-sql-ok" : "debug-sql-fail"}`}
                      >
                        {entry.success ? "OK" : "FAIL"}
                      </span>
                    </div>
                    <pre className="debug-sql-code">{entry.sql}</pre>
                    {entry.error && <div className="debug-sql-error-msg">{entry.error}</div>}
                  </div>
                ))}
              </div>
              <button
                className="modal-btn modal-btn-cancel"
                type="button"
                style={{ marginTop: 8, alignSelf: "flex-end" }}
                onClick={() => setSqlQueries([])}
              >
                Clear
              </button>
            </div>
          )}

          {tab === "animations" && (
            <div className="debug-section">
              <div className="debug-anim-toolbar">
                <button
                  className="modal-btn"
                  type="button"
                  onClick={() => setAnimKey((k) => k + 1)}
                >
                  Replay All
                </button>
              </div>
              <div className="debug-anim-grid">
                {ANIMATION_PRESETS.map((anim) => (
                  <div key={`${anim.name}-${animKey}`} className="debug-anim-card">
                    <div className="debug-anim-preview" style={{ animation: anim.css }}>
                      <div className="debug-anim-box" />
                    </div>
                    <div className="debug-anim-name">{anim.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "actions" && (
            <div className="debug-section debug-actions">
              <div className="debug-actions-group">
                <div className="debug-actions-title">Feature Toggles</div>
                <label className="debug-toggle">
                  <input
                    type="checkbox"
                    checked={document.documentElement.classList.contains("dark")}
                    onChange={(e) => {
                      document.documentElement.classList.toggle("dark", e.target.checked);
                    }}
                  />
                  <span className="debug-toggle-track" />
                  <span className="debug-toggle-label">Dark Mode (override)</span>
                </label>
                <label className="debug-toggle">
                  <input
                    type="checkbox"
                    checked={forceError}
                    onChange={() => setForceError(true)}
                  />
                  <span className="debug-toggle-track" />
                  <span className="debug-toggle-label">Crash Test (ErrorBoundary)</span>
                </label>
              </div>

              <div className="debug-actions-group">
                <div className="debug-actions-title">Database</div>
                {dbFileInfo ? (
                  <>
                    <DebugRow label="Path" value={dbFileInfo.path} />
                    <DebugRow label="Size" value={formatBytesJS(dbFileInfo.size_bytes)} />
                    <DebugRow label="Last Modified" value={dbFileInfo.last_modified} />
                    <DebugRow label="Migration" value={`v${dbFileInfo.migration_version}`} />
                  </>
                ) : (
                  <span className="debug-logs-empty">Loading...</span>
                )}
              </div>

              <div className="debug-actions-group">
                <div className="debug-actions-title">Export</div>
                <button
                  className={`modal-btn debug-copy-btn${copiedReport ? " debug-copy-btn--ok" : ""}`}
                  type="button"
                  onClick={copyDebugReport}
                >
                  {copiedReport ? "Copied!" : "Copy Debug Report"}
                </button>
              </div>
            </div>
          )}

          {tab === "splash" && (
            <div className="debug-section">
              <div className="debug-splash-wrap">
                <div className="debug-splash-frame">
                  <div className="debug-splash-label">Splash Preview (400×280)</div>
                  <iframe
                    ref={splashFrameRef}
                    src="/splash.html"
                    width={400}
                    height={280}
                    style={{ border: "1px solid #444", borderRadius: 4, background: "#f3f3f3" }}
                    sandbox="allow-scripts"
                    title="Splash preview"
                  />
                </div>
                <div className="debug-splash-controls">
                  <div className="debug-actions-title">Status</div>
                  <div className="debug-splash-btns">
                    {splashStatuses.map((s) => (
                      <button
                        key={s}
                        className={`modal-btn${splashStatus === s ? " modal-btn-primary" : ""}`}
                        type="button"
                        onClick={() => applySplashStatus(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="debug-actions-title" style={{ marginTop: 12 }}>
                    Theme
                  </div>
                  <div className="debug-splash-btns">
                    {(["light", "dark", "system"] as const).map((th) => (
                      <button
                        key={th}
                        className={`modal-btn${splashTheme === th ? " modal-btn-primary" : ""}`}
                        type="button"
                        onClick={() => applySplashTheme(th)}
                      >
                        {th}
                      </button>
                    ))}
                  </div>
                  <div className="debug-actions-title" style={{ marginTop: 12 }}>
                    Info
                  </div>
                  <DebugRow label="Source" value="/splash.html" />
                  <DebugRow label="Window" value="400×280" />
                  <DebugRow label="Image" value="Wide310x150Logo.scale-200.png (620×300)" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="debug-row">
      <span className="debug-row-label">{label}</span>
      <span className="debug-row-value">{value}</span>
    </div>
  );
}

function getSystemInfo() {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  return {
    platform: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? "unknown",
    userAgent: nav?.userAgent ?? "unknown",
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    dpr: window.devicePixelRatio ?? 1,
  };
}

function getPerfSnapshot() {
  const perf = performance;
  const memory = (
    perf as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }
  ).memory;

  let memoryUsed = "N/A";
  let memoryLimit = "N/A";
  if (memory) {
    memoryUsed = formatBytes(memory.usedJSHeapSize);
    memoryLimit = formatBytes(memory.totalJSHeapSize);
  }

  const domNodes = document.querySelectorAll("*").length;

  const navEntries = perf.getEntriesByType?.("navigation") as PerformanceNavigationTiming[];
  let navigationTiming = "N/A";
  if (navEntries?.length) {
    const nav = navEntries[0];
    navigationTiming = `domContentLoaded: ${Math.round(nav.domContentLoadedEventEnd - nav.startTime)}ms, load: ${Math.round(nav.loadEventEnd - nav.startTime)}ms`;
  }

  return {
    memoryUsed,
    memoryLimit,
    domNodes,
    navigationTiming,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
