use rusqlite::Connection;
use std::path::PathBuf;

use crate::datetime;

/// Текущая версия схемы БД.
pub const LATEST_VERSION: i32 = 1;

/// Определяет путь к БД: data/ рядом с exe или AppData fallback.
pub fn get_db_path() -> Result<PathBuf, String> {
    let exe =
        std::env::current_exe().map_err(|e| {
            tracing::warn!(error = %e, "get_db_path: failed to get exe path");
            format!("failed to get exe path: {}", e)
        })?;
    let exe_dir = exe
        .parent()
        .ok_or_else(|| "exe path has no parent directory".to_string())?
        .join("data");

    if std::fs::create_dir_all(&exe_dir).is_ok() && is_writable(&exe_dir) {
        tracing::debug!(path = %exe_dir.display(), "Using exe-adjacent data directory");
        return Ok(exe_dir.join("lyrixx.db"));
    }

    let appdata = dirs_fallback()?;
    let fallback_dir = appdata.join("data");
    std::fs::create_dir_all(&fallback_dir)
        .map_err(|e| format!("failed to create fallback data directory at {}: {}", fallback_dir.display(), e))?;
    tracing::warn!(
        exe_dir = %exe_dir.display(),
        fallback = %fallback_dir.display(),
        "Exe directory not writable, using appdata fallback"
    );
    Ok(fallback_dir.join("lyrixx.db"))
}

/// Возвращает папку для резервных копий (рядом с БД).
pub fn get_backup_dir() -> Result<PathBuf, String> {
    let path = get_db_path()?;
    Ok(path
        .parent()
        .ok_or_else(|| "db path has no parent".to_string())?
        .join("backups"))
}

fn is_writable(dir: &std::path::Path) -> bool {
    let test_file = dir.join(".write_test");
    match std::fs::OpenOptions::new().create(true).write(true).open(&test_file) {
        Ok(_) => {
            let _ = std::fs::remove_file(&test_file);
            true
        }
        Err(_) => false,
    }
}

fn dirs_fallback() -> Result<PathBuf, String> {
    if let Ok(appdata) = std::env::var("APPDATA") {
        return Ok(PathBuf::from(appdata).join("LyriXX"));
    }
    if let Ok(home) = std::env::var("HOME") {
        return Ok(PathBuf::from(home).join(".lyrixx"));
    }
    Err("cannot determine home directory".to_string())
}

fn migrate(conn: &Connection) -> Result<(), String> {
    let current: i32 = conn
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap_or(0);

    tracing::info!(current_version = current, latest_version = LATEST_VERSION, "DB migration check");

    if current < 1 {
        tracing::info!("Migrating DB: v0 -> v1");

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                artist TEXT NOT NULL DEFAULT '',
                lyrics TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT '',
                pinned INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY NOT NULL,
                label TEXT NOT NULL,
                icon TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );
        ",
        )
        .map_err(|e| {
            tracing::error!(error = %e, "migrate: failed to create tables v1");
            format!("failed to create tables v1: {}", e)
        })?;

        conn.execute("ALTER TABLE songs ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0", [])
            .ok();

        conn.pragma_update(None, "user_version", 1)
            .map_err(|e| {
                tracing::error!(error = %e, "migrate: failed to set user_version");
                format!("failed to set user_version: {}", e)
            })?;
    }
    Ok(())
}

use crate::db::DbState;

/// Инициализация БД: открытие, миграция схемы, рекавери при повреждении.
pub fn init() -> Result<DbState, String> {
    let path = get_db_path()?;
    tracing::info!(db_path = %path.display(), "Initializing database");

    match Connection::open(&path) {
        Ok(conn) => {
            match migrate(&conn) {
                Ok(()) => {
                    return Ok(DbState { db: std::sync::Mutex::new(conn), was_recovered: false });
                }
                Err(e) => {
                    tracing::error!(error = %e, "DB migration failed — attempting recovery");
                }
            }
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to open DB — attempting recovery");
        }
    }

    let corrupted_name = format!("lyrixx_corrupted_{}.db", datetime::chrono_now());
    let parent = path.parent().ok_or("db path has no parent")?;
    let corrupted_path = parent.join(&corrupted_name);
    if let Err(e) = std::fs::rename(&path, &corrupted_path) {
        tracing::warn!(error = %e, "Failed to rename corrupted DB, deleting");
        let _ = std::fs::remove_file(&path);
    } else {
        tracing::info!(dest = %corrupted_path.display(), "Corrupted DB renamed");
    }

    let conn = Connection::open(&path)
        .map_err(|e| format!("failed to create fresh db: {}", e))?;
    migrate(&conn)?;
    tracing::info!("Fresh DB created after corruption recovery");

    Ok(DbState { db: std::sync::Mutex::new(conn), was_recovered: true })
}
