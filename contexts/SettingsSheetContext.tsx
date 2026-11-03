import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { SettingsModal } from "@/components/SettingsModal";

interface SettingsSheetValue {
  openSettings: () => void;
}

const SettingsSheetCtx = createContext<SettingsSheetValue>({ openSettings: () => {} });

/** Hosts the settings sheet so any screen can open it (it used to be a tab). */
export function SettingsSheetProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const openSettings = useCallback(() => setVisible(true), []);
  const value = useMemo(() => ({ openSettings }), [openSettings]);
  return (
    <SettingsSheetCtx.Provider value={value}>
      {children}
      <SettingsModal visible={visible} onClose={() => setVisible(false)} />
    </SettingsSheetCtx.Provider>
  );
}

export function useSettingsSheet() {
  return useContext(SettingsSheetCtx);
}
