import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={16} />;
      case 'dark':
        return <Moon size={16} />;
      case 'system':
        return <Monitor size={16} />;
      default:
        return <Sun size={16} />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return `System (${actualTheme})`;
      default:
        return 'Light mode';
    }
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Current: ${getLabel()}. Click to cycle themes.`}
      aria-label={`Switch theme. Current: ${getLabel()}`}
    >
      <span className="theme-toggle__icon">
        {getIcon()}
      </span>
      <span className="theme-toggle__label">
        {getLabel()}
      </span>
    </button>
  );
}