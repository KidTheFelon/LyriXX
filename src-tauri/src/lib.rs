mod backup;
mod db;
mod db_init;
mod datetime;
mod english_rhyme;
mod fonts;
mod lang_detect;
mod logging;
mod rhyme;
mod tray;
#[cfg(target_os = "windows")]
mod mica;

use std::fs::OpenOptions;
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::Listener;
use tauri::Manager;
#[cfg(target_os = "windows")]
use windows::core::Interface;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_OK, MB_ICONERROR};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::Layer as _;

use crate::logging::{
    BackendLogBuffer, LogFileState, LogLayer, MinimizeToTrayState, SqlQueryLog, frontend_log_filename,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let logs_dir = get_logs_dir();

    let backend_buffer = Arc::new(BackendLogBuffer {
        entries: std::sync::Mutex::new(Vec::new()),
    });
    let sql_query_log = Arc::new(SqlQueryLog::new());

    let file_appender = tracing_appender::rolling::daily(&logs_dir, "lyrixx.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    std::mem::forget(_guard);

    let buffer_clone = backend_buffer.clone();
    let log_layer = LogLayer::new(buffer_clone)
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
        datetime::format_date_yyyy_mm_dd(now)
    };
    let log_filename = frontend_log_filename(&today);
    let log_path = logs_dir.join(&log_filename);
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .unwrap_or_else(|e| {
            tracing::warn!(error = %e, path = %log_path.display(), "Failed to open frontend log file, creating new");
            std::fs::File::create(&log_path).expect("Cannot create log file")
        });

    let db_state = match db_init::init() {
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
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
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

            tray::splash_status(&handle, "db");

            {
                let db_state: tauri::State<'_, db::DbState> = handle.state();
                let conn = db_state.db.lock().unwrap();
                backup::auto_backup(&conn);
            }

            tray::splash_status(&handle, "backup");

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

            tray::splash_status(&handle, "config");

            if let Some(theme) = &initial_theme {
                if let Some(splash) = handle.get_webview_window("splash") {
                    if let Err(e) = splash.eval(&format!("window.__setTheme('{}')", theme)) {
                        tracing::warn!(error = %e, theme, "Failed to set theme on splash via eval");
                    }
                }
            }

            tray::splash_status(&handle, "plugins");

            let fe = frontend_ready.clone();
            let be = backend_ready.clone();
            let h1 = handle.clone();
            handle.listen("app-ready", move |_event| {
                tray::splash_status(&h1, "frontend");
                fe.store(true, Ordering::SeqCst);
                if be.load(Ordering::SeqCst) {
                    tray::transition_to_main(&h1);
                }
            });

            tray::splash_status(&handle, "rhymes");

            let rs = rhyme_state.clone();
            let fe2 = frontend_ready.clone();
            let be2 = backend_ready.clone();
            let h2 = handle.clone();
            std::thread::spawn(move || {
                let engine = rhyme::RhymeEngine::init();
                *rs.lock().unwrap() = Some(engine);
                be2.store(true, Ordering::SeqCst);
                if fe2.load(Ordering::SeqCst) {
                    tray::transition_to_main(&h2);
                }
            });

            tray::splash_status(&handle, "tray");

            tray::setup_tray(app)?;
            tray::hide_tray_if_disabled(app, minimize_to_tray);

            if let Some(main_window) = app.get_webview_window("main") {
                tray::setup_close_intercept(&main_window, app.handle().clone());
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
            backup::list_backups,
            backup::delete_backup,
            backup::restore_backup,
            db::get_db_file_info,
            backup::check_db_recovery,
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

#[tauri::command]
fn write_frontend_log(state: tauri::State<'_, LogFileState>, line: String) {
    let today = {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        datetime::format_date_yyyy_mm_dd(now)
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
fn get_backend_logs(state: tauri::State<'_, Arc<BackendLogBuffer>>) -> Vec<logging::BackendLogEntry> {
    state.entries.lock().map(|e| e.clone()).unwrap_or_default()
}

#[tauri::command]
fn get_sql_queries(state: tauri::State<'_, Arc<SqlQueryLog>>) -> Vec<logging::SqlQueryEntry> {
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
