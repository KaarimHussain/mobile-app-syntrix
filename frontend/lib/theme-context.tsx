import React, { createContext, useContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme, ThemeTokens } from '@/constants/theme';
import { storage } from './storage';
import { config } from './config';

interface ThemeContextValue {
  mode: 'light' | 'dark';
  theme: ThemeTokens;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  theme: lightTheme,
  toggle: () => {},
});

const THEME_KEY = 'prefs.theme';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(config.defaultTheme);

  useEffect(() => {
    storage.getItem(THEME_KEY).then((v: string | null) => {
      if (v === 'light' || v === 'dark') setMode(v);
    });
  }, []);

  const toggle = () => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      storage.setItem(THEME_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, theme: mode === 'dark' ? darkTheme : lightTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
