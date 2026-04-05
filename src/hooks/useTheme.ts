import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'kb-theme';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedPreference(): Theme | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'dark' || saved === 'light' ? saved : null;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useTheme() {
  // null = no explicit user preference (follow system)
  const [userPreference, setUserPreference] = useState<Theme | null>(() => {
    if (typeof window === 'undefined') return null;
    return getSavedPreference();
  });

  const [systemTheme, setSystemTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return getSystemTheme();
  });

  // Resolved theme: explicit user preference takes priority, else follow system
  const theme: Theme = userPreference ?? systemTheme;

  // Apply the resolved theme class to <html> whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes (only when user has no explicit preference)
  useEffect(() => {
    if (userPreference !== null) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [userPreference]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setUserPreference(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [theme]);

  return { theme, toggleTheme };
}
