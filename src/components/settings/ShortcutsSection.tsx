import { AnimatedText } from "../AnimatedText";

interface Shortcut {
  keys: string;
  description: React.ReactNode;
}

interface ShortcutGroup {
  title: React.ReactNode;
  shortcuts: Shortcut[];
}

/** Вкладка отображения горячих клавиш. */
export function ShortcutsSection() {
  const groups: ShortcutGroup[] = [
    {
      title: <AnimatedText translationKey="shortcutsGeneral" />,
      shortcuts: [
        { keys: "Ctrl + N", description: <AnimatedText translationKey="shortcutsNewSong" /> },
        { keys: "Ctrl + F", description: <AnimatedText translationKey="shortcutsFocusSearch" /> },
        { keys: "Delete", description: <AnimatedText translationKey="shortcutsDeleteSong" /> },
        { keys: "Ctrl + B", description: <AnimatedText translationKey="shortcutsToggleSidebar" /> },
      ],
    },
    {
      title: <AnimatedText translationKey="shortcutsEditor" />,
      shortcuts: [
        { keys: "Ctrl + Z", description: <AnimatedText translationKey="shortcutsUndo" /> },
        { keys: "Ctrl + Y", description: <AnimatedText translationKey="shortcutsRedo" /> },
        { keys: "Ctrl + Shift + Z", description: <AnimatedText translationKey="shortcutsRedo" /> },
        { keys: "Tab", description: <AnimatedText translationKey="shortcutsIndent" /> },
        { keys: "Shift + Tab", description: <AnimatedText translationKey="shortcutsOutdent" /> },
        { keys: "Ctrl + Shift + ↑", description: <AnimatedText translationKey="shortcutsPrevSection" /> },
        { keys: "Ctrl + Shift + ↓", description: <AnimatedText translationKey="shortcutsNextSection" /> },
      ],
    },
    {
      title: <AnimatedText translationKey="shortcutsEditorNavigation" />,
      shortcuts: [
        { keys: "Home", description: <AnimatedText translationKey="shortcutsLineStart" /> },
        { keys: "End", description: <AnimatedText translationKey="shortcutsLineEnd" /> },
        { keys: "Ctrl + Home", description: <AnimatedText translationKey="shortcutsDocStart" /> },
        { keys: "Ctrl + End", description: <AnimatedText translationKey="shortcutsDocEnd" /> },
        { keys: "Ctrl + A", description: <AnimatedText translationKey="shortcutsSelectAll" /> },
      ],
    },
    {
      title: <AnimatedText translationKey="shortcutsEditorSelection" />,
      shortcuts: [
        { keys: "Shift + Arrow", description: <AnimatedText translationKey="shortcutsExtendSelection" /> },
        { keys: "Ctrl + Shift + Arrow", description: <AnimatedText translationKey="shortcutsSelectWord" /> },
        { keys: "Alt + Shift + Arrow", description: <AnimatedText translationKey="shortcutsMoveLine" /> },
      ],
    },
    {
      title: <AnimatedText translationKey="shortcutsRhymes" />,
      shortcuts: [
        { keys: "Double click", description: <AnimatedText translationKey="shortcutsRhymePopup" /> },
        { keys: "↑ / ↓", description: <AnimatedText translationKey="shortcutsRhymeNavigate" /> },
        { keys: "Enter", description: <AnimatedText translationKey="shortcutsRhymeCopy" /> },
        { keys: "Click + icon", description: <AnimatedText translationKey="shortcutsRhymeInsert" /> },
        { keys: "Escape", description: <AnimatedText translationKey="shortcutsRhymeDismiss" /> },
      ],
    },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-title"><AnimatedText translationKey="shortcuts" /></div>

      {groups.map((group, groupIndex) => (
        <div key={String(groupIndex)} className="shortcuts-group">
          <div className="shortcuts-group-title">{group.title}</div>
          <div className="shortcuts-list">
            {group.shortcuts.map((shortcut) => (
              <div key={shortcut.keys + groupIndex} className="shortcuts-row">
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
