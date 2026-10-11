(() => {
  const key = 'revision-studio-theme';
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = dark => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; };
  apply(preference === 'dark' || (preference !== 'light' && system.matches));
  window.revisionTheme = {
    isDark: () => document.documentElement.dataset.theme === 'dark',
    toggle() {
      preference = this.isDark() ? 'light' : 'dark';
      apply(preference === 'dark');
      try { localStorage.setItem(key, preference); } catch {}
    }
  };
  system.addEventListener('change', e => {
    if (preference !== 'dark' && preference !== 'light') {
      apply(e.matches);
      document.querySelectorAll('.theme-toggle').forEach(el => el.setAttribute('aria-pressed', String(e.matches)));
    }
  });
})();
