// Theme toggler (Dark/Light) — drop-in helper
export function initThemeToggle({storageKey = 'ui.theme'} = {}) {
  const preferred = localStorage.getItem(storageKey);
  if (preferred) {
    document.documentElement.setAttribute('data-theme', preferred);
  } else {
    // Default to dark theme (Alpine Graphite Neon is primarily dark)
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem(storageKey, 'dark');
  }
  
  return function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    
    // Set the data-theme attribute properly
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(storageKey, next);
    
    return next;
  };
}
