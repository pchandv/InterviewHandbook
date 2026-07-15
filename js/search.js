/* ═══════════════════════════════════════════════════════════════════
   SEARCH.JS — Command Palette Search (Ctrl+K)
   Full-text fuzzy search with recent searches, category badges,
   and rich previews. Inspired by VS Code / Raycast / Linear.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const Search = (() => {
    let searchIndex = [];
    let isOpen = false;
    let highlightedIndex = -1;
    let results = [];
    let paletteEl = null;
    const RECENT_KEY = 'ih-recent-searches';
    const MAX_RECENT = 8;

    function init() {
        buildIndex();
        createPalette();
        bindHeaderSearch();
    }

    // ─── Build search index from sitemap ────────────────────────────
    function buildIndex() {
        searchIndex = [];
        SiteMap.levels.forEach(level => {
            level.groups.forEach(group => {
                group.items.forEach(item => {
                    searchIndex.push({
                        id: item.id,
                        title: item.title,
                        section: group.title,
                        level: level.level,
                        levelTitle: level.title,
                        keywords: item.keywords || [],
                        topics: item.topics || [],
                        badge: item.badge || null,
                        icon: item.icon || null
                    });
                });
            });
        });
    }

    // ─── Create command palette DOM ─────────────────────────────────
    function createPalette() {
        if (document.getElementById('cmd-palette')) return;
        const el = document.createElement('div');
        el.id = 'cmd-palette';
        el.className = 'cmd-palette-overlay';
        el.innerHTML = `
            <div class="cmd-palette" role="dialog" aria-label="Search topics">
                <div class="cmd-palette-header">
                    <span class="cmd-palette-icon">${Icons.search}</span>
                    <input type="text" class="cmd-palette-input" placeholder="Search topics, questions, patterns..." autocomplete="off" spellcheck="false">
                    <kbd class="cmd-palette-esc">Esc</kbd>
                </div>
                <div class="cmd-palette-body">
                    <div class="cmd-palette-results" role="listbox" aria-live="polite"></div>
                </div>
            </div>
        `;
        document.body.appendChild(el);
        paletteEl = el;

        // Events
        const input = el.querySelector('.cmd-palette-input');
        input.addEventListener('input', () => onInput(input.value));
        input.addEventListener('keydown', onKeydown);
        el.addEventListener('click', (e) => {
            if (e.target === el) close();
        });
    }

    // ─── Header search binding (existing input) ─────────────────────
    function bindHeaderSearch() {
        const input = document.getElementById('search-input');
        if (!input) return;
        // Click on header search opens the palette instead
        input.addEventListener('focus', (e) => {
            e.preventDefault();
            input.blur();
            open();
        });
    }

    // ─── Open / Close ───────────────────────────────────────────────
    function open() {
        if (!paletteEl) createPalette();
        paletteEl.classList.add('active');
        isOpen = true;
        highlightedIndex = -1;
        results = [];
        const input = paletteEl.querySelector('.cmd-palette-input');
        input.value = '';
        input.focus();
        showRecent();
    }

    function close() {
        if (paletteEl) paletteEl.classList.remove('active');
        isOpen = false;
        highlightedIndex = -1;
    }

    function focusSearch() {
        open();
    }

    // ─── Input handler ──────────────────────────────────────────────
    function onInput(query) {
        query = query.trim();
        if (query.length < 1) {
            showRecent();
            return;
        }
        performSearch(query);
    }

    // ─── Keyboard navigation ────────────────────────────────────────
    function onKeydown(e) {
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, results.length - 1);
            updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && results[highlightedIndex]) {
                selectResult(results[highlightedIndex]);
            } else if (results.length > 0) {
                selectResult(results[0]);
            }
        }
    }

    // ─── Fuzzy search ───────────────────────────────────────────────
    function performSearch(query) {
        const terms = query.toLowerCase().split(/\s+/);

        results = searchIndex
            .map(item => {
                let score = 0;
                const titleLow = item.title.toLowerCase();
                const sectionLow = item.section.toLowerCase();
                const kwStr = item.keywords.join(' ').toLowerCase();
                const topicStr = item.topics.join(' ').toLowerCase();

                for (const term of terms) {
                    // Exact title match
                    if (titleLow === query.toLowerCase()) score += 50;
                    // Title starts with
                    else if (titleLow.startsWith(term)) score += 20;
                    // Title contains
                    else if (titleLow.includes(term)) score += 12;
                    // Keyword match
                    if (kwStr.includes(term)) score += 8;
                    // Sub-topics match
                    if (topicStr.includes(term)) score += 6;
                    // Section match
                    if (sectionLow.includes(term)) score += 4;
                    // Fuzzy: characters in order
                    if (score === 0 && fuzzyMatch(titleLow, term)) score += 3;
                }
                return { ...item, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);

        renderResults(query);
        highlightedIndex = results.length > 0 ? 0 : -1;
        updateHighlight();
    }

    function fuzzyMatch(text, pattern) {
        let ti = 0;
        for (let pi = 0; pi < pattern.length; pi++) {
            const ch = pattern[pi];
            while (ti < text.length && text[ti] !== ch) ti++;
            if (ti >= text.length) return false;
            ti++;
        }
        return true;
    }

    // ─── Render results ─────────────────────────────────────────────
    function renderResults(query) {
        const body = paletteEl.querySelector('.cmd-palette-results');
        if (results.length === 0) {
            body.innerHTML = `<div class="cmd-empty">No results for "${escapeHtml(query)}"</div>`;
            return;
        }

        body.innerHTML = results.map((item, idx) => `
            <div class="cmd-result" data-idx="${idx}" role="option">
                <span class="cmd-result-icon">${item.icon || Icons.fileText}</span>
                <div class="cmd-result-content">
                    <div class="cmd-result-title">${highlightText(item.title, query)}</div>
                    <div class="cmd-result-meta">
                        <span class="cmd-result-level">L${item.level}</span>
                        <span class="cmd-result-section">${item.section}</span>
                        ${item.badge ? `<span class="cmd-result-badge">${item.badge} topics</span>` : ''}
                    </div>
                </div>
                <kbd class="cmd-result-shortcut">↵</kbd>
            </div>
        `).join('');

        body.querySelectorAll('.cmd-result').forEach(el => {
            el.addEventListener('click', () => {
                selectResult(results[parseInt(el.dataset.idx)]);
            });
            el.addEventListener('mouseenter', () => {
                highlightedIndex = parseInt(el.dataset.idx);
                updateHighlight();
            });
        });
    }

    // ─── Recent searches ────────────────────────────────────────────
    function showRecent() {
        const body = paletteEl.querySelector('.cmd-palette-results');
        const recent = getRecent();
        const recentTopics = Progress.getRecentTopics().slice(0, 5);

        let html = '';
        if (recent.length > 0) {
            html += `<div class="cmd-section-label">Recent Searches</div>`;
            html += recent.map(q => `
                <div class="cmd-result cmd-recent-item" data-query="${escapeHtml(q)}">
                    <span class="cmd-result-icon">${Icons.clock}</span>
                    <div class="cmd-result-content"><div class="cmd-result-title">${escapeHtml(q)}</div></div>
                </div>
            `).join('');
        }

        if (recentTopics.length > 0) {
            html += `<div class="cmd-section-label">Recently Viewed</div>`;
            html += recentTopics.map(id => {
                const info = SiteMap.getPageInfo(id);
                if (!info) return '';
                return `
                <div class="cmd-result" data-nav="${id}">
                    <span class="cmd-result-icon">${info.icon || Icons.fileText}</span>
                    <div class="cmd-result-content">
                        <div class="cmd-result-title">${info.title}</div>
                        <div class="cmd-result-meta"><span class="cmd-result-section">${info.section}</span></div>
                    </div>
                </div>`;
            }).join('');
        }

        if (!html) {
            html = `<div class="cmd-empty">Type to search 151 topics and 1,340+ questions</div>`;
        }

        body.innerHTML = html;
        results = []; // Reset for keyboard nav

        // Bind recent search clicks
        body.querySelectorAll('.cmd-recent-item').forEach(el => {
            el.addEventListener('click', () => {
                const q = el.dataset.query;
                paletteEl.querySelector('.cmd-palette-input').value = q;
                onInput(q);
            });
        });
        body.querySelectorAll('[data-nav]').forEach(el => {
            el.addEventListener('click', () => {
                close();
                window.location.hash = el.dataset.nav;
            });
        });
    }

    function addRecent(query) {
        if (!query || query.length < 2) return;
        let recent = getRecent();
        recent = recent.filter(q => q !== query);
        recent.unshift(query);
        if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (e) {}
    }

    function getRecent() {
        try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
    }

    // ─── Select result ──────────────────────────────────────────────
    function selectResult(item) {
        addRecent(paletteEl.querySelector('.cmd-palette-input').value.trim());
        close();
        window.location.hash = item.id;
    }

    // ─── Highlight management ───────────────────────────────────────
    function updateHighlight() {
        paletteEl.querySelectorAll('.cmd-result').forEach((el, idx) => {
            el.classList.toggle('highlighted', idx === highlightedIndex);
            if (idx === highlightedIndex) el.scrollIntoView({ block: 'nearest' });
        });
    }

    // ─── Utility ────────────────────────────────────────────────────
    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    return { init, focusSearch, buildIndex, open, close };
})();
