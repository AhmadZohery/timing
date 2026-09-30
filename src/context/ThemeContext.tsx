import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemePaletteId } from '../types';

import { PALETTE_CONFIGS, type PaletteConfig } from '../constants/themePalettes';

export type Theme = 'light' | 'dark';
export { PALETTE_CONFIGS, type PaletteConfig };

interface ThemeContextType {
  theme: Theme;
  palette: ThemePaletteId;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: ThemePaletteId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('midmar_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [palette, setPaletteState] = useState<ThemePaletteId>(() => {
    const saved = localStorage.getItem('midmar_palette') as ThemePaletteId;
    return saved && PALETTE_CONFIGS[saved] ? saved : 'obsidian_gold';
  });

  useEffect(() => {
    localStorage.setItem('midmar_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('midmar_palette', palette);
    // Remove previous palette classes
    Object.keys(PALETTE_CONFIGS).forEach((p) => {
      document.documentElement.classList.remove(`palette-${p}`);
    });
    // Add active palette class
    document.documentElement.classList.add(`palette-${palette}`);
    document.documentElement.setAttribute('data-palette', palette);
  }, [palette]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setPalette = (p: ThemePaletteId) => {
    setPaletteState(p);
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
