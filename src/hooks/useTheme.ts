// Re-export the useTheme hook from ThemeContext for convenience
export { useTheme, type Theme, type ThemeContextType } from '../contexts/ThemeContext';

// Additional theme-related hooks and utilities

import { useEffect, useState } from 'react';
import { useTheme as useThemeContext } from '../contexts/ThemeContext';

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect if user prefers high contrast
 */
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

/**
 * Hook to get theme-aware CSS classes
 */
export function useThemeClasses() {
  const { theme, actualTheme } = useThemeContext();

  return {
    theme,
    isDark: actualTheme === 'dark',
    themeClass: `${theme}-mode`,
    containerClass: `theme-${theme}`,
    // Utility functions for conditional classes
    when: (condition: boolean, className: string) => condition ? className : '',
    dark: (className: string) => actualTheme === 'dark' ? className : '',
    light: (className: string) => actualTheme === 'light' ? className : '',
  };
}

/**
 * Hook for theme-aware animations
 */
export function useThemeAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const { theme } = useThemeContext();

  return {
    shouldAnimate: !prefersReducedMotion,
    animationClass: (className: string) => prefersReducedMotion ? '' : className,
    transitionClass: prefersReducedMotion ? '' : 'transition-normal',
    theme,
  };
}

/**
 * Hook to manage theme persistence
 */
export function useThemePersistence() {
  const { theme, setTheme } = useThemeContext();

  const saveTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('trimbot-theme', newTheme);
  };

  const clearTheme = () => {
    localStorage.removeItem('trimbot-theme');
    // Reset to system preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemTheme);
  };

  return {
    theme,
    saveTheme,
    clearTheme,
    setTheme,
  };
}