use tauri::WebviewWindow;
use window_vibrancy::apply_blur;

pub fn setup_mica(window: &WebviewWindow, dark: Option<bool>) {
    match apply_blur(window, None) {
        Ok(()) => tracing::info!(dark = ?dark, "[Mica] apply_blur OK"),
        Err(e) => tracing::warn!(?e, "[Mica] apply_blur failed"),
    }
}

pub fn clear_mica(window: &WebviewWindow) {
    match window_vibrancy::clear_blur(window) {
        Ok(()) => tracing::info!("[Mica] clear_blur OK"),
        Err(e) => tracing::warn!(?e, "[Mica] clear_blur failed"),
    }
}
