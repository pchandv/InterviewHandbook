/* ═══════════════════════════════════════════════════════════════════
   PAGE-DATA.JS — Central Data Registry
   All topic data modules register their content here.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const PageData = (() => {
    const registry = {};

    function register(pageId, data) {
        registry[pageId] = data;
    }

    function get(pageId) {
        return registry[pageId] || null;
    }

    async function getAsync(pageId) {
        if (registry[pageId]) return registry[pageId];
        try {
            await LazyLoader.loadPage(pageId);
        } catch (e) {
            console.warn('[PageData] Failed to load:', pageId, e.message);
        }
        return registry[pageId] || null;
    }

    function getAllQuestions() {
        const questions = [];
        Object.entries(registry).forEach(([pageId, data]) => {
            if (data.questions) {
                data.questions.forEach(q => {
                    questions.push({ ...q, topic: data.title || pageId });
                });
            }
        });
        return questions;
    }

    function getTopicCount() {
        return Object.keys(registry).length;
    }

    function getQuestionCount() {
        return getAllQuestions().length;
    }

    return { register, get, getAsync, getAllQuestions, getTopicCount, getQuestionCount };
})();
