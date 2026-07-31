import { useState } from "react";

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
