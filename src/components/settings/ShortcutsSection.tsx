import { useTranslation } from "@/i18n";

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

export function ShortcutsSection() {
  const { t } = useTranslation();

  const groups: ShortcutGroup[] = [
    {
      title: t("shortcutsGeneral"),
      shortcuts: [
        { keys: "Ctrl + N", description: t("shortcutsNewSong") },
        { keys: "Ctrl + F", description: t("shortcutsFocusSearch") },
        { keys: "Delete", description: t("shortcutsDeleteSong") },
        { keys: "Ctrl + B", description: t("shortcutsToggleSidebar") },
      ],
    },
    {
      title: t("shortcutsEditor"),
      shortcuts: [
        { keys: "Ctrl + Z", description: t("shortcutsUndo") },
        { keys: "Ctrl + Y", description: t("shortcutsRedo") },
        { keys: "Ctrl + Shift + Z", description: t("shortcutsRedo") },
        { keys: "Tab", description: t("shortcutsIndent") },
        { keys: "Shift + Tab", description: t("shortcutsOutdent") },
        { keys: "Ctrl + Shift + ↑", description: t("shortcutsPrevSection") },
        { keys: "Ctrl + Shift + ↓", description: t("shortcutsNextSection") },
      ],
    },
    {
      title: t("shortcutsEditorNavigation"),
      shortcuts: [
        { keys: "Home", description: t("shortcutsLineStart") },
        { keys: "End", description: t("shortcutsLineEnd") },
        { keys: "Ctrl + Home", description: t("shortcutsDocStart") },
        { keys: "Ctrl + End", description: t("shortcutsDocEnd") },
        { keys: "Ctrl + A", description: t("shortcutsSelectAll") },
      ],
    },
    {
      title: t("shortcutsEditorSelection"),
      shortcuts: [
        { keys: "Shift + Arrow", description: t("shortcutsExtendSelection") },
        { keys: "Ctrl + Shift + Arrow", description: t("shortcutsSelectWord") },
        { keys: "Alt + Shift + Arrow", description: t("shortcutsMoveLine") },
      ],
    },
    {
      title: t("shortcutsRhymes"),
      shortcuts: [
        { keys: "Double click", description: t("shortcutsRhymePopup") },
        { keys: "↑ / ↓", description: t("shortcutsRhymeNavigate") },
        { keys: "Enter", description: t("shortcutsRhymeCopy") },
        { keys: "Click + icon", description: t("shortcutsRhymeInsert") },
        { keys: "Escape", description: t("shortcutsRhymeDismiss") },
      ],
    },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-title">{t("shortcuts")}</div>

      {groups.map((group) => (
        <div key={group.title} className="shortcuts-group">
          <div className="shortcuts-group-title">{group.title}</div>
          <div className="shortcuts-list">
            {group.shortcuts.map((shortcut) => (
              <div key={shortcut.keys + shortcut.description} className="shortcuts-row">
                <kbd className="shortcuts-keys">{shortcut.keys}</kbd>
                <span className="shortcuts-desc">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
