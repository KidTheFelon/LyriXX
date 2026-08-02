use serde::Serialize;

/// Списки шрифтов: системные + пользовательские.
#[derive(Serialize)]
pub struct FontLists {
    /// Системные шрифты (HKLM).
    pub system: Vec<String>,
    /// Пользовательские шрифты (HKCU).
    pub custom: Vec<String>,
}

fn strip_suffix(name: &str) -> String {
    name.trim_end_matches(" (TrueType)")
        .trim_end_matches(" (OpenType)")
        .trim_end_matches(" (Type1)")
        .to_string()
}

#[tauri::command]
/// Перечисляет системные шрифты из реестра Windows.
pub fn get_system_fonts() -> FontLists {
    tracing::debug!("get_system_fonts called");
    #[cfg(target_os = "windows")]
    {
        use std::collections::BTreeSet;
        use winreg::enums::*;
        use winreg::RegKey;

        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let hku = RegKey::predef(HKEY_CURRENT_USER);

        let mut system_names = BTreeSet::new();
        let mut custom_names = BTreeSet::new();

        let fonts_path = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts";

        if let Ok(key) = hklm.open_subkey_with_flags(fonts_path, KEY_READ) {
            for item in key.enum_values().flatten() {
                let name = strip_suffix(&item.0);
                if !name.is_empty() {
                    system_names.insert(name);
                }
            }
        } else {
            tracing::warn!("get_system_fonts: failed to open HKLM fonts key");
        }

        if let Ok(key) = hku.open_subkey_with_flags(fonts_path, KEY_READ) {
            for item in key.enum_values().flatten() {
                let name = strip_suffix(&item.0);
                if !name.is_empty() {
                    custom_names.insert(name);
                }
            }
        } else {
            tracing::warn!("get_system_fonts: failed to open HKCU fonts key");
        }

        let custom_clone: BTreeSet<String> = custom_names.clone();

        let system: Vec<String> = system_names
            .into_iter()
            .filter(|n| !custom_clone.contains(n))
            .collect();

        let custom: Vec<String> = custom_names.into_iter().collect();

        tracing::debug!(system_count = system.len(), custom_count = custom.len(), "get_system_fonts: done");
        FontLists { system, custom }
    }

    #[cfg(not(target_os = "windows"))]
    {
        FontLists {
            system: vec![],
            custom: vec![],
        }
    }
}
