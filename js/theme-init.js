// Theme decision before the first paint. Load synchronously in <head> after style.css.
//
// style.css defaults to the light palette; the dark palette applies under the dark-mode class.
// Deciding this in theme-manager.js at the end of <body> paints light first and then switches.
// The stored choice (light, dark, or auto) wins; auto and missing or unknown values follow the OS.
// The key and class must match CONFIG.THEME in config.js, which loads later.
(function (global) {
  'use strict';

  var saved = null;
  try {
    saved = global.localStorage.getItem('grille-cipher-theme');
  } catch (_error) {
    saved = null;
  }

  var theme = (saved === 'light' || saved === 'dark' || saved === 'auto') ? saved : 'auto';
  var prefersDark = !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  var dark = theme === 'dark' || (theme === 'auto' && prefersDark);

  if (dark) global.document.documentElement.classList.add('dark-mode');
})(typeof window !== 'undefined' ? window : globalThis);
