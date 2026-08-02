use tauri::WebviewWindow;
use window_vibrancy::apply_blur;

/// Применяет Windows 11 Mica/Acrylic blur-эффект к окну.
pub fn setup_mica(window: &WebviewWindow, dark: Option<bool>) {
    match apply_blur(window, None) {
        Ok(()) => tracing::info!(dark = ?dark, "[Mica] apply_blur OK"),
        Err(e) => tracing::warn!(?e, "[Mica] apply_blur failed"),
    }
}

/// Убирает Mica/Acrylic blur-эффект с окна.
#[allow(dead_code)]
pub fn clear_mica(window: &WebviewWindow) {
    match window_vibrancy::clear_blur(window) {
        Ok(()) => tracing::info!("[Mica] clear_blur OK"),
        Err(e) => tracing::warn!(?e, "[Mica] clear_blur failed"),
    }
}
