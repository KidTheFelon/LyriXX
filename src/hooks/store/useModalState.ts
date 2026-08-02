import { useState } from "react";

/** Хук переключателей модальных окон настроек и отладки. */
export function useModalState() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  return {
    settingsOpen,
    setSettingsOpen,
    debugOpen,
    setDebugOpen,
  };
}
