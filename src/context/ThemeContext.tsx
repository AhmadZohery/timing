import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemePaletteId } from '../types';

export type Theme = 'light' | 'dark';

export const PALETTE_CONFIGS: Record<
  ThemePaletteId,
  {
    id: ThemePaletteId;
    nameAr: string;
    nameEn: string;
    badge: string;
    primaryColor: string;
    bgPreview: string;
    descAr: string;
  }
> = {
  obsidian_gold: {
    id: 'obsidian_gold',
    nameAr: 'ذهب الأوبسيديان الملكي',
    nameEn: 'Obsidian Noir & Champagne Gold',
    badge: '👑 الفخامة المطلقة',
    primaryColor: '#d4af37',
    bgPreview: 'from-[#08090d] via-[#10121a] to-[#181c28]',
    descAr: 'أسطح مخملية داكنة مع بريق الذهب الشمبانيا عيار 24 لإحساس ملكي رفيع.',
  },
  damascus_sand: {
    id: 'damascus_sand',
    nameAr: 'الزمرد الدمشقي والرمل العتيق',
    nameEn: 'Damascus Emerald & Warm Sand',
    badge: '🌿 الدفء الإيماني',
    primaryColor: '#166534',
    bgPreview: 'from-[#faf7f2] via-[#f4eee4] to-[#e8ded0]',
    descAr: 'ورق كتاني دافئ مع زمرد صنوبري عتيق يبعث على السكينة والوقار.',
  },
  cosmic_titanium: {
    id: 'cosmic_titanium',
    nameAr: 'تيتانيوم الفضاء الأبل برو',
    nameEn: 'Cosmic Titanium Pro',
    badge: '🪐 التقنية العالية',
    primaryColor: '#0ea5e9',
    bgPreview: 'from-[#030712] via-[#090e1a] to-[#111827]',
    descAr: 'شيد معدني فضائي بلمسات أزور زرقاء فائقة الدقة لتركيز خالٍ من التشتت.',
  },
  nordic_slate: {
    id: 'nordic_slate',
    nameAr: 'الصلصال الشمالي النقي',
    nameEn: 'Nordic Slate Minimalist',
    badge: '❄️ صفاء أحادي',
    primaryColor: '#475569',
    bgPreview: 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
    descAr: 'هدوء رمادي مونوكروم خالص يزيل أي ضجيج بصري عن المحتوى الأساسي.',
  },
};

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
