use rusqlite::{params, Connection, types::ToSql};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;
use std::time::Instant;
use tauri::State;

use crate::SqlQueryLog;
use crate::chrono_now;

const DEFAULT_MAX_BACKUPS: usize = 10;

const SETTINGS_KEY: &str = "lyrixx_settings";

fn load_app_setting<T: serde::de::DeserializeOwned>(conn: &Connection, field: &str) -> Option<T> {
    let raw: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![SETTINGS_KEY],
            |row| row.get(0),
        )
        .ok()?;
    let obj: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let val = obj.get(field)?;
    serde_json::from_value(val.clone()).ok()
}

pub fn auto_backup(conn: &Connection) {
    let enabled: bool = load_app_setting(conn, "autoBackup").unwrap_or(true);

    if !enabled {
        tracing::debug!("auto_backup: disabled by setting");
        return;
    }

    let path = match get_db_path() {
        Ok(p) => p,
        Err(e) => {
            tracing::warn!(error = %e, "auto_backup: cannot get db path");
            return;
        }
    };

    let max_backups = load_max_backups_setting(conn);

    let backups_dir = match path.parent() {
        Some(d) => d.join("backups"),
        None => {
            tracing::warn!("auto_backup: db path has no parent");
            return;
        }
    };

    if let Err(e) = std::fs::create_dir_all(&backups_dir) {
        tracing::warn!(error = %e, "auto_backup: failed to create backups dir");
        return;
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let dt = backup_timestamp(now);
    let filename = format!("lyrixx_{}.db", dt);
    let dest = backups_dir.join(&filename);

    if let Err(e) = std::fs::copy(&path, &dest) {
        tracing::warn!(error = %e, dest = %dest.display(), "auto_backup: copy failed");
        return;
    }
    tracing::info!(dest = %dest.display(), "auto_backup: created");

    rotate_backups(&backups_dir, max_backups);
}

fn load_max_backups_setting(conn: &Connection) -> usize {
    load_app_setting::<usize>(conn, "maxBackups").unwrap_or(DEFAULT_MAX_BACKUPS)
}

fn rotate_backups(dir: &std::path::Path, max: usize) {
    let mut entries: Vec<(String, u64)> = Vec::new();

    if let Ok(rd) = std::fs::read_dir(dir) {
        for entry in rd.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("lyrixx_") && name.ends_with(".db") {
                let ts_part = name
                    .strip_prefix("lyrixx_")
                    .unwrap_or("")
                    .strip_suffix(".db")
                    .unwrap_or("");
                let numeric: String = ts_part.chars().filter(|c| c.is_ascii_digit()).collect();
                if let Ok(n) = numeric.parse::<u64>() {
                    entries.push((name, n));
                }
            }
        }
    }

    entries.sort_by(|a, b| b.1.cmp(&a.1));

    if entries.len() > max {
        for (name, _) in entries.into_iter().skip(max) {
            let path = dir.join(&name);
            if let Err(e) = std::fs::remove_file(&path) {
                tracing::warn!(error = %e, file = %name, "auto_backup: failed to remove old backup");
            } else {
                tracing::info!(file = %name, "auto_backup: rotated old backup");
            }
        }
    }
}

fn backup_timestamp(secs: u64) -> String {
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

    format!(
        "{:04}{:02}{:02}_{:02}{:02}{:02}",
        year, month, day, hours, minutes, seconds
    )
}

fn is_leap(y: u32) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

pub fn get_backup_dir() -> Result<PathBuf, String> {
    let path = get_db_path()?;
    Ok(path
        .parent()
        .ok_or_else(|| "db path has no parent".to_string())?
        .join("backups"))
}

pub struct DbState {
    pub db: Mutex<Connection>,
    pub was_recovered: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongRecord {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub lyrics: String,
    pub category: String,
    pub pinned: bool,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryRecord {
    pub id: String,
    pub label: String,
    pub icon: String,
}

const LATEST_VERSION: i32 = 1;

fn get_db_path() -> Result<PathBuf, String> {
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

pub fn init() -> Result<DbState, String> {
    let path = get_db_path()?;
    tracing::info!(db_path = %path.display(), "Initializing database");

    match Connection::open(&path) {
        Ok(conn) => {
            match migrate(&conn) {
                Ok(()) => {
                    return Ok(DbState { db: Mutex::new(conn), was_recovered: false });
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

    let corrupted_name = format!("lyrixx_corrupted_{}.db", chrono_now());
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

    Ok(DbState { db: Mutex::new(conn), was_recovered: true })
}

fn lock_db<'a>(state: &'a State<'a, DbState>) -> std::sync::MutexGuard<'a, Connection> {
    match state.db.lock() {
        Ok(guard) => guard,
        Err(poisoned) => {
            tracing::warn!("Mutex poisoned — prior panic detected, recovering");
            poisoned.into_inner()
        }
    }
}

#[tauri::command]
pub fn load_songs(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>) -> Result<Vec<SongRecord>, String> {
    tracing::debug!("load_songs called");
    let sql = "SELECT id, title, artist, lyrics, category, pinned, created_at, updated_at FROM songs ORDER BY pinned DESC, updated_at DESC";
    let start = Instant::now();
    let conn = lock_db(&state);
    let result = conn
        .prepare(sql)
        .map_err(|e| e.to_string())
        .and_then(|mut stmt| {
            stmt.query_map([], |row| {
                Ok(SongRecord {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    artist: row.get(2)?,
                    lyrics: row.get(3)?,
                    category: row.get(4)?,
                    pinned: row.get::<_, i32>(5)? != 0,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
        });
    match &result {
        Ok(songs) => {
            log_state.log("load_songs", sql, start, true, None);
            tracing::debug!(count = songs.len(), "Songs loaded");
        }
        Err(e) => {
            log_state.log("load_songs", sql, start, false, Some(e.clone()));
        }
    }
    result
}

#[tauri::command]
pub fn save_song(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>, song: SongRecord) -> Result<(), String> {
    tracing::debug!(song_id = %song.id, title = %song.title, "save_song called");
    let sql = "INSERT INTO songs (id, title, artist, lyrics, category, pinned, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ON CONFLICT(id) DO UPDATE SET title=excluded.title, artist=excluded.artist, lyrics=excluded.lyrics, category=excluded.category, pinned=excluded.pinned, updated_at=excluded.updated_at";
    let start = Instant::now();
    let conn = lock_db(&state);
    let result = conn.execute(sql, params![song.id, song.title, song.artist, song.lyrics, song.category, song.pinned, song.created_at, song.updated_at]).map_err(|e| e.to_string());
    match &result {
        Ok(_) => {
            log_state.log("save_song", sql, start, true, None);
            tracing::debug!("Song saved");
        }
        Err(e) => {
            log_state.log("save_song", sql, start, false, Some(e.clone()));
        }
    }
    result?;
    Ok(())
}

#[tauri::command]
pub fn delete_song(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>, id: String) -> Result<(), String> {
    tracing::debug!(song_id = %id, "delete_song called");
    let sql = "DELETE FROM songs WHERE id = ?1";
    let start = Instant::now();
    let conn = lock_db(&state);
    let result = conn.execute(sql, params![id]).map_err(|e| e.to_string());
    match &result {
        Ok(_) => {
            log_state.log("delete_song", sql, start, true, None);
            tracing::debug!("Song deleted");
        }
        Err(e) => {
            log_state.log("delete_song", sql, start, false, Some(e.clone()));
        }
    }
    result?;
    Ok(())
}

#[tauri::command]
pub fn delete_songs(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>, ids: Vec<String>) -> Result<(), String> {
    if ids.is_empty() {
        return Ok(());
    }
    let placeholders: Vec<String> = ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect();
    let sql = format!("DELETE FROM songs WHERE id IN ({})", placeholders.join(", "));
    tracing::debug!(count = ids.len(), "delete_songs called");
    let start = Instant::now();
    let conn = lock_db(&state);
    let params: Vec<Box<dyn ToSql>> = ids.iter().map(|id| Box::new(id.clone()) as Box<dyn ToSql>).collect();
    let param_refs: Vec<&dyn ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let result = conn.execute(&sql, param_refs.as_slice()).map_err(|e| e.to_string());
    match &result {
        Ok(deleted) => {
            log_state.log("delete_songs", &sql, start, true, None);
            tracing::debug!(deleted, "delete_songs done");
        }
        Err(e) => {
            log_state.log("delete_songs", &sql, start, false, Some(e.clone()));
        }
    }
    result?;
    Ok(())
}

#[tauri::command]
pub fn load_categories(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>) -> Result<Vec<CategoryRecord>, String> {
    tracing::debug!("load_categories called");
    let sql = "SELECT id, label, icon FROM categories ORDER BY id";
    let start = Instant::now();
    let conn = lock_db(&state);
    let result = conn
        .prepare(sql)
        .map_err(|e| e.to_string())
        .and_then(|mut stmt| {
            stmt.query_map([], |row| {
                Ok(CategoryRecord {
                    id: row.get(0)?,
                    label: row.get(1)?,
                    icon: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
        });
    match &result {
        Ok(cats) => {
            log_state.log("load_categories", sql, start, true, None);
            tracing::debug!(count = cats.len(), "Categories loaded");
        }
        Err(e) => {
            log_state.log("load_categories", sql, start, false, Some(e.clone()));
        }
    }
    result
}

#[tauri::command]
pub fn save_category(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>, category: CategoryRecord) -> Result<(), String> {
    tracing::debug!(cat_id = %category.id, label = %category.label, "save_category called");
    let sql = "INSERT INTO categories (id, label, icon) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET label=excluded.label, icon=excluded.icon";
    let start = Instant::now();
    let conn = lock_db(&state);
    let result = conn.execute(sql, params![category.id, category.label, category.icon]).map_err(|e| e.to_string());
    match &result {
        Ok(_) => {
            log_state.log("save_category", sql, start, true, None);
            tracing::debug!("Category saved");
        }
        Err(e) => {
            log_state.log("save_category", sql, start, false, Some(e.clone()));
        }
    }
    result?;
    Ok(())
}

#[tauri::command]
pub fn delete_category(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>, id: String) -> Result<(), String> {
    tracing::debug!(cat_id = %id, "delete_category called");
    let sql_del = "DELETE FROM categories WHERE id = ?1";
    let sql_upd = "UPDATE songs SET category = '' WHERE category = ?1";
    let start = Instant::now();
    let conn = lock_db(&state);
    let r1 = conn.execute(sql_del, params![id]).map_err(|e| e.to_string());
    let r2 = conn.execute(sql_upd, params![id]).map_err(|e| e.to_string());
    if let Err(e) = &r1 {
        log_state.log("delete_category", sql_del, start, false, Some(e.clone()));
        return Err(e.clone());
    }
    if let Err(e) = &r2 {
        log_state.log("delete_category", sql_upd, start, false, Some(e.clone()));
        return Err(e.clone());
    }
    log_state.log("delete_category", "DELETE + UPDATE", start, true, None);
    tracing::debug!("Category deleted");
    Ok(())
}

#[tauri::command]
pub fn load_setting(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>, key: String) -> Result<Option<String>, String> {
    tracing::debug!(setting_key = %key, "load_setting called");
    let sql = "SELECT value FROM settings WHERE key = ?1";
    let start = Instant::now();
    let conn = lock_db(&state);
    let result = match conn.query_row(sql, params![key], |row| row.get(0)) {
        Ok(val) => Ok(Some(val)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    };
    match &result {
        Ok(_) => {
            log_state.log("load_setting", sql, start, true, None);
        }
        Err(e) => {
            log_state.log("load_setting", sql, start, false, Some(e.clone()));
        }
    }
    result
}

#[tauri::command]
pub fn save_setting(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>, key: String, value: String) -> Result<(), String> {
    let keys_count = serde_json::from_str::<serde_json::Value>(&value)
        .ok()
        .and_then(|v| v.as_object().map(|m| m.len()))
        .unwrap_or(0);
    tracing::debug!(setting_key = %key, keys_count, "save_setting called");
    let sql = "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value";
    let start = Instant::now();
    let conn = lock_db(&state);
    let result = conn.execute(sql, params![key, value]).map_err(|e| e.to_string());
    match &result {
        Ok(_) => {
            log_state.log("save_setting", sql, start, true, None);
            tracing::debug!(setting_key = %key, "Setting saved");
        }
        Err(e) => {
            log_state.log("save_setting", sql, start, false, Some(e.clone()));
        }
    }
    result?;
    Ok(())
}

#[tauri::command]
pub fn get_db_path_str() -> Result<String, String> {
    let path = get_db_path()?;
    tracing::debug!(db_path = %path.display(), "get_db_path_str called");
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn copy_file(src: String, dest: String) -> Result<(), String> {
    let src_path = std::path::Path::new(&src);
    let dest_path = std::path::Path::new(&dest);

    if src_path.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
        tracing::warn!(src = %src, "copy_file: source path traversal rejected");
        return Err("Source path contains directory traversal".to_string());
    }
    if dest_path.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
        tracing::warn!(dest = %dest, "copy_file: destination path traversal rejected");
        return Err("Destination path contains directory traversal".to_string());
    }

    tracing::info!(src = %src, dest = %dest, "copy_file called");
    std::fs::copy(src_path, dest_path).map_err(|e| {
        tracing::error!(error = %e, "File copy failed");
        format!("Failed to copy file: {}", e)
    })?;
    Ok(())
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    tracing::info!(path = %path, len = content.len(), "write_text_file called");
    std::fs::write(&path, content.as_bytes()).map_err(|e| {
        tracing::error!(error = %e, path = %path, "write_text_file failed");
        format!("Failed to write file: {}", e)
    })?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub filename: String,
    pub size_kb: f64,
    pub timestamp: String,
}

#[tauri::command]
pub fn list_backups() -> Result<Vec<BackupInfo>, String> {
    tracing::debug!("list_backups called");
    let dir = get_backup_dir().map_err(|e| {
        tracing::warn!(error = %e, "list_backups: failed to get backup dir");
        e.to_string()
    })?;
    let mut backups = Vec::new();

    if !dir.exists() {
        tracing::debug!("list_backups: backup dir does not exist, returning empty");
        return Ok(backups);
    }

    let rd = std::fs::read_dir(&dir).map_err(|e| {
        tracing::warn!(error = %e, dir = %dir.display(), "list_backups: failed to read backup dir");
        e.to_string()
    })?;
    for entry in rd.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with("lyrixx_") && name.ends_with(".db") {
            if let Ok(meta) = entry.metadata() {
                let size_kb = meta.len() as f64 / 1024.0;
                let ts_part = name
                    .strip_prefix("lyrixx_")
                    .unwrap_or("")
                    .strip_suffix(".db")
                    .unwrap_or("")
                    .to_string();
                backups.push(BackupInfo {
                    filename: name,
                    size_kb: (size_kb * 100.0).round() / 100.0,
                    timestamp: ts_part,
                });
            }
        }
    }

    backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    tracing::debug!(count = backups.len(), "list_backups: found");
    Ok(backups)
}

#[tauri::command]
pub fn delete_backup(filename: String) -> Result<(), String> {
    tracing::debug!(filename, "delete_backup called");
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        tracing::warn!(filename, "delete_backup: invalid filename rejected");
        return Err("Invalid backup filename".to_string());
    }
    let dir = get_backup_dir().map_err(|e| {
        tracing::warn!(error = %e, "delete_backup: failed to get backup dir");
        e.to_string()
    })?;
    let path = dir.join(&filename);
    if !path.exists() {
        tracing::warn!(filename, "delete_backup: backup not found");
        return Err("backup not found".to_string());
    }
    std::fs::remove_file(&path).map_err(|e| {
        tracing::warn!(error = %e, filename, "delete_backup: remove_file failed");
        e.to_string()
    })?;
    tracing::info!(file = %filename, "delete_backup: removed");
    Ok(())
}

#[tauri::command]
pub fn restore_backup(filename: String) -> Result<(), String> {
    tracing::debug!(filename, "restore_backup called");
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        tracing::warn!(filename, "restore_backup: invalid filename rejected");
        return Err("Invalid backup filename".to_string());
    }
    let dir = get_backup_dir().map_err(|e| {
        tracing::warn!(error = %e, "restore_backup: failed to get backup dir");
        e.to_string()
    })?;
    let src = dir.join(&filename);
    if !src.exists() {
        tracing::warn!(filename, "restore_backup: backup not found");
        return Err("backup not found".to_string());
    }
    let dest = get_db_path()?;
    std::fs::copy(&src, &dest).map_err(|e| {
        tracing::warn!(error = %e, filename, "restore_backup: fs::copy failed");
        format!("failed to restore: {}", e)
    })?;
    tracing::info!(file = %filename, "restore_backup: restored");
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryInfo {
    pub was_recovered: bool,
    pub backups: Vec<BackupInfo>,
}

#[tauri::command]
pub fn check_db_recovery(state: State<DbState>) -> Result<RecoveryInfo, String> {
    let was_recovered = state.was_recovered;
    let backups = list_backups()?;
    tracing::info!(was_recovered, backups_count = backups.len(), "check_db_recovery");
    Ok(RecoveryInfo { was_recovered, backups })
}

#[tauri::command]
pub fn clear_all_data(state: State<DbState>, log_state: State<'_, Arc<SqlQueryLog>>) -> Result<(), String> {
    tracing::warn!("clear_all_data called — deleting all songs and categories");
    let sql_songs = "DELETE FROM songs";
    let sql_cats = "DELETE FROM categories";
    let start = Instant::now();
    let conn = lock_db(&state);
    let songs_deleted = conn.execute(sql_songs, []).map_err(|e| {
        log_state.log("clear_all_data", sql_songs, start, false, Some(e.to_string()));
        tracing::error!(error = %e, "clear_all_data: failed to delete songs");
        e.to_string()
    })?;
    let cats_deleted = conn.execute(sql_cats, []).map_err(|e| {
        log_state.log("clear_all_data", sql_cats, start, false, Some(e.to_string()));
        tracing::error!(error = %e, "clear_all_data: failed to delete categories");
        e.to_string()
    })?;
    log_state.log("clear_all_data", "DELETE FROM songs; DELETE FROM categories", start, true, None);
    tracing::info!(songs_deleted, cats_deleted, "All songs and categories deleted");
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbFileInfo {
    pub path: String,
    pub size_bytes: u64,
    pub last_modified: String,
    pub migration_version: i32,
}

#[tauri::command]
pub fn get_db_file_info(state: State<DbState>) -> Result<DbFileInfo, String> {
    let path = get_db_path()?;
    let metadata = std::fs::metadata(&path).map_err(|e| {
        tracing::warn!(error = %e, path = %path.display(), "get_db_file_info: failed to read metadata");
        format!("failed to read db metadata: {}", e)
    })?;
    let size_bytes = metadata.len();
    let last_modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| {
            let secs = d.as_secs();
            let dt = chrono_from_epoch_debug(secs);
            format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02}", dt.0, dt.1, dt.2, dt.3, dt.4, dt.5)
        })
        .unwrap_or_else(|| "N/A".to_string());

    let conn = lock_db(&state);
    let migration_version: i32 = conn
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap_or(0);

    tracing::debug!(path = %path.display(), size_bytes, migration_version, "get_db_file_info");

    Ok(DbFileInfo {
        path: path.to_string_lossy().to_string(),
        size_bytes,
        last_modified,
        migration_version,
    })
}

fn chrono_from_epoch_debug(secs: u64) -> (u32, u32, u32, u32, u32, u32) {
    let mut days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = (time_of_day / 3600) as u32;
    let minutes = ((time_of_day % 3600) / 60) as u32;
    let seconds = (time_of_day % 60) as u32;

    let mut year = 1970u32;
    loop {
        let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        let days_in_year = if leap { 366 } else { 365 };
        if days < days_in_year as u64 {
            break;
        }
        days -= days_in_year as u64;
        year += 1;
    }

    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
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
