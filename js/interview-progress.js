/* ═══════════════════════════════════════════════════════════════════
   INTERVIEW-PROGRESS.JS — Offline interview practice state
   ───────────────────────────────────────────────────────────────────
   Persists two independent, versioned localStorage slices:
     • ih-interview-status  { version, map: { [questionId]: 'known'|'review' } }
     • ih-interview-history { version, sessions: [ { date, mode, category, score, total, weakAreas } ] }

   Reads are guarded; a corrupt or older slice is migrated or reset in
   isolation without touching the other slice or unrelated keys.

   Stable question ids are derived as `${topicId}#${index}` so ratings
   key correctly without editing every question object.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const InterviewProgress = (() => {
    const STATUS_KEY = 'ih-interview-status';
    const HISTORY_KEY = 'ih-interview-history';
    const STATUS_VERSION = 1;
    const HISTORY_VERSION = 1;
    const MAX_SESSIONS = 200;

    const VALID_STATUS = new Set(['known', 'review']);

    let status = { version: STATUS_VERSION, map: {} };
    let history = { version: HISTORY_VERSION, sessions: [] };

    // ─── stable question id ─────────────────────────────────────────
    function questionId(topicId, index) {
        return `${topicId}#${index}`;
    }

    // ─── slice load/save (isolated + guarded) ───────────────────────
    function loadStatus() {
        try {
            const raw = localStorage.getItem(STATUS_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || parsed.version !== STATUS_VERSION || typeof parsed.map !== 'object') {
                // unknown/older schema → reset this slice only
                status = { version: STATUS_VERSION, map: {} };
                saveStatus();
                return;
            }
            status = { version: STATUS_VERSION, map: parsed.map || {} };
        } catch (e) {
            status = { version: STATUS_VERSION, map: {} };
        }
    }

    function saveStatus() {
        try { localStorage.setItem(STATUS_KEY, JSON.stringify(status)); } catch (e) { /* quota */ }
    }

    function loadHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || parsed.version !== HISTORY_VERSION || !Array.isArray(parsed.sessions)) {
                history = { version: HISTORY_VERSION, sessions: [] };
                saveHistory();
                return;
            }
            history = { version: HISTORY_VERSION, sessions: parsed.sessions };
        } catch (e) {
            history = { version: HISTORY_VERSION, sessions: [] };
        }
    }

    function saveHistory() {
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) { /* quota */ }
    }

    function init() {
        loadStatus();
        loadHistory();
    }

    // ─── per-question self-rating ───────────────────────────────────
    function setStatus(qId, value) {
        if (value === null || value === undefined) {
            delete status.map[qId];
        } else if (VALID_STATUS.has(value)) {
            status.map[qId] = value;
        } else {
            return;
        }
        saveStatus();
    }

    function getStatus(qId) {
        return status.map[qId] || null;
    }

    function toggleStatus(qId, value) {
        if (status.map[qId] === value) setStatus(qId, null);
        else setStatus(qId, value);
        return getStatus(qId);
    }

    function getStatusCounts() {
        let known = 0, review = 0;
        for (const v of Object.values(status.map)) {
            if (v === 'known') known++;
            else if (v === 'review') review++;
        }
        return { known, review, tracked: known + review };
    }

    function getReviewIds() {
        return Object.keys(status.map).filter(id => status.map[id] === 'review');
    }

    // ─── session history ────────────────────────────────────────────
    function recordSession(session) {
        const entry = {
            date: new Date().toISOString(),
            mode: session.mode || 'mock',
            category: session.category || 'mixed',
            score: Number.isFinite(session.score) ? session.score : 0,
            total: Number.isFinite(session.total) ? session.total : 0,
            weakAreas: Array.isArray(session.weakAreas) ? session.weakAreas.slice(0, 20) : [],
        };
        history.sessions.unshift(entry);
        if (history.sessions.length > MAX_SESSIONS) history.sessions.length = MAX_SESSIONS;
        saveHistory();
        return entry;
    }

    function getHistory(limit) {
        return limit ? history.sessions.slice(0, limit) : [...history.sessions];
    }

    function getRecentSessions(limit = 5) {
        return history.sessions.slice(0, limit);
    }

    // ─── dashboard readiness ────────────────────────────────────────
    function getReadiness() {
        const counts = getStatusCounts();
        const knownPct = counts.tracked > 0 ? Math.round((counts.known / counts.tracked) * 100) : 0;

        const recent = history.sessions.slice(0, 5);
        let avgScorePct = null;
        const scored = recent.filter(s => s.total > 0);
        if (scored.length) {
            const sum = scored.reduce((a, s) => a + (s.score / s.total), 0);
            avgScorePct = Math.round((sum / scored.length) * 100);
        }

        // aggregate weak areas across recent sessions
        const weakTally = {};
        recent.forEach(s => (s.weakAreas || []).forEach(w => { weakTally[w] = (weakTally[w] || 0) + 1; }));
        const weakAreas = Object.entries(weakTally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([area]) => area);

        return {
            known: counts.known,
            review: counts.review,
            tracked: counts.tracked,
            knownPct,
            sessionCount: history.sessions.length,
            avgScorePct,
            weakAreas,
        };
    }

    // ─── resets (per slice, never wipe unrelated keys) ──────────────
    function resetStatus() {
        status = { version: STATUS_VERSION, map: {} };
        saveStatus();
    }

    function resetHistory() {
        history = { version: HISTORY_VERSION, sessions: [] };
        saveHistory();
    }

    return {
        init, questionId,
        setStatus, getStatus, toggleStatus, getStatusCounts, getReviewIds,
        recordSession, getHistory, getRecentSessions,
        getReadiness, resetStatus, resetHistory,
    };
})();
