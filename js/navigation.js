/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION.JS — Sidebar Tree, Level-Based Hierarchy, Mobile
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const Navigation = (() => {
    const STORAGE_KEY = 'ih-nav-state';

    function init() {
        renderSidebar();
        bindEvents();
        restoreState();
    }

    // ─── Progress helper ────────────────────────────────────────────
    function getLevelProgress(levelNum) {
        const items = SiteMap.getLevelItems(levelNum);
        if (items.length === 0) return 0;
        const completed = items.filter(item => Progress.isCompleted(item.id)).length;
        return Math.round((completed / items.length) * 100);
    }

    // ─── Render level-based sidebar ─────────────────────────────────
    function renderSidebar() {
        const container = document.getElementById('sidebar-nav');
        if (!container) return;

        container.innerHTML = SiteMap.levels.map(level => `
            <div class="sidebar-level collapsed" data-level="${level.level}">
                <div class="sidebar-level-header" role="button" aria-expanded="false" tabindex="0">
                    <span class="level-badge">L${level.level}</span>
                    <span class="level-title">${level.title}</span>
                    <span class="level-progress">${getLevelProgress(level.level)}%</span>
                    <span class="chevron">${Icons.chevronDown}</span>
                </div>
                <div class="sidebar-level-content" role="group">
                    ${level.groups.map(group => `
                        <div class="sidebar-section collapsed" data-section="${group.id}">
                            <div class="sidebar-section-title" role="button" aria-expanded="false" tabindex="0">
                                <span>${group.title}</span>
                                <span class="chevron">${Icons.chevronRight}</span>
                            </div>
                            <div class="sidebar-items" role="group">
                                ${group.items.map(item => `
                                    <a class="sidebar-item${Progress.isCompleted(item.id) ? ' completed' : ''}" href="#${item.id}" data-page="${item.id}" title="${item.title}">
                                        <span class="item-icon">${item.icon || Icons.fileText}</span>
                                        <span class="item-label">${item.title}</span>
                                        ${Progress.isCompleted(item.id) ? `<span class="item-check">${Icons.check}</span>` : ''}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // ─── Event binding ──────────────────────────────────────────────
    function bindEvents() {
        const nav = document.getElementById('sidebar-nav');

        // Level header and section title collapse/expand + item navigation
        nav?.addEventListener('click', (e) => {
            // Level header toggle
            const levelHeader = e.target.closest('.sidebar-level-header');
            if (levelHeader) {
                const levelEl = levelHeader.closest('.sidebar-level');
                levelEl.classList.toggle('collapsed');
                const expanded = !levelEl.classList.contains('collapsed');
                levelHeader.setAttribute('aria-expanded', expanded);
                saveState();
                return;
            }

            // Group/section title toggle
            const sectionTitle = e.target.closest('.sidebar-section-title');
            if (sectionTitle) {
                const section = sectionTitle.closest('.sidebar-section');
                section.classList.toggle('collapsed');
                const expanded = !section.classList.contains('collapsed');
                sectionTitle.setAttribute('aria-expanded', expanded);
                // Update chevron direction
                const chevron = sectionTitle.querySelector('.chevron');
                if (chevron) {
                    chevron.innerHTML = expanded ? Icons.chevronDown : Icons.chevronRight;
                }
                saveState();
                return;
            }

            // Item navigation
            const item = e.target.closest('.sidebar-item');
            if (item) {
                e.preventDefault();
                const pageId = item.dataset.page;
                window.location.hash = pageId;
            }
        });

        // Keyboard nav on level headers and section titles
        nav?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target.closest('.sidebar-level-header') || e.target.closest('.sidebar-section-title');
                if (target) {
                    e.preventDefault();
                    target.click();
                }
            }
        });

        // Mobile menu toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.querySelector('.app-shell')?.classList.toggle('sidebar-open');
        });

        // Sidebar overlay click to close
        document.querySelector('.sidebar-overlay')?.addEventListener('click', () => {
            document.querySelector('.app-shell')?.classList.remove('sidebar-open');
        });

        // Toggle sidebar collapse (desktop)
        document.getElementById('sidebar-collapse-toggle')?.addEventListener('click', () => {
            document.querySelector('.app-shell')?.classList.toggle('sidebar-collapsed');
        });
    }

    // ─── Set active page & expand containing level/group ────────────
    function setActive(pageId) {
        // Remove current active
        document.querySelectorAll('.sidebar-item.active').forEach(el => el.classList.remove('active'));

        // Set new active
        const item = document.querySelector(`.sidebar-item[data-page="${pageId}"]`);
        if (item) {
            item.classList.add('active');

            // Ensure parent group (section) is expanded
            const section = item.closest('.sidebar-section');
            if (section?.classList.contains('collapsed')) {
                section.classList.remove('collapsed');
                const sectionTitle = section.querySelector('.sidebar-section-title');
                if (sectionTitle) {
                    sectionTitle.setAttribute('aria-expanded', 'true');
                    const chevron = sectionTitle.querySelector('.chevron');
                    if (chevron) chevron.innerHTML = Icons.chevronDown;
                }
            }

            // Ensure parent level is expanded
            const levelEl = item.closest('.sidebar-level');
            if (levelEl?.classList.contains('collapsed')) {
                levelEl.classList.remove('collapsed');
                const levelHeader = levelEl.querySelector('.sidebar-level-header');
                if (levelHeader) {
                    levelHeader.setAttribute('aria-expanded', 'true');
                }
            }

            // Scroll into view
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    // ─── State persistence ──────────────────────────────────────────
    function saveState() {
        const state = { expandedLevels: [], expandedGroups: [] };
        document.querySelectorAll('.sidebar-level').forEach(levelEl => {
            if (!levelEl.classList.contains('collapsed')) {
                state.expandedLevels.push(Number(levelEl.dataset.level));
            }
        });
        document.querySelectorAll('.sidebar-section').forEach(section => {
            if (!section.classList.contains('collapsed')) {
                state.expandedGroups.push(section.dataset.section);
            }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function restoreState() {
        try {
            const state = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (state && state.expandedLevels) {
                // Expand saved levels
                state.expandedLevels.forEach(levelNum => {
                    const levelEl = document.querySelector(`.sidebar-level[data-level="${levelNum}"]`);
                    if (levelEl) {
                        levelEl.classList.remove('collapsed');
                        const header = levelEl.querySelector('.sidebar-level-header');
                        if (header) header.setAttribute('aria-expanded', 'true');
                    }
                });
                // Expand saved groups
                (state.expandedGroups || []).forEach(groupId => {
                    const section = document.querySelector(`.sidebar-section[data-section="${groupId}"]`);
                    if (section) {
                        section.classList.remove('collapsed');
                        const title = section.querySelector('.sidebar-section-title');
                        if (title) {
                            title.setAttribute('aria-expanded', 'true');
                            const chevron = title.querySelector('.chevron');
                            if (chevron) chevron.innerHTML = Icons.chevronDown;
                        }
                    }
                });
            } else {
                // First visit: auto-expand the first incomplete level
                autoExpandCurrentLevel();
            }
        } catch (e) {
            // First visit or corrupt state: auto-expand current level
            autoExpandCurrentLevel();
        }
    }

    // Auto-expand the first level that isn't 100% complete
    function autoExpandCurrentLevel() {
        for (const level of SiteMap.levels) {
            const items = SiteMap.getLevelItems(level.level);
            const allComplete = items.length > 0 && items.every(item => Progress.isCompleted(item.id));
            if (!allComplete) {
                const levelEl = document.querySelector(`.sidebar-level[data-level="${level.level}"]`);
                if (levelEl) {
                    levelEl.classList.remove('collapsed');
                    const header = levelEl.querySelector('.sidebar-level-header');
                    if (header) header.setAttribute('aria-expanded', 'true');
                    // Also expand the first group within this level
                    const firstGroup = levelEl.querySelector('.sidebar-section');
                    if (firstGroup) {
                        firstGroup.classList.remove('collapsed');
                        const title = firstGroup.querySelector('.sidebar-section-title');
                        if (title) {
                            title.setAttribute('aria-expanded', 'true');
                            const chevron = title.querySelector('.chevron');
                            if (chevron) chevron.innerHTML = Icons.chevronDown;
                        }
                    }
                }
                break; // Only expand one level
            }
        }
    }

    return { init, setActive };
})();
