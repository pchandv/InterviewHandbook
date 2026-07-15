/* ═══════════════════════════════════════════════════════════════════
   APP.JS — Main Application Controller
   Interview Preparation Handbook
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const App = (() => {
    let currentPage = 'home';
    let isInitialized = false;

    // ─── Initialize ─────────────────────────────────────────────────
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        // Render header icons
        renderHeaderIcons();

        // Initialize modules
        Theme.init();
        Navigation.init();
        Search.init();
        Progress.init();
        Bookmarks.init();
        if (typeof InterviewProgress !== 'undefined') InterviewProgress.init();
        Keyboard.init();
        ScrollSpy.init();

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-overlay')?.classList.remove('active');
            });
        });

        // Modal overlay click to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });

        // Theme toggle button
        document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());

        // Layout toggle button
        document.getElementById('layout-toggle')?.addEventListener('click', toggleNavLayout);
        
        // Restore saved layout preference
        restoreNavLayout();

        // Progress button
        document.getElementById('progress-btn')?.addEventListener('click', showProgressModal);
        
        // Bookmarks button
        document.getElementById('bookmarks-btn')?.addEventListener('click', showBookmarksModal);

        // Load initial page from hash
        const hash = window.location.hash.slice(1) || 'home';
        navigateTo(hash);

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'home';
            navigateTo(page);
        });

        console.log('[App] Interview Handbook initialized');
    }

    // ─── Render Header Icons ────────────────────────────────────────
    function renderHeaderIcons() {
        const menuBtn = document.querySelector('.icon-menu');
        if (menuBtn) menuBtn.innerHTML = Icons.menu;

        const brandIcon = document.querySelector('.brand-icon');
        if (brandIcon) brandIcon.innerHTML = Icons.code;

        const searchIcon = document.querySelector('.search-icon');
        if (searchIcon) searchIcon.innerHTML = Icons.search;

        const themeIcon = document.querySelector('.icon-theme');
        if (themeIcon) themeIcon.innerHTML = Icons.moon;

        const progressIcon = document.querySelector('.icon-progress');
        if (progressIcon) progressIcon.innerHTML = Icons.trendingUp;

        const bookmarksIcon = document.querySelector('.icon-bookmarks');
        if (bookmarksIcon) bookmarksIcon.innerHTML = Icons.bookmark;

        const layoutIcon = document.querySelector('.icon-layout');
        if (layoutIcon) layoutIcon.innerHTML = Icons.grid || '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';
    }

    // ─── Nav Layout Toggle ──────────────────────────────────────────
    function toggleNavLayout() {
        const shell = document.querySelector('.app-shell');
        const isTopNav = shell.classList.toggle('top-nav-mode');
        localStorage.setItem('ih-nav-layout', isTopNav ? 'top' : 'sidebar');
        updateLayoutIcon(isTopNav);
    }

    function restoreNavLayout() {
        const saved = localStorage.getItem('ih-nav-layout');
        if (saved === 'top') {
            document.querySelector('.app-shell')?.classList.add('top-nav-mode');
            updateLayoutIcon(true);
        }
    }

    function updateLayoutIcon(isTopNav) {
        const layoutIcon = document.querySelector('.icon-layout');
        if (!layoutIcon) return;
        if (isTopNav) {
            // Show sidebar icon (switch back to sidebar)
            layoutIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>';
            layoutIcon.closest('button').setAttribute('data-tooltip', 'Switch to sidebar');
        } else {
            // Show horizontal icon (switch to top nav)
            layoutIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>';
            layoutIcon.closest('button').setAttribute('data-tooltip', 'Switch to top nav');
        }
    }

    // ─── Navigation ─────────────────────────────────────────────────
    async function navigateTo(pageId) {
        currentPage = pageId;
        
        // Update active sidebar item
        Navigation.setActive(pageId);
        
        // Load page content
        await PageLoader.load(pageId);
        
        // Update breadcrumb
        Breadcrumb.update(pageId);
        
        // Scroll to top
        document.querySelector('.main-content')?.scrollTo(0, 0);
        window.scrollTo(0, 0);
        
        // Close mobile sidebar
        document.querySelector('.app-shell')?.classList.remove('sidebar-open');
    }

    // ─── Progress Modal ─────────────────────────────────────────────
    function showProgressModal() {
        const overlay = document.getElementById('progress-modal');
        if (!overlay) return;
        
        const body = overlay.querySelector('.modal-body');
        const readiness = Progress.getReadinessPercent();
        const completed = Progress.getCompletedCount();
        const total = Progress.getTotalTopics();
        
        body.innerHTML = `
            <div style="text-align: center; margin-bottom: var(--space-xl);">
                <div style="font-size: var(--font-size-4xl); font-weight: bold; color: var(--brand-primary);">${readiness}%</div>
                <div style="color: var(--text-secondary);">Interview Readiness</div>
                <div class="progress-bar" style="margin-top: var(--space-md);"><div class="progress-fill" style="width: ${readiness}%"></div></div>
            </div>
            <table style="width: 100%;">
                <tr><td>Topics Completed</td><td style="text-align:right; font-weight:600;">${completed} / ${total}</td></tr>
                <tr><td>Questions Available</td><td style="text-align:right; font-weight:600;">${PageData.getQuestionCount()}</td></tr>
                <tr><td>Bookmarks</td><td style="text-align:right; font-weight:600;">${Bookmarks.getCount()}</td></tr>
            </table>
            <div style="margin-top: var(--space-xl); text-align: center;">
                <button class="btn btn-secondary btn-sm" onclick="if(confirm('Reset all progress?')) { Progress.reset(); Bookmarks.clear(); location.reload(); }">Reset Progress</button>
            </div>
        `;
        
        overlay.classList.add('active');
    }

    // ─── Bookmarks Modal ────────────────────────────────────────────
    function showBookmarksModal() {
        const overlay = document.getElementById('bookmarks-modal');
        if (!overlay) return;
        
        const body = overlay.querySelector('.modal-body');
        const bookmarks = Bookmarks.getAll();
        
        if (bookmarks.length === 0) {
            body.innerHTML = `<p style="text-align:center; color: var(--text-tertiary);">No bookmarks yet. Click the bookmark button on any topic to save it here.</p>`;
        } else {
            body.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
                    ${bookmarks.map(b => `
                        <a href="#${b.id}" class="card" style="padding: var(--space-md); text-decoration: none;" onclick="document.getElementById('bookmarks-modal').classList.remove('active');">
                            <div style="font-weight: 500;">${b.title}</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">${b.section}</div>
                        </a>
                    `).join('')}
                </div>
            `;
        }
        
        overlay.classList.add('active');
    }

    // ─── Public API ─────────────────────────────────────────────────
    return {
        init,
        navigateTo,
        getCurrentPage: () => currentPage
    };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
