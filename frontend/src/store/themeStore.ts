import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { storage } from '../lib/storage';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const syncNativeStatusBar = async (theme: Theme) => {
  if (Capacitor.isNativePlatform()) {
    try {
      if (theme === 'dark') {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' });
      } else {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      }
    } catch {
      // Ignore if status bar is not supported on platform
    }
  }
};

const getInitialTheme = (): Theme => {
  const saved = storage.getSync('splitwise_theme') as Theme;
  if (saved === 'dark' || saved === 'light') return saved;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();

  // Apply to DOM immediately
  if (typeof document !== 'undefined') {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  syncNativeStatusBar(initialTheme);

  return {
    theme: initialTheme,
    toggleTheme: () => {
      const current = get().theme;
      const next: Theme = current === 'light' ? 'dark' : 'light';
      storage.setItem('splitwise_theme', next);

      if (typeof document !== 'undefined') {
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      syncNativeStatusBar(next);
      set({ theme: next });
    },
    setTheme: (theme: Theme) => {
      storage.setItem('splitwise_theme', theme);

      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      syncNativeStatusBar(theme);
      set({ theme });
    },
  };
});
