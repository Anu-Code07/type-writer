import { create } from "zustand";
import { loadSettings, saveSettings, type TypewriterSettings } from "@/lib/indexeddb";

interface SettingsState extends TypewriterSettings {
  isLoaded: boolean;
  isOptionsOpen: boolean;
  load: () => Promise<void>;
  update: (settings: Partial<TypewriterSettings>) => void;
  setOptionsOpen: (isOptionsOpen: boolean) => void;
  toggleFocusMode: () => void;
  exitFocusMode: () => void;
}

export const defaultSettings: TypewriterSettings = {
  paper: "ivory",
  font: "courier-prime",
  fontSize: 18,
  soundEnabled: true,
  mechanicalEffects: true,
  focusMode: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  isLoaded: false,
  isOptionsOpen: false,
  load: async () => {
    const storedSettings = await loadSettings();

    set({
      ...defaultSettings,
      ...storedSettings,
      focusMode: storedSettings?.focusMode ?? false,
      isLoaded: true,
    });
  },
  update: (settings) => {
    const nextSettings = {
      paper: settings.paper ?? get().paper,
      font: settings.font ?? get().font,
      fontSize: settings.fontSize ?? get().fontSize,
      soundEnabled: settings.soundEnabled ?? get().soundEnabled,
      mechanicalEffects: settings.mechanicalEffects ?? get().mechanicalEffects,
      focusMode: settings.focusMode ?? get().focusMode,
    };

    set(nextSettings);
    void saveSettings(nextSettings);
  },
  setOptionsOpen: (isOptionsOpen) => set({ isOptionsOpen }),
  toggleFocusMode: () => {
    const focusMode = !get().focusMode;
    get().update({ focusMode });
    set({ isOptionsOpen: false });
  },
  exitFocusMode: () => {
    if (get().focusMode) {
      get().update({ focusMode: false });
    }
  },
}));
