import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initThemeToggle } from '../utils/theme-toggle.js';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('ui.theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'dark'; // Default to dark for Alpine Graphite Neon
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  // Initialize the Alpine Graphite Neon theme toggle
  const alpineToggle = initThemeToggle({ storageKey: 'ui.theme' });

  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);
      return () => mediaQuery.removeEventListener('change', updateActualTheme);
    }
  }, [theme]);

  useEffect(() => {
    // Apply Alpine Graphite Neon theme logic with proper data-theme attributes
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Store theme preference using Alpine Graphite Neon key
    localStorage.setItem('ui.theme', actualTheme);
  }, [actualTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    // Use Alpine Graphite Neon toggle logic and get the new theme
    const newTheme = alpineToggle();
    
    // Update our state to match
    setTheme(newTheme);
    setActualTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}