import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;
}

// Custom Safe Storage Implementation to prevent "Access to storage is not allowed" errors
const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      // Check for window existence and property access safety
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(name);
      }
    } catch (e) {
      // Return null if storage is blocked (e.g., privacy settings)
      return null;
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(name, value);
      }
    } catch (e) {
      // Silently ignore save errors
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(name);
      }
    } catch (e) {
      // Silently ignore remove errors
    }
  },
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'moodpaper-storage',
      // Use the custom safe storage adapter
      storage: createJSONStorage(() => safeLocalStorage),
      // Ensure hydration doesn't block rendering
      skipHydration: false,
    }
  )
);