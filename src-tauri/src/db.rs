use rusqlite::{params, Connection, types::ToSql};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::State;

use crate::datetime;
use crate::db_init::get_db_path;
use crate::logging::SqlQueryLog;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbFileInfo {
    pub path: String,
    pub size_bytes: u64,
    pub last_modified: String,
    pub migration_version: i32,
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
            datetime::format_datetime_display(secs)
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
