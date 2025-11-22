import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',

  toggleTheme: () =>
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newMode);
      return { mode: newMode };
    }),

  setTheme: (mode: 'light' | 'dark') => {
    localStorage.setItem('theme', mode);
    set({ mode });
  },
}));