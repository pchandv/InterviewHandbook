/* ═══════════════════════════════════════════════════════════════════
   KEYBOARD.JS — Keyboard Navigation & Shortcuts
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const Keyboard = (() => {
    function init() {
        document.addEventListener('keydown', handleKeydown);
    }

    function handleKeydown(e) {
        // Don't intercept when typing in inputs
        if (e.target.matches('input, textarea, [contenteditable]')) {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        const ctrl = e.ctrlKey || e.metaKey;

        // Ctrl+K or / — Focus search
        if ((ctrl && e.key === 'k') || (e.key === '/' && !ctrl)) {
            e.preventDefault();
            Search.focusSearch();
            return;
        }

        // Ctrl+B — Toggle sidebar
        if (ctrl && e.key === 'b') {
            e.preventDefault();
            document.querySelector('.app-shell')?.classList.toggle('sidebar-collapsed');
            return;
        }

        // Ctrl+Shift+D — Toggle theme
        if (ctrl && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            Theme.toggle();
            return;
        }

        // ArrowLeft — Previous page
        if (e.key === 'ArrowLeft' && e.altKey) {
            e.preventDefault();
            navigatePrevNext('prev');
            return;
        }

        // ArrowRight — Next page
        if (e.key === 'ArrowRight' && e.altKey) {
            e.preventDefault();
            navigatePrevNext('next');
            return;
        }

        // ? — Show keyboard shortcuts
        if (e.key === '?' && !ctrl && !e.shiftKey) {
            e.preventDefault();
            showShortcutsModal();
            return;
        }

        // Escape — Close modals / overlays
        if (e.key === 'Escape') {
            closeModals();
            return;
        }

        // t — Scroll to top
        if (e.key === 't' && !ctrl) {
            document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    }

    function navigatePrevNext(direction) {
        const currentPage = App.getCurrentPage();
        const allPages = SiteMap.getAllPageIds();

        const currentIdx = allPages.indexOf(currentPage);
        if (currentIdx < 0) return;

        const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
        if (nextIdx >= 0 && nextIdx < allPages.length) {
            window.location.hash = allPages[nextIdx];
        }
    }

    function closeModals() {
        document.querySelectorAll('.modal-overlay.active').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector('.app-shell')?.classList.remove('sidebar-open');
    }

    function showShortcutsModal() {
        const shortcuts = [
            { key: 'Ctrl + K', action: 'Focus search' },
            { key: '/', action: 'Focus search' },
            { key: 'Ctrl + B', action: 'Toggle sidebar' },
            { key: 'Ctrl + Shift + D', action: 'Toggle theme' },
            { key: 'Alt + ←', action: 'Previous topic' },
            { key: 'Alt + →', action: 'Next topic' },
            { key: 't', action: 'Scroll to top' },
            { key: '?', action: 'Show shortcuts' },
            { key: 'Escape', action: 'Close modal / overlay' },
        ];

        const overlay = document.getElementById('shortcuts-modal');
        if (overlay) {
            const body = overlay.querySelector('.modal-body');
            body.innerHTML = `
                <table style="width: 100%">
                    <thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
                    <tbody>
                        ${shortcuts.map(s => `
                            <tr>
                                <td><kbd style="padding: 3px 8px; background: var(--bg-tertiary); border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem;">${s.key}</kbd></td>
                                <td>${s.action}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            overlay.classList.add('active');
        }
    }

    return { init };
})();
