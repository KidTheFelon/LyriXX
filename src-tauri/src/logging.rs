use serde::Serialize;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

use crate::datetime;

/// Макс. количество записей в буфере логов бэкенда.
pub const MAX_BACKEND_LOGS: usize = 500;
/// Макс. количество записей в логе SQL-запросов.
pub const MAX_SQL_QUERIES: usize = 200;

/// Запись SQL-запроса.
#[derive(Clone, Serialize)]
pub struct SqlQueryEntry {
    /// Время выполнения.
    pub time: String,
    /// Имя Tauri command.
    pub command: String,
    /// SQL-запрос.
    pub sql: String,
    /// Длительность (ms).
    pub duration_ms: f64,
    /// Успешность.
    pub success: bool,
    /// Текст ошибки (если есть).
    pub error: Option<String>,
}

/// Потокобезопасный буфер логов SQL-запросов.
pub struct SqlQueryLog {
    /// Записи лога.
    pub entries: Mutex<Vec<SqlQueryEntry>>,
}

impl SqlQueryLog {
    pub fn new() -> Self {
        Self {
            entries: Mutex::new(Vec::new()),
        }
    }

    pub fn log(&self, command: &str, sql: &str, start: std::time::Instant, success: bool, error: Option<String>) {
        let entry = SqlQueryEntry {
            time: datetime::chrono_now(),
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

/// Запись лога бэкенда.
#[derive(Clone, Serialize)]
pub struct BackendLogEntry {
    /// Время (HH:MM:SS.mmm).
    pub time: String,
    /// Уровень (debug/info/warn/error).
    pub level: String,
    /// Тег модуля.
    pub target: String,
    /// Текст сообщения.
    pub message: String,
}

/// Потокобезопасный буфер логов бэкенда.
pub struct BackendLogBuffer {
    /// Записи лога.
    pub entries: Mutex<Vec<BackendLogEntry>>,
}

/// Глобальное состояние "свернуть в трей" (AtomicBool).
pub struct MinimizeToTrayState {
    /// Включено ли сворачивание в трей.
    pub enabled: AtomicBool,
}

/// Состояние файла лога фронтенда + ротация.
pub struct LogFileState {
    /// Файл лога.
    pub file: Mutex<std::fs::File>,
    /// Папка логов.
    pub logs_dir: std::path::PathBuf,
/// Текущая дата лог-файла (для ротации).
    pub current_date: Mutex<String>,
}

/// tracing_subscriber Layer, перехватывающий логи в BackendLogBuffer.
pub struct LogLayer {
    buffer: Arc<BackendLogBuffer>,
}

impl LogLayer {
    pub fn new(buffer: Arc<BackendLogBuffer>) -> Self {
        Self { buffer }
    }
}

impl<S: tracing::Subscriber> tracing_subscriber::Layer<S> for LogLayer {
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

        let time = datetime::chrono_now();

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

/// Формирует имя файла лога фронтенда: lyrixx.frontend.{date}.log.
pub fn frontend_log_filename(date: &str) -> String {
    format!("lyrixx.frontend.{}.log", date)
}
