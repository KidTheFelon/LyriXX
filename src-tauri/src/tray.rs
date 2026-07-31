use std::sync::atomic::Ordering;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

use crate::logging::MinimizeToTrayState;

#[cfg(target_os = "windows")]
use windows::core::Interface;

pub fn splash_status(handle: &tauri::AppHandle, key: &str) {
    if let Some(splash) = handle.get_webview_window("splash") {
        if let Err(e) = splash.eval(&format!("window.__splashStatus('{}')", key)) {
            tracing::warn!(error = %e, key, "Failed to update splash status via eval");
        }
    }
}

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
        let _ = main.show();
        let _ = main.set_focus();
    }
}

pub fn setup_tray(app: &tauri::App) -> Result<(), tauri::Error> {
    let show_i = MenuItem::with_id(app, "show", "Показать", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Выход", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&show_i, &quit_i])?;

    tracing::info!("Creating system tray icon");

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
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

pub fn hide_tray_if_disabled(app: &tauri::App, enabled: bool) {
    if !enabled {
        if let Some(tray) = app.tray_by_id("main-tray") {
            let _ = tray.set_visible(false);
            tracing::info!(target: "tray", "Tray icon hidden on startup (minimizeToTray=false)");
        }
    }
}
