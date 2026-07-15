/* ═══════════════════════════════════════════════════════════════════
   THEME.JS — Dark/Light Theme Manager
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const Theme = (() => {
    const STORAGE_KEY = 'ih-theme';
    let currentTheme = 'light';

    function init() {
        // Load saved theme or detect system preference
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            currentTheme = saved;
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = 'dark';
        }
        apply(currentTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                apply(e.matches ? 'dark' : 'light');
            }
        });
    }

    function apply(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        
        // Update toggle button
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
            btn.innerHTML = theme === 'dark' ? Icons.sun : Icons.moon;
        }
    }

    function toggle() {
        apply(currentTheme === 'dark' ? 'light' : 'dark');
        // Re-render Mermaid diagrams with new theme
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: currentTheme === 'dark' ? 'dark' : 'default'
            });
            try { mermaid.run({ querySelector: '.mermaid' }); } catch (e) { /* ignore */ }
        }
    }

    return { init, toggle, get: () => currentTheme };
})();
