export function getSavedTheme(userId) {
  const userKey = userId ? `tb-ui-theme:${userId}` : 'tb-ui-theme:default';
  const stored = localStorage.getItem(userKey) || localStorage.getItem('tb-ui-theme');
  return stored === 'light' ? 'light' : 'dark';
}

export function saveTheme(theme, userId) {
  const userKey = userId ? `tb-ui-theme:${userId}` : 'tb-ui-theme:default';
  localStorage.setItem(userKey, theme);
  localStorage.setItem('tb-ui-theme', theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent('tb-theme-change', { detail: theme }));
}
