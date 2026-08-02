use std::sync::atomic::Ordering;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

use crate::{decode_png_to_rgba, ICON_DARK, ICON_LIGHT, logging::MinimizeToTrayState};

#[cfg(target_os = "windows")]
use windows::core::Interface;

/// Отправляет обновление статуса в splash-окно через eval.
pub fn splash_status(handle: &tauri::AppHandle, key: &str) {
    if let Some(splash) = handle.get_webview_window("splash") {
        let safe_key: String = key.chars().filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-').collect();
        if let Err(e) = splash.eval(&format!("window.__splashStatus('{}')", safe_key)) {
            tracing::warn!(error = %e, key, "Failed to update splash status via eval");
        }
    }
}

/// Уничтожает splash-окно, показывает главное окно, применяет Mica.
pub fn transition_to_main(handle: &tauri::AppHandle) {
    splash_status(handle, "ready");
    std::thread::sleep(std::time::Duration::from_millis(300));
    if let Some(splash) = handle.get_webview_window("splash") {
        let _ = splash.destroy();
    }
    if let Some(main) = handle.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            crate::mica::setup_mica(&main, None);
            if !cfg!(debug_assertions) {
                let _ = main.with_webview(|webview| {
                    unsafe {
                        let controller = webview.controller();
                        let core = match controller.CoreWebView2() {
                            Ok(c) => c,
                            Err(e) => {
                                tracing::warn!(error = %e, "Failed to get CoreWebView2 for main");
                                return;
                            }
                        };
                        let settings = match core.Settings() {
                            Ok(s) => s,
                            Err(e) => {
                                tracing::warn!(error = %e, "Failed to get WebView2 settings for main");
                                return;
                            }
                        };
                        let _ = settings.SetAreDefaultContextMenusEnabled(false);
                        let settings3: webview2_com_sys::Microsoft::Web::WebView2::Win32::ICoreWebView2Settings3 =
                            match settings.cast() {
                                Ok(s) => s,
                                Err(e) => {
                                    tracing::warn!(error = %e, "Failed to cast WebView2 settings for main");
                                    return;
                                }
                            };
                        let _ = settings3.SetAreBrowserAcceleratorKeysEnabled(false);
                    }
                });
            }
        }
        let _ = main.show();
        let _ = main.set_focus();
    }
}

/// Создаёт системную иконку в трее с меню "Показать"/"Выход".
pub fn setup_tray(app: &tauri::App, dark: bool) -> Result<(), tauri::Error> {
    let show_i = MenuItem::with_id(app, "show", "Показать", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Выход", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&show_i, &quit_i])?;

    tracing::info!("Creating system tray icon");

    let icon = tray_icon_for_theme(dark);

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
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

    Ok(())
}

/// Перехватывает закрытие окна: сворачивает в трей вместо завершения.
pub fn setup_close_intercept(main_window: &tauri::WebviewWindow, handle: tauri::AppHandle) {
    let h = handle.clone();
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

/// Прячет иконку трея при запуске, если minimizeToTray=false.
pub fn hide_tray_if_disabled(app: &tauri::App, enabled: bool) {
    if !enabled {
        if let Some(tray) = app.tray_by_id("main-tray") {
            let _ = tray.set_visible(false);
            tracing::info!(target: "tray", "Tray icon hidden on startup (minimizeToTray=false)");
        }
    }
}

pub fn tray_icon_for_theme(dark: bool) -> tauri::image::Image<'static> {
    let bytes = if dark { ICON_DARK } else { ICON_LIGHT };
    match decode_png_to_rgba(bytes) {
        Ok((rgba, w, h)) => tauri::image::Image::new_owned(rgba, w, h),
        Err(e) => {
            tracing::warn!(error = %e, dark, "Failed to decode tray icon, using default");
            tauri::image::Image::new_owned(vec![0u8; 64 * 64 * 4], 64, 64)
        }
    }
}

pub fn update_tray_icon(app: &tauri::AppHandle, dark: bool) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let icon = tray_icon_for_theme(dark);
        if let Err(e) = tray.set_icon(Some(icon)) {
            tracing::warn!(error = %e, dark, "Failed to update tray icon");
        } else {
            tracing::debug!(dark, "Tray icon updated");
        }
    }
}
