/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD-ENGINE.JS — Premium Dashboard with Readiness Scores,
   Smart Recommendations, Domain Breakdowns & Enhanced Metrics
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const DashboardEngine = (() => {

    // ─── Domain Configuration ───────────────────────────────────────
    const domains = [
        { name: 'C# / .NET', levels: [1, 2], icon: '⚡', color: '#6366f1' },
        { name: 'Architecture', levels: [5], icon: '🏛️', color: '#ec4899' },
        { name: 'Angular', levels: [7], icon: '🅰️', color: '#ef4444' },
        { name: 'Cloud / DevOps', levels: [8, 9], icon: '☁️', color: '#0ea5e9' },
        { name: 'SQL / Data', levels: [6], icon: '🗄️', color: '#14b8a6' },
        { name: 'Security', levels: [10], icon: '🔒', color: '#f43f5e' },
        { name: 'Performance', levels: [11], icon: '⚡', color: '#eab308' },
        { name: 'AI / ML', levels: [12], icon: '🤖', color: '#a855f7' },
        { name: 'System Design', levels: [13], icon: '📊', color: '#06b6d4' },
        { name: 'Leadership', levels: [15, 16], icon: '👥', color: '#84cc16' }
    ];

    // ─── Render Enhanced Dashboard ──────────────────────────────────
    function render(container) {
        const readiness = Progress.getReadinessPercent();
        const completed = Progress.getCompletedCount();
        const total = Progress.getTotalTopics();
        const streak = getStudyStreak();
        const domainScores = getDomainScores();
        const recommendations = getRecommendations(domainScores);
        const readinessBreakdown = getReadinessBreakdown();

        container.innerHTML = `
        <div class="premium-roadmap">
            <header class="roadmap-hero-section">
                <div class="roadmap-hero-content">
                    <h1 class="roadmap-hero-title">Dashboard</h1>
                    <p class="roadmap-hero-subtitle">Your interview readiness at a glance</p>
                </div>
            </header>

            ${renderOverallReadiness(readiness, completed, total, streak)}
            ${renderReadinessBreakdown(readinessBreakdown)}
            ${renderDomainRadar(domainScores)}
            ${renderSmartRecommendations(recommendations)}
            ${renderStreakCalendar()}
        </div>`;
    }

    // ─── Overall Readiness Section ──────────────────────────────────
    function renderOverallReadiness(readiness, completed, total, streak) {
        const ringR = 54, ringC = 2 * Math.PI * ringR, ringOff = ringC - (readiness / 100) * ringC;
        return `
        <section class="dash-stats-section">
            <div class="dash-stats-grid">
                <div class="dash-stat-ring glass-card">
                    <svg viewBox="0 0 120 120" class="dash-ring-svg">
                        <circle cx="60" cy="60" r="${ringR}" fill="none" stroke="var(--border-primary)" stroke-width="8"/>
                        <circle cx="60" cy="60" r="${ringR}" fill="none" stroke="var(--brand-primary)" stroke-width="8"
                            stroke-dasharray="${ringC}" stroke-dashoffset="${ringOff}" stroke-linecap="round"
                            transform="rotate(-90 60 60)"/>
                    </svg>
                    <div class="dash-ring-label">
                        <span class="dash-ring-value">${readiness}%</span>
                        <span class="dash-ring-caption">Interview Ready</span>
                    </div>
                </div>
                <div class="dash-stat-cards">
                    <div class="dash-mini-card glass-card">
                        <span class="dash-mini-icon">📚</span>
                        <span class="dash-mini-value">${completed}/${total}</span>
                        <span class="dash-mini-label">Topics Done</span>
                    </div>
                    <div class="dash-mini-card glass-card">
                        <span class="dash-mini-icon">🔥</span>
                        <span class="dash-mini-value">${streak}</span>
                        <span class="dash-mini-label">Day Streak</span>
                    </div>
                    <div class="dash-mini-card glass-card">
                        <span class="dash-mini-icon">⏱️</span>
                        <span class="dash-mini-value">${getDaysSinceStart()}</span>
                        <span class="dash-mini-label">Days Active</span>
                    </div>
                    <div class="dash-mini-card glass-card">
                        <span class="dash-mini-icon">❓</span>
                        <span class="dash-mini-value">1,340+</span>
                        <span class="dash-mini-label">Questions</span>
                    </div>
                </div>
            </div>
        </section>`;
    }

    // ─── Readiness Breakdown ────────────────────────────────────────
    function renderReadinessBreakdown(breakdown) {
        return `
        <section class="dash-breakdown-section">
            <h2 class="section-title-sm">Readiness Breakdown</h2>
            <div class="dash-breakdown-grid">
                ${breakdown.map(b => `
                <div class="dash-breakdown-item glass-card">
                    <div class="db-header">
                        <span class="db-icon">${b.icon}</span>
                        <span class="db-title">${b.name}</span>
                        <span class="db-pct" style="color:${b.pct >= 80 ? 'var(--brand-success)' : b.pct >= 40 ? 'var(--brand-warning)' : 'var(--brand-error)'}">${b.pct}%</span>
                    </div>
                    <div class="progress-bar progress-bar-sm">
                        <div class="progress-fill" style="width:${b.pct}%;background:${b.color}"></div>
                    </div>
                </div>`).join('')}
            </div>
        </section>`;
    }

    // ─── Domain Radar ───────────────────────────────────────────────
    function renderDomainRadar(scores) {
        const radarSvg = buildRadarSvg(scores);
        return `
        <section class="dash-radar-section">
            <div class="dash-radar-grid">
                <div class="glass-card dash-radar-card">
                    <h3 class="dash-card-title">Skill Radar</h3>
                    <div class="radar-container">${radarSvg}</div>
                </div>
                <div class="glass-card dash-domain-list-card">
                    <h3 class="dash-card-title">Domain Scores</h3>
                    <div class="dash-domain-list">
                        ${scores.map(d => `
                        <div class="dash-domain-row">
                            <span class="dash-domain-icon">${d.icon}</span>
                            <span class="dash-domain-name">${d.name}</span>
                            <div class="progress-bar progress-bar-sm dash-domain-bar">
                                <div class="progress-fill" style="width:${d.percent}%;background:${d.color}"></div>
                            </div>
                            <span class="dash-domain-pct">${d.percent}%</span>
                        </div>`).join('')}
                    </div>
                </div>
            </div>
        </section>`;
    }

    // ─── Smart Recommendations ──────────────────────────────────────
    function renderSmartRecommendations(recs) {
        if (!recs.length) return '';
        return `
        <section class="dash-recs-section">
            <h2 class="section-title-sm">Recommended Next Steps</h2>
            <div class="dash-recs-grid">
                ${recs.map(r => `
                <a class="dash-rec-card glass-card" href="#${r.id}">
                    <span class="dash-rec-type">${r.type}</span>
                    <span class="dash-rec-title">${r.title}</span>
                    <span class="dash-rec-reason">${r.reason}</span>
                </a>`).join('')}
            </div>
        </section>`;
    }

    // ─── Streak Calendar ────────────────────────────────────────────
    function renderStreakCalendar() {
        const days = getStreakCalendar();
        return `
        <section class="dash-streak-section">
            <h2 class="section-title-sm">Study Activity (Last 30 Days)</h2>
            <div class="glass-card dash-streak-card">
                <div class="streak-grid">
                    ${days.map(day => `<div class="streak-cell ${day.active ? 'streak-active' : ''}" title="${day.date}"></div>`).join('')}
                </div>
                <div class="streak-legend">
                    <span class="streak-legend-label">Less</span>
                    <div class="streak-cell"></div>
                    <div class="streak-cell streak-active"></div>
                    <span class="streak-legend-label">More</span>
                </div>
            </div>
        </section>`;
    }

    // ─── Data Helpers ───────────────────────────────────────────────
    function getDomainScores() {
        return domains.map(d => {
            let dTotal = 0, dDone = 0;
            d.levels.forEach(lv => {
                const level = SiteMap.levels.find(l => l.level === lv);
                if (!level) return;
                level.groups.forEach(g => g.items.forEach(item => {
                    if (item.dataFile) { dTotal++; if (Progress.isCompleted(item.id)) dDone++; }
                }));
            });
            return { ...d, percent: dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0, done: dDone, total: dTotal };
        });
    }

    function getReadinessBreakdown() {
        return [
            { name: 'Architecture', icon: '🏛️', color: '#ec4899', pct: getDomainPct([5]) },
            { name: 'AI Readiness', icon: '🤖', color: '#a855f7', pct: getDomainPct([12]) },
            { name: 'Cloud Readiness', icon: '☁️', color: '#0ea5e9', pct: getDomainPct([8, 9]) },
            { name: 'Leadership', icon: '👥', color: '#84cc16', pct: getDomainPct([15, 16]) },
            { name: 'System Design', icon: '📊', color: '#06b6d4', pct: getDomainPct([13]) },
            { name: 'Security', icon: '🔒', color: '#f43f5e', pct: getDomainPct([10]) }
        ];
    }

    function getDomainPct(levels) {
        let t = 0, d = 0;
        levels.forEach(lv => {
            const level = SiteMap.levels.find(l => l.level === lv);
            if (!level) return;
            level.groups.forEach(g => g.items.forEach(item => {
                if (item.dataFile) { t++; if (Progress.isCompleted(item.id)) d++; }
            }));
        });
        return t > 0 ? Math.round((d / t) * 100) : 0;
    }

    function getRecommendations(scores) {
        const recs = [];
        // Weakest domain
        const weakest = [...scores].sort((a, b) => a.percent - b.percent)[0];
        if (weakest && weakest.percent < 100) {
            const lv = weakest.levels[0];
            const level = SiteMap.levels.find(l => l.level === lv);
            if (level) {
                for (const g of level.groups) {
                    for (const item of g.items) {
                        if (item.dataFile && !Progress.isCompleted(item.id)) {
                            recs.push({ id: item.id, title: item.title, type: '🎯 Fill Gap', reason: `${weakest.name} is your weakest area (${weakest.percent}%)` });
                            break;
                        }
                    }
                    if (recs.length) break;
                }
            }
        }
        // Next incomplete in current progress
        for (const level of SiteMap.levels) {
            for (const g of level.groups) {
                for (const item of g.items) {
                    if (item.dataFile && !Progress.isCompleted(item.id) && recs.length < 4 && !recs.find(r => r.id === item.id)) {
                        recs.push({ id: item.id, title: item.title, type: '📖 Continue', reason: `Level ${level.level}: ${level.title}` });
                    }
                }
            }
            if (recs.length >= 4) break;
        }
        return recs.slice(0, 4);
    }

    function getStudyStreak() {
        try {
            const data = JSON.parse(localStorage.getItem('ih-streak') || '{"days":[],"count":0}');
            return data.count || 0;
        } catch (e) { return 0; }
    }

    function getDaysSinceStart() {
        try {
            const data = JSON.parse(localStorage.getItem('ih-progress') || '{}');
            if (!data.startDate) return 0;
            return Math.floor((Date.now() - new Date(data.startDate).getTime()) / 86400000);
        } catch (e) { return 0; }
    }

    function getStreakCalendar() {
        const days = [];
        const today = new Date();
        let streakData;
        try { streakData = JSON.parse(localStorage.getItem('ih-streak') || '{"days":[]}'); } catch (e) { streakData = { days: [] }; }
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            days.push({ date: dateStr, active: streakData.days.includes(dateStr) });
        }
        return days;
    }

    // ─── Radar SVG Builder ──────────────────────────────────────────
    function buildRadarSvg(scores) {
        const cx = 120, cy = 120, r = 90;
        const n = scores.length;
        const angleStep = (2 * Math.PI) / n;

        let gridRings = '';
        for (let ring = 0.25; ring <= 1; ring += 0.25) {
            const points = [];
            for (let i = 0; i < n; i++) {
                const angle = i * angleStep - Math.PI / 2;
                points.push(`${cx + r * ring * Math.cos(angle)},${cy + r * ring * Math.sin(angle)}`);
            }
            gridRings += `<polygon points="${points.join(' ')}" fill="none" stroke="var(--border-primary)" stroke-width="0.5"/>`;
        }

        let axes = '';
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            axes += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="var(--border-primary)" stroke-width="0.5"/>`;
        }

        const dataPoints = scores.map((s, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const val = s.percent / 100;
            return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
        });

        let labels = '';
        scores.forEach((s, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const lx = cx + (r + 22) * Math.cos(angle);
            const ly = cy + (r + 22) * Math.sin(angle);
            const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
            labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-size="10" fill="var(--text-secondary)">${s.icon} ${s.name}</text>`;
        });

        return `<svg viewBox="0 0 240 240" class="radar-svg">
            ${gridRings}${axes}
            <polygon points="${dataPoints.join(' ')}" fill="rgba(0,120,212,0.12)" stroke="var(--brand-primary)" stroke-width="2"/>
            ${dataPoints.map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3" fill="var(--brand-primary)"/>`).join('')}
            ${labels}
        </svg>`;
    }

    // ─── Public API ─────────────────────────────────────────────────
    return { render };
})();
