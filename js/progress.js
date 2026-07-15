/* ═══════════════════════════════════════════════════════════════════
   PROGRESS.JS — Progress Tracking, Bookmarks, Favorites
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const Progress = (() => {
    const STORAGE_KEY = 'ih-progress';
    let data = { completed: {}, lastVisited: [], startDate: null };

    function init() {
        load();
        if (!data.startDate) {
            data.startDate = new Date().toISOString();
            save();
        }
    }

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) data = JSON.parse(saved);
        } catch (e) { /* ignore */ }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function markCompleted(topicId) {
        data.completed[topicId] = new Date().toISOString();
        save();
    }

    function markIncomplete(topicId) {
        delete data.completed[topicId];
        save();
    }

    function isCompleted(topicId) {
        return !!data.completed[topicId];
    }

    function getCompletedCount() {
        return Object.keys(data.completed).length;
    }

    function getTotalTopics() {
        let count = 0;
        SiteMap.levels.forEach(l => { l.groups.forEach(g => { count += g.items.length; }); });
        return count;
    }

    function getReadinessPercent() {
        const total = getTotalTopics();
        return total > 0 ? Math.round((getCompletedCount() / total) * 100) : 0;
    }

    function addVisited(pageId) {
        data.lastVisited = data.lastVisited.filter(id => id !== pageId);
        data.lastVisited.unshift(pageId);
        if (data.lastVisited.length > 10) data.lastVisited = data.lastVisited.slice(0, 10);
        save();
    }

    function getRecentTopics() {
        return data.lastVisited.slice(0, 5);
    }

    function reset() {
        data = { completed: {}, lastVisited: [], startDate: new Date().toISOString() };
        save();
    }

    return {
        init, markCompleted, markIncomplete, isCompleted,
        getCompletedCount, getTotalTopics, getReadinessPercent,
        addVisited, getRecentTopics, reset
    };
})();

// ─── Bookmarks ──────────────────────────────────────────────────────
const Bookmarks = (() => {
    const STORAGE_KEY = 'ih-bookmarks';
    let bookmarks = [];

    function init() {
        load();
    }

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) bookmarks = JSON.parse(saved);
        } catch (e) { /* ignore */ }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    }

    function toggle(questionId, title, section) {
        const idx = bookmarks.findIndex(b => b.id === questionId);
        if (idx >= 0) {
            bookmarks.splice(idx, 1);
        } else {
            bookmarks.push({ id: questionId, title, section, date: new Date().toISOString() });
        }
        save();
        return isBookmarked(questionId);
    }

    function isBookmarked(questionId) {
        return bookmarks.some(b => b.id === questionId);
    }

    function getAll() {
        return [...bookmarks];
    }

    function getCount() {
        return bookmarks.length;
    }

    function clear() {
        bookmarks = [];
        save();
    }

    return { init, toggle, isBookmarked, getAll, getCount, clear };
})();
