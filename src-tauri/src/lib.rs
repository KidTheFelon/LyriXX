mod db;
mod english_rhyme;
mod fonts;
mod lang_detect;
#[cfg(target_os = "windows")]
mod mica;
mod rhyme;

use serde::Serialize;
use std::fs::OpenOptions;
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Listener, Manager};
#[cfg(target_os = "windows")]
use windows::core::Interface;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_OK, MB_ICONERROR};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::Layer;

const MAX_BACKEND_LOGS: usize = 500;
const MAX_SQL_QUERIES: usize = 200;

#[derive(Clone, Serialize)]
pub struct SqlQueryEntry {
    pub time: String,
    pub command: String,
    pub sql: String,
    pub duration_ms: f64,
    pub success: bool,
    pub error: Option<String>,
}

pub struct SqlQueryLog {
    pub entries: Mutex<Vec<SqlQueryEntry>>,
}

impl SqlQueryLog {
    pub fn new() -> Self {
        Self {
            entries: Mutex::new(Vec::new()),
        }
    }

    pub fn log(&self, command: &str, sql: &str, start: Instant, success: bool, error: Option<String>) {
        let entry = SqlQueryEntry {
            time: chrono_now(),
            command: command.to_string(),
            sql: sql.to_string(),
            duration_ms: start.elapsed().as_secs_f64() * 1000.0,
            success,
            error,
        };
        if let Ok(mut entries) = self.entries.lock() {
            entries.push(entry);
            if entries.len() > MAX_SQL_QUERIES {
                let excess = entries.len() - MAX_SQL_QUERIES;
                entries.drain(0..excess);
            }
        }
    }
}

#[derive(Clone, Serialize)]
pub struct BackendLogEntry {
    pub time: String,
    pub level: String,
    pub target: String,
    pub message: String,
}

pub struct BackendLogBuffer {
    pub entries: Mutex<Vec<BackendLogEntry>>,
}

pub struct MinimizeToTrayState {
    pub enabled: AtomicBool,
}

pub struct LogFileState {
    pub file: Mutex<std::fs::File>,
    pub logs_dir: std::path::PathBuf,
    pub current_date: Mutex<String>,
}

struct LogLayer {
    buffer: Arc<BackendLogBuffer>,
}

impl<S: tracing::Subscriber> Layer<S> for LogLayer {
    fn on_event(
        &self,
        event: &tracing::Event<'_>,
        _ctx: tracing_subscriber::layer::Context<'_, S>,
    ) {
        let meta = event.metadata();
        let level = meta.level().as_str().to_lowercase();
        let target = meta.target().to_string();

        let mut visitor = MsgVisitor(String::new());
        event.record(&mut visitor);

        let time = chrono_now();

        let entry = BackendLogEntry {
            time,
            level,
            target,
            message: visitor.0,
        };

        if let Ok(mut entries) = self.buffer.entries.lock() {
            entries.push(entry);
            if entries.len() > MAX_BACKEND_LOGS {
                let excess = entries.len() - MAX_BACKEND_LOGS;
                entries.drain(0..excess);
            }
        }
    }
}

struct MsgVisitor(String);

impl tracing::field::Visit for MsgVisitor {
    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        if field.name() == "message" {
            self.0 = format!("{:?}", value);
            if self.0.starts_with('"') && self.0.ends_with('"') {
                self.0 = self.0[1..self.0.len() - 1].to_string();
            }
        } else if !self.0.is_empty() {
            self.0.push_str(&format!(" {}={:?}", field.name(), value));
        } else {
            self.0 = format!("{}={:?}", field.name(), value);
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        if field.name() == "message" {
            self.0 = value.to_string();
        }
    }

    fn record_i64(&mut self, field: &tracing::field::Field, value: i64) {
        if !self.0.is_empty() {
            self.0.push_str(&format!(" {}={}", field.name(), value));
        } else {
            self.0 = format!("{}={}", field.name(), value);
        }
    }

    fn record_u64(&mut self, field: &tracing::field::Field, value: u64) {
        if !self.0.is_empty() {
            self.0.push_str(&format!(" {}={}", field.name(), value));
        } else {
            self.0 = format!("{}={}", field.name(), value);
        }
    }

    fn record_bool(&mut self, field: &tracing::field::Field, value: bool) {
        if !self.0.is_empty() {
            self.0.push_str(&format!(" {}={}", field.name(), value));
        } else {
            self.0 = format!("{}={}", field.name(), value);
        }
    }
}

pub(crate) fn chrono_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let secs = (now / 1000) as u64;
    let millis = (now % 1000) as u32;
    let dt = chrono_from_epoch(secs);
    format!("{}:{:02}:{:02}.{:03}", dt.3, dt.4, dt.5, millis)
}

fn chrono_from_epoch(secs: u64) -> (u32, u32, u32, u32, u32, u32) {
    let mut days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = (time_of_day / 3600) as u32;
    let minutes = ((time_of_day % 3600) / 60) as u32;
    let seconds = (time_of_day % 60) as u32;

    let mut year = 1970u32;
    loop {
        let leap = is_leap(year);
        let days_in_year = if leap { 366 } else { 365 };
        if days < days_in_year as u64 {
            break;
        }
        days -= days_in_year as u64;
        year += 1;
    }

    let leap = is_leap(year);
    let month_days: [u32; 12] = [
        31,
        if leap { 29 } else { 28 },
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];
    let mut month = 1u32;
    let mut remaining = days as u32;
    for (i, &md) in month_days.iter().enumerate() {
        if remaining < md {
            month = (i + 1) as u32;
            break;
        }
        remaining -= md;
    }
    let day = remaining + 1;

    (year, month, day, hours, minutes, seconds)
}

fn is_leap(y: u32) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

fn splash_status(handle: &tauri::AppHandle, key: &str) {
    if let Some(splash) = handle.get_webview_window("splash") {
        if let Err(e) = splash.eval(&format!("window.__splashStatus('{}')", key)) {
            tracing::warn!(error = %e, key, "Failed to update splash status via eval");
        }
    }
}

fn transition_to_main(handle: &tauri::AppHandle) {
    splash_status(handle, "ready");
    std::thread::sleep(std::time::Duration::from_millis(300));
    if let Some(splash) = handle.get_webview_window("splash") {
        let _ = splash.destroy();
    }
    if let Some(main) = handle.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            mica::setup_mica(&main, None);
            if !cfg!(debug_assertions) {
            let _ = main.with_webview(|webview| {
                unsafe {
                    let controller = webview.controller();
                    let core = controller.CoreWebView2().unwrap();
                    let settings = core.Settings().unwrap();
                    let _ = settings.SetAreDefaultContextMenusEnabled(false);
                    let settings3: webview2_com_sys::Microsoft::Web::WebView2::Win32::ICoreWebView2Settings3 =
                        settings.cast().unwrap();
                    let _ = settings3.SetAreBrowserAcceleratorKeysEnabled(false);
                }
            });
        }
        }
        let _ = main.show();
        let _ = main.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let logs_dir = get_logs_dir();

    let backend_buffer = Arc::new(BackendLogBuffer {
        entries: Mutex::new(Vec::new()),
    });
    let sql_query_log = Arc::new(SqlQueryLog::new());

    let file_appender = tracing_appender::rolling::daily(&logs_dir, "lyrixx.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    std::mem::forget(_guard);

    let buffer_clone = backend_buffer.clone();
    let log_layer = LogLayer {
        buffer: buffer_clone,
    }
    .with_filter(tracing_subscriber::filter::LevelFilter::TRACE);

    let console_layer = tracing_subscriber::fmt::layer()
        .with_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "lyrixx=debug".into()),
        );

    let file_layer = tracing_subscriber::fmt::layer()
        .with_writer(non_blocking)
        .with_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "lyrixx=debug".into()),
        );

    tracing_subscriber::registry()
        .with(log_layer)
        .with(console_layer)
        .with(file_layer)
        .init();

    tracing::info!("Application started");

    let today = {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let dt = chrono_from_epoch(now);
        format!("{:04}-{:02}-{:02}", dt.0, dt.1, dt.2)
    };
    let frontend_log_filename = frontend_log_filename(&today);
    let log_path = logs_dir.join(&frontend_log_filename);
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .unwrap_or_else(|e| {
            tracing::warn!(error = %e, path = %log_path.display(), "Failed to open frontend log file, creating new");
            std::fs::File::create(&log_path).expect("Cannot create log file")
        });

    let db_state = match db::init() {
        Ok(state) => state,
        Err(e) => {
            tracing::error!(error = %e, "Failed to initialize database");
            show_fatal_error(&format!("Failed to initialize database:\n\n{}", e));
            unreachable!();
        }
    };

    let rhyme_state: rhyme::SharedRhymeEngine = Arc::new(Mutex::new(None));

    let frontend_ready = Arc::new(AtomicBool::new(false));
    let backend_ready = Arc::new(AtomicBool::new(false));

    tauri::Builder::default()
        .manage(db_state)
        .manage(rhyme_state.clone())
        .manage(LogFileState {
            file: Mutex::new(log_file),
            logs_dir,
            current_date: Mutex::new(today),
        })
        .manage(backend_buffer)
        .manage(sql_query_log.clone())
        .manage(MinimizeToTrayState {
            enabled: AtomicBool::new(true),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(move |app| {
            #[cfg(target_os = "windows")]
            {
                if let Some(splash) = app.get_webview_window("splash") {
                    if !cfg!(debug_assertions) {
                        let _ = splash.with_webview(|webview| {
                            unsafe {
                                let controller = webview.controller();
                                let core = controller.CoreWebView2().unwrap();
                                let settings = core.Settings().unwrap();
                                let _ = settings.SetAreDefaultContextMenusEnabled(false);
                                let settings3: webview2_com_sys::Microsoft::Web::WebView2::Win32::ICoreWebView2Settings3 =
                                    settings.cast().unwrap();
                                let _ = settings3.SetAreBrowserAcceleratorKeysEnabled(false);
                            }
                        });
                    }
                }
            }

            let handle = app.handle().clone();

            splash_status(&handle, "db");

            {
                let db_state: tauri::State<'_, db::DbState> = handle.state();
                let conn = db_state.db.lock().unwrap();
                db::auto_backup(&conn);
            }

            splash_status(&handle, "backup");

            let initial_theme: Option<String> = {
                let db_state: tauri::State<'_, db::DbState> = handle.state();
                let conn = db_state.db.lock().unwrap();
                conn.query_row("SELECT value FROM settings WHERE key = ?1", ["theme"], |row| row.get(0)).ok()
            };

            let minimize_to_tray: bool = {
                let db_state: tauri::State<'_, db::DbState> = handle.state();
                let conn = db_state.db.lock().unwrap();
                conn.query_row("SELECT value FROM settings WHERE key = ?1", ["minimizeToTray"], |row| row.get::<_, String>(0))
                    .ok()
                    .map(|v| v != "false")
                    .unwrap_or(true)
            };
            tracing::info!(minimize_to_tray, "System tray setting loaded");

            {
                let tray_state: tauri::State<'_, MinimizeToTrayState> = handle.state();
                tray_state.enabled.store(minimize_to_tray, Ordering::SeqCst);
            }

            splash_status(&handle, "config");

            if let Some(theme) = &initial_theme {
                if let Some(splash) = handle.get_webview_window("splash") {
                    if let Err(e) = splash.eval(&format!("window.__setTheme('{}')", theme)) {
                        tracing::warn!(error = %e, theme, "Failed to set theme on splash via eval");
                    }
                }
            }

            splash_status(&handle, "plugins");

            let fe = frontend_ready.clone();
            let be = backend_ready.clone();
            let h1 = handle.clone();
            handle.listen("app-ready", move |_event| {
                splash_status(&h1, "frontend");
                fe.store(true, Ordering::SeqCst);
                if be.load(Ordering::SeqCst) {
                    transition_to_main(&h1);
                }
            });

            splash_status(&handle, "rhymes");

            let rs = rhyme_state.clone();
            let fe2 = frontend_ready.clone();
            let be2 = backend_ready.clone();
            let h2 = handle.clone();
            std::thread::spawn(move || {
                let engine = rhyme::RhymeEngine::init();
                *rs.lock().unwrap() = Some(engine);
                be2.store(true, Ordering::SeqCst);
                if fe2.load(Ordering::SeqCst) {
                    transition_to_main(&h2);
                }
            });

            splash_status(&handle, "tray");

            let show_i = MenuItem::with_id(app, "show", "Показать", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Выход", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            tracing::info!("Creating system tray icon");

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("LyriXX")
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show" => {
                        tracing::info!(target: "tray", "Tray menu: show clicked");
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        tracing::info!(target: "tray", "Tray menu: quit clicked");
                        app.exit(0);
                    }
                    other => {
                        tracing::debug!(target: "tray", item = other, "Tray menu: unhandled item");
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        tracing::info!(target: "tray", "Tray icon left-click: showing main window");
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            if !minimize_to_tray {
                if let Some(tray) = app.tray_by_id("main-tray") {
                    let _ = tray.set_visible(false);
                    tracing::info!(target: "tray", "Tray icon hidden on startup (minimizeToTray=false)");
                }
            }

            if let Some(main_window) = app.get_webview_window("main") {
                let h = app.handle().clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        let state: tauri::State<'_, MinimizeToTrayState> = h.state();
                        if state.enabled.load(Ordering::SeqCst) {
                            tracing::info!(target: "tray", "CloseRequested intercepted: hiding to tray");
                            api.prevent_close();
                            if let Some(w) = h.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        } else {
                            tracing::debug!(target: "tray", "CloseRequested: minimizeToTray disabled, closing normally");
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::load_songs,
            db::save_song,
            db::delete_song,
            db::delete_songs,
            db::load_categories,
            db::save_category,
            db::delete_category,
            db::load_setting,
            db::save_setting,
            db::get_db_path_str,
            db::copy_file,
            db::write_text_file,
            db::clear_all_data,
            db::list_backups,
            db::delete_backup,
            db::restore_backup,
            db::get_db_file_info,
            db::check_db_recovery,
            rhyme::get_rhymes,
            fonts::get_system_fonts,
            set_mica_theme,
            write_frontend_log,
            get_backend_logs,
            get_sql_queries,
            toggle_minimize_to_tray,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "windows")]
fn show_fatal_error(message: &str) {
    use windows::core::PCWSTR;
    let wide: Vec<u16> = message.encode_utf16().chain(std::iter::once(0)).collect();
    let title: Vec<u16> = "LyriXX\0".encode_utf16().collect();
    unsafe {
        MessageBoxW(None, PCWSTR(wide.as_ptr()), PCWSTR(title.as_ptr()), MB_OK | MB_ICONERROR);
    }
    std::process::exit(1);
}

#[cfg(not(target_os = "windows"))]
fn show_fatal_error(message: &str) {
    eprintln!("FATAL: {}", message);
    std::process::exit(1);
}

fn get_logs_dir() -> std::path::PathBuf {
    let exe = std::env::current_exe().expect("failed to get exe path");
    let exe_dir = exe.parent().expect("exe path has no parent").join("logs");
    if std::fs::create_dir_all(&exe_dir).is_ok() {
        let test_file = exe_dir.join(".write_test");
        if std::fs::OpenOptions::new().create(true).write(true).open(&test_file).is_ok() {
            let _ = std::fs::remove_file(&test_file);
            return exe_dir;
        }
    }
    let appdata = std::env::var("APPDATA")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            std::env::var("HOME")
                .map(std::path::PathBuf::from)
                .unwrap_or_else(|_| std::path::PathBuf::from("."))
        });
    let fallback = appdata.join("LyriXX").join("logs");
    let _ = std::fs::create_dir_all(&fallback);
    fallback
}

#[tauri::command]
fn set_mica_theme(app: tauri::AppHandle, dark: bool) {
    tracing::debug!(dark, "set_mica_theme called");
    #[cfg(target_os = "windows")]
    {
        if let Some(window) = app.get_webview_window("main") {
            mica::setup_mica(&window, Some(dark));
        } else {
            tracing::warn!("set_mica_theme: main window not found");
        }
    }
}

fn frontend_log_filename(date: &str) -> String {
    format!("lyrixx.frontend.{}.log", date)
}

#[tauri::command]
fn write_frontend_log(state: tauri::State<'_, LogFileState>, line: String) {
    let today = {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let dt = chrono_from_epoch(now);
        format!("{:04}-{:02}-{:02}", dt.0, dt.1, dt.2)
    };

    let mut current_date = match state.current_date.lock() {
        Ok(g) => g,
        Err(poisoned) => poisoned.into_inner(),
    };

    if *current_date != today {
        let filename = frontend_log_filename(&today);
        let path = state.logs_dir.join(&filename);
        match OpenOptions::new().create(true).append(true).open(&path) {
            Ok(new_file) => {
                if let Ok(mut file) = state.file.lock() {
                    *file = new_file;
                }
                *current_date = today;
            }
            Err(e) => {
                tracing::warn!(error = %e, path = %path.display(), "Failed to rotate frontend log file");
            }
        }
    }

    if let Ok(mut file) = state.file.lock() {
        let _ = writeln!(file, "{}", line);
    }
}

#[tauri::command]
fn get_backend_logs(state: tauri::State<'_, Arc<BackendLogBuffer>>) -> Vec<BackendLogEntry> {
    state.entries.lock().map(|e| e.clone()).unwrap_or_default()
}

#[tauri::command]
fn get_sql_queries(state: tauri::State<'_, Arc<SqlQueryLog>>) -> Vec<SqlQueryEntry> {
    state.entries.lock().map(|e| e.clone()).unwrap_or_default()
}

#[tauri::command]
fn toggle_minimize_to_tray(app: tauri::AppHandle, state: tauri::State<'_, MinimizeToTrayState>, enabled: bool) {
    state.enabled.store(enabled, Ordering::SeqCst);
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_visible(enabled);
    }
    tracing::info!(target: "tray", enabled, "minimizeToTray setting toggled");
}
