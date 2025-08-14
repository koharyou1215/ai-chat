// src/lib/themes.ts

export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
  };
}

export const defaultThemes: Theme[] = [
  {
    id: 'dark',
    name: 'ダーク',
    colors: {
      background: '#18181b',
      foreground: '#fff',
      accent: '#6366f1',
    },
  },
  {
    id: 'light',
    name: 'ライト',
    colors: {
      background: '#fff',
      foreground: '#18181b',
      accent: '#6366f1',
    },
  },
];

// THEMES alias for backward compatibility
export const THEMES = defaultThemes;

export function getDefaultTheme(): Theme {
  return defaultThemes[0];
}

export const ThemeManager = {
  applyTheme(theme: Theme, customBackground?: string | null) {
    const root = document.documentElement;
    root.style.setProperty('--theme-background', customBackground || theme.colors.background);
    root.style.setProperty('--theme-foreground', theme.colors.foreground);
    root.style.setProperty('--theme-accent', theme.colors.accent);
  },
};
