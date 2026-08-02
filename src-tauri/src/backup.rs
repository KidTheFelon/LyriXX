use rusqlite::Connection;
use serde::{Deserialize, Serialize};

use crate::datetime;
use crate::db_init::{get_backup_dir, get_db_path};

const DEFAULT_MAX_BACKUPS: usize = 10;

const SETTINGS_KEY: &str = "lyrixx_settings";

fn load_app_setting<T: serde::de::DeserializeOwned>(conn: &Connection, field: &str) -> Option<T> {
    let raw: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = ?1",
            rusqlite::params![SETTINGS_KEY],
            |row| row.get(0),
        )
        .ok()?;
    let obj: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let val = obj.get(field)?;
    serde_json::from_value(val.clone()).ok()
}

fn load_max_backups_setting(conn: &Connection) -> usize {
    load_app_setting::<usize>(conn, "maxBackups").unwrap_or(DEFAULT_MAX_BACKUPS)
}

/// Создаёт резервную копию БД, если автобэкап включён в настройках.
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
    let dt = datetime::backup_timestamp(now);
    let filename = format!("lyrixx_{}.db", dt);
    let dest = backups_dir.join(&filename);

    if let Err(e) = std::fs::copy(&path, &dest) {
        tracing::warn!(error = %e, dest = %dest.display(), "auto_backup: copy failed");
        return;
    }
    tracing::info!(dest = %dest.display(), "auto_backup: created");

    rotate_backups(&backups_dir, max_backups);
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

/// Информация о резервной копии.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    /// Имя файла.
    pub filename: String,
    /// Размер в КБ.
    pub size_kb: f64,
    /// Timestamp создания.
    pub timestamp: String,
}

#[tauri::command]
/// Возвращает список всех резервных копий.
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
/// Удаляет резервную копию по имени файла.
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
/// Восстанавливает БД из резервной копии.
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

/// Информация о восстановлении БД.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryInfo {
    /// Была ли автоматическая рекавери при запуске.
    pub was_recovered: bool,
    /// Доступные резервные копии.
    pub backups: Vec<BackupInfo>,
}

#[tauri::command]
/// Проверяет статус рекавери и возвращает список доступных бэкапов.
pub fn check_db_recovery(state: tauri::State<'_, crate::db::DbState>) -> Result<RecoveryInfo, String> {
    let was_recovered = state.was_recovered;
    let backups = list_backups()?;
    tracing::info!(was_recovered, backups_count = backups.len(), "check_db_recovery");
    Ok(RecoveryInfo { was_recovered, backups })
}
