/// Проверяет, является ли год високосным.
pub fn is_leap(y: u32) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

/// Конвертирует epoch-секунды в кортеж (год, месяц, день, часы, минуты, секунды).
pub fn chrono_from_epoch(secs: u64) -> (u32, u32, u32, u32, u32, u32) {
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

/// Возвращает текущее время в формате "HH:MM:SS.mmm".
pub fn chrono_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let secs = (now / 1000) as u64;
    let millis = (now % 1000) as u32;
    let dt = chrono_from_epoch(secs);
    format!("{}:{:02}:{:02}.{:03}", dt.3, dt.4, dt.5, millis)
}

/// Форматирует epoch как "YYYYMMDD_HHMMSS" для имени файла бэкапа.
pub fn backup_timestamp(secs: u64) -> String {
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

/// Форматирует epoch как "YYYY-MM-DD".
pub fn format_date_yyyy_mm_dd(secs: u64) -> String {
    let dt = chrono_from_epoch(secs);
    format!("{:04}-{:02}-{:02}", dt.0, dt.1, dt.2)
}

/// Форматирует epoch как "YYYY-MM-DD HH:MM:SS".
pub fn format_datetime_display(secs: u64) -> String {
    let dt = chrono_from_epoch(secs);
    format!(
        "{:04}-{:02}-{:02} {:02}:{:02}:{:02}",
        dt.0, dt.1, dt.2, dt.3, dt.4, dt.5
    )
}
