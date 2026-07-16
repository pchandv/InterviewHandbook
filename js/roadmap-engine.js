/* ═══════════════════════════════════════════════════════════════════
   ROADMAP-ENGINE.JS — Interactive Learning Roadmap, Tracks & Career
   Renders the premium roadmap, track selector, career path, and
   experience-based recommendations. Replaces basic renderRoadmap.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const RoadmapEngine = (() => {

    // ─── State ──────────────────────────────────────────────────────
    let activeTrack = null;
    let activeExperience = null;

    function init() {
        const saved = localStorage.getItem('ih-track');
        if (saved) activeTrack = saved;
        const savedExp = localStorage.getItem('ih-experience');
        if (savedExp) activeExperience = savedExp;
    }

    // ─── Main Roadmap View ──────────────────────────────────────────
    function renderRoadmapView(container) {
        init();
        const trackData = activeTrack ? CurriculumData.getTrack(activeTrack) : null;

        container.innerHTML = `
            <div class="premium-roadmap">
                ${renderRoadmapHero()}
                ${renderExperienceSelector()}
                ${renderTrackSelector()}
                ${renderRoadmapTimeline(trackData)}
            </div>
        `;
        wireEvents(container);
    }

    // ─── Hero Section ───────────────────────────────────────────────
    function renderRoadmapHero() {
        const totalLevels = CurriculumData.levels.length;
        const completedLevels = CurriculumData.levels.filter(l => {
            const p = getLevelProgress(l.level);
            return p.total > 0 && p.completed === p.total;
        }).length;
        const totalHours = CurriculumData.levels.reduce((s, l) => s + l.estimatedHours, 0);

        return `
        <header class="roadmap-hero-section">
            <div class="roadmap-hero-content">
                <h1 class="roadmap-hero-title">Learning Roadmap</h1>
                <p class="roadmap-hero-subtitle">Your personalized path from fundamentals to technical mastery</p>
                <div class="roadmap-hero-stats">
                    <div class="rh-stat">
                        <span class="rh-stat-value">${totalLevels}</span>
                        <span class="rh-stat-label">Levels</span>
                    </div>
                    <div class="rh-stat">
                        <span class="rh-stat-value">${completedLevels}</span>
                        <span class="rh-stat-label">Completed</span>
                    </div>
                    <div class="rh-stat">
                        <span class="rh-stat-value">${totalHours}h</span>
                        <span class="rh-stat-label">Total Study</span>
                    </div>
                    <div class="rh-stat">
                        <span class="rh-stat-value">1,340+</span>
                        <span class="rh-stat-label">Questions</span>
                    </div>
                </div>
            </div>
        </header>`;
    }

    // ─── Experience Selector ────────────────────────────────────────
    function renderExperienceSelector() {
        const profiles = CurriculumData.experienceProfiles;
        const active = activeExperience;

        return `
        <section class="exp-selector-section">
            <h2 class="section-title-sm">What's your experience level?</h2>
            <div class="exp-pills">
                ${profiles.map(p => `
                    <button class="exp-pill ${active === p.id ? 'exp-pill-active' : ''}" data-exp="${p.id}">
                        <span class="exp-pill-years">${p.label}</span>
                    </button>
                `).join('')}
            </div>
            ${active ? renderExperienceCard(CurriculumData.getExperience(active)) : ''}
        </section>`;
    }

    function renderExperienceCard(profile) {
        if (!profile) return '';
        return `
        <div class="exp-card glass-card animate-in">
            <div class="exp-card-grid">
                <div class="exp-card-col">
                    <h4 class="exp-card-heading">Your Strengths</h4>
                    <div class="tag-group">${profile.strengths.map(s => `<span class="tag tag-success">${s}</span>`).join('')}</div>
                </div>
                <div class="exp-card-col">
                    <h4 class="exp-card-heading">Likely Gaps</h4>
                    <div class="tag-group">${profile.gaps.map(g => `<span class="tag tag-warning">${g}</span>`).join('')}</div>
                </div>
                <div class="exp-card-col">
                    <h4 class="exp-card-heading">Recommended Focus</h4>
                    <div class="tag-group">${profile.priorityLevels.map(l => {
                        const lv = CurriculumData.getLevel(l);
                        return lv ? `<a href="#" class="tag tag-primary" data-goto-level="${l}">${lv.icon} L${l}: ${lv.title}</a>` : '';
                    }).join('')}</div>
                </div>
                <div class="exp-card-col">
                    <h4 class="exp-card-heading">Estimated Prep</h4>
                    <span class="exp-prep-time">${profile.estimatedPrepWeeks} weeks</span>
                </div>
            </div>
        </div>`;
    }

    // ─── Track Selector ─────────────────────────────────────────────
    function renderTrackSelector() {
        const tracks = CurriculumData.tracks;
        return `
        <section class="track-selector-section">
            <h2 class="section-title-sm">Choose Your Learning Track</h2>
            <div class="track-cards-grid">
                ${tracks.map(t => {
                    const isActive = activeTrack === t.id;
                    const levelsDone = t.levels.filter(l => {
                        const p = getLevelProgress(l);
                        return p.total > 0 && p.completed === p.total;
                    }).length;
                    const pct = Math.round((levelsDone / t.levels.length) * 100);
                    return `
                    <button class="track-card glass-card ${isActive ? 'track-card-active' : ''}" data-track="${t.id}">
                        <span class="track-card-icon">${t.icon}</span>
                        <span class="track-card-title">${t.title}</span>
                        <span class="track-card-subtitle">${t.subtitle}</span>
                        <div class="track-card-meta">
                            <span>${t.levels.length} levels</span>
                            <span>${t.estimatedWeeks}w</span>
                        </div>
                        <div class="progress-bar progress-bar-sm"><div class="progress-fill" style="width:${pct}%;background:${t.color}"></div></div>
                        <span class="track-card-pct">${pct}%</span>
                    </button>`;
                }).join('')}
            </div>
        </section>`;
    }

    // ─── Roadmap Timeline ───────────────────────────────────────────
    function renderRoadmapTimeline(trackData) {
        const levelsToShow = trackData
            ? CurriculumData.levels.filter(l => trackData.levels.includes(l.level))
            : CurriculumData.levels;

        return `
        <section class="roadmap-timeline-section">
            <h2 class="section-title-sm">${trackData ? trackData.title + ' — Roadmap' : 'Full Curriculum Roadmap'}</h2>
            <div class="roadmap-timeline">
                ${levelsToShow.map((level, idx) => {
                    const progress = getLevelProgress(level.level);
                    const isComplete = progress.total > 0 && progress.completed === progress.total;
                    const isCurrent = !isComplete && progress.completed > 0;
                    const isLocked = !isComplete && !isCurrent && progress.completed === 0 && idx > 0;
                    const statusClass = isComplete ? 'rt-complete' : isCurrent ? 'rt-current' : isLocked ? 'rt-locked' : 'rt-available';
                    const firstTopic = getFirstTopicInLevel(level.level);

                    return `
                    ${idx > 0 ? `<div class="rt-connector ${isComplete || isCurrent ? 'rt-connector-active' : ''}"></div>` : ''}
                    <a class="rt-node ${statusClass}" href="${firstTopic ? '#' + firstTopic.id : '#home'}" data-level="${level.level}">
                        <div class="rt-node-indicator">
                            ${isComplete ? '<span class="rt-check">✓</span>' : `<span class="rt-level-num">${level.level}</span>`}
                        </div>
                        <div class="rt-node-body">
                            <div class="rt-node-header">
                                <span class="rt-node-icon">${level.icon}</span>
                                <span class="rt-node-title">${level.title}</span>
                                <span class="rt-node-difficulty badge badge-${level.difficulty}">${CurriculumData.getDifficultyLabel(level.difficulty)}</span>
                            </div>
                            <p class="rt-node-subtitle">${level.subtitle}</p>
                            <div class="rt-node-meta">
                                <span class="rt-meta-item">${Icons.clock || '⏱'} ${level.estimatedHours}h</span>
                                <span class="rt-meta-item">${Icons.fileText || '📄'} ${progress.total} topics</span>
                                <span class="rt-meta-item">${Icons.zap || '⚡'} ${level.questionCount} Qs</span>
                                <span class="rt-meta-item">${CurriculumData.getDifficultyStars(level.interviewWeight)}</span>
                            </div>
                            <div class="progress-bar progress-bar-sm"><div class="progress-fill" style="width:${progress.percent}%;background:${level.color}"></div></div>
                        </div>
                        <div class="rt-node-pct">${progress.percent}%</div>
                    </a>`;
                }).join('')}
            </div>
        </section>`;
    }

    // ─── Career View ────────────────────────────────────────────────
    function renderCareerView(container) {
        init();
        container.innerHTML = `
            <div class="premium-roadmap">
                <header class="roadmap-hero-section">
                    <div class="roadmap-hero-content">
                        <h1 class="roadmap-hero-title">Career Roadmap</h1>
                        <p class="roadmap-hero-subtitle">How the curriculum maps to your career progression</p>
                    </div>
                </header>
                <section class="career-timeline-section">
                    <div class="career-timeline">
                        ${CurriculumData.careers.map((career, idx) => {
                            const requiredDone = career.requiredLevels.filter(l => {
                                const p = getLevelProgress(l);
                                return p.total > 0 && p.completed === p.total;
                            }).length;
                            const readiness = Math.round((requiredDone / career.requiredLevels.length) * 100);
                            return `
                            ${idx > 0 ? '<div class="ct-connector"></div>' : ''}
                            <div class="ct-node" style="--career-color: ${career.color}">
                                <div class="ct-indicator" style="background: ${career.color}">${career.icon}</div>
                                <div class="ct-body glass-card">
                                    <div class="ct-header">
                                        <h3 class="ct-role">${career.role}</h3>
                                        <span class="ct-years">${career.yearsExp} years</span>
                                    </div>
                                    <div class="ct-readiness">
                                        <div class="progress-bar progress-bar-sm"><div class="progress-fill" style="width:${readiness}%;background:${career.color}"></div></div>
                                        <span class="ct-readiness-pct">${readiness}% ready</span>
                                    </div>
                                    <div class="ct-details">
                                        <div class="ct-detail-group">
                                            <span class="ct-detail-label">Required Levels</span>
                                            <div class="tag-group">${career.requiredLevels.map(l => `<span class="tag tag-sm">L${l}</span>`).join('')}</div>
                                        </div>
                                        <div class="ct-detail-group">
                                            <span class="ct-detail-label">Key Skills</span>
                                            <div class="tag-group">${career.skills.map(s => `<span class="tag tag-sm tag-outline">${s}</span>`).join('')}</div>
                                        </div>
                                        <div class="ct-detail-group">
                                            <span class="ct-detail-label">Interview Focus</span>
                                            <p class="ct-interview-focus">${career.interviewFocus}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </section>
            </div>
        `;
    }

    // ─── Tracks Detail View ─────────────────────────────────────────
    function renderTracksView(container) {
        init();
        container.innerHTML = `
            <div class="premium-roadmap">
                <header class="roadmap-hero-section">
                    <div class="roadmap-hero-content">
                        <h1 class="roadmap-hero-title">Learning Tracks</h1>
                        <p class="roadmap-hero-subtitle">Choose a focused path based on your career goal</p>
                    </div>
                </header>
                <section class="tracks-detail-section">
                    ${CurriculumData.tracks.map(track => {
                        const levelsDone = track.levels.filter(l => {
                            const p = getLevelProgress(l);
                            return p.total > 0 && p.completed === p.total;
                        }).length;
                        const pct = Math.round((levelsDone / track.levels.length) * 100);
                        return `
                        <div class="track-detail-card glass-card" style="--track-color: ${track.color}">
                            <div class="td-header">
                                <span class="td-icon">${track.icon}</span>
                                <div class="td-title-group">
                                    <h3 class="td-title">${track.title}</h3>
                                    <p class="td-subtitle">${track.description}</p>
                                </div>
                                <div class="td-progress-ring">
                                    ${buildMiniRing(pct, track.color)}
                                </div>
                            </div>
                            <div class="td-meta-row">
                                <span class="td-meta">🎯 ${track.targetRole}</span>
                                <span class="td-meta">⏱ ${track.estimatedWeeks} weeks</span>
                                <span class="td-meta">📚 ${track.levels.length} levels</span>
                            </div>
                            <div class="td-levels">
                                ${track.levels.map(l => {
                                    const lv = CurriculumData.getLevel(l);
                                    const p = getLevelProgress(l);
                                    const done = p.total > 0 && p.completed === p.total;
                                    return `<a href="#" class="td-level-chip ${done ? 'td-level-done' : ''}" data-goto-level="${l}">${lv ? lv.icon : ''} L${l}</a>`;
                                }).join('')}
                            </div>
                        </div>`;
                    }).join('')}
                </section>
            </div>
        `;
        wireEvents(container);
    }

    // ─── Helpers ────────────────────────────────────────────────────
    function buildMiniRing(pct, color) {
        const r = 28, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
        return `<svg viewBox="0 0 64 64" class="mini-ring-svg">
            <circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--border-primary)" stroke-width="4"/>
            <circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="4"
                stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round"
                transform="rotate(-90 32 32)"/>
            <text x="32" y="36" text-anchor="middle" font-size="12" font-weight="600" fill="var(--text-primary)">${pct}%</text>
        </svg>`;
    }

    function getLevelProgress(levelNum) {
        let total = 0, completed = 0;
        const level = SiteMap.levels.find(l => l.level === levelNum);
        if (!level) return { total: 0, completed: 0, percent: 0 };
        level.groups.forEach(g => {
            g.items.forEach(item => {
                if (item.dataFile) {
                    total++;
                    if (Progress.isCompleted(item.id)) completed++;
                }
            });
        });
        return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }

    function getFirstTopicInLevel(levelNum) {
        const level = SiteMap.levels.find(l => l.level === levelNum);
        if (!level) return null;
        for (const g of level.groups) {
            for (const item of g.items) {
                if (item.dataFile) return item;
            }
        }
        return null;
    }

    // ─── Event Wiring ───────────────────────────────────────────────
    function wireEvents(container) {
        // Experience pills
        container.querySelectorAll('[data-exp]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeExperience = btn.dataset.exp;
                localStorage.setItem('ih-experience', activeExperience);
                renderRoadmapView(container);
            });
        });
        // Track cards
        container.querySelectorAll('[data-track]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTrack = activeTrack === btn.dataset.track ? null : btn.dataset.track;
                localStorage.setItem('ih-track', activeTrack || '');
                renderRoadmapView(container);
            });
        });
        // Level navigation
        container.querySelectorAll('[data-goto-level]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const lv = parseInt(el.dataset.gotoLevel);
                const first = getFirstTopicInLevel(lv);
                if (first) window.location.hash = first.id;
            });
        });
    }

    // ─── Public API ─────────────────────────────────────────────────
    return {
        renderRoadmapView,
        renderCareerView,
        renderTracksView,
        init
    };
})();
