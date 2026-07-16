/* ═══════════════════════════════════════════════════════════════════
   PAGE-LOADER.JS — Dynamic Page Rendering Engine
   Renders pages from data modules, handles home dashboard, 
   breadcrumbs, prev/next navigation, and question rendering.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Page Loader ────────────────────────────────────────────────────
const PageLoader = (() => {
    async function load(pageId) {
        const container = document.getElementById('main-content');
        if (!container) return;

        // Track visit
        Progress.addVisited(pageId);

        if (pageId === 'home') {
            renderHome(container);
        } else if (pageId === 'mock-interview') {
            renderMockInterview(container);
        } else if (pageId === 'flash-cards') {
            renderFlashCards(container);
        } else if (pageId === 'study-plan') {
            renderStudyPlan(container);
        } else if (pageId === 'roadmap') {
            RoadmapEngine.renderRoadmapView(container);
        } else if (pageId === 'tracks') {
            RoadmapEngine.renderTracksView(container);
        } else if (pageId === 'career') {
            RoadmapEngine.renderCareerView(container);
        } else if (pageId === 'dashboard') {
            DashboardEngine.render(container);
        } else {
            await renderTopicPage(container, pageId);
        }

        // Refresh TOC
        setTimeout(() => ScrollSpy.refresh(), 50);
    }

    // ─── Home / Dashboard ───────────────────────────────────────────
    function renderHome(container) {
        const readiness = Progress.getReadinessPercent();
        const completed = Progress.getCompletedCount();
        const total = Progress.getTotalTopics();
        const bookmarkCount = Bookmarks.getCount();
        const recent = Progress.getRecentTopics();
        const currentLevel = getCurrentLevel();
        const nextTopic = currentLevel ? getNextIncompleteTopic(currentLevel.level) : null;
        const iv = (typeof InterviewProgress !== 'undefined') ? InterviewProgress.getReadiness() : null;
        const streak = getStudyStreak();
        const dailyChallenge = getDailyChallenge();

        // SVG ring calc
        const ringR = 54, ringC = 2 * Math.PI * ringR;
        const ringOff = ringC - (readiness / 100) * ringC;

        container.innerHTML = `
            <div class="dashboard">
                <!-- Hero -->
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-text">
                            ${streak > 1 ? `<span class="streak-badge"><span class="streak-fire">🔥</span> ${streak} day streak</span>` : ''}
                            <h1>Software Engineering Academy</h1>
                            <p class="hero-subtitle">Master the skills that land senior engineering roles. 151 topics, 1,340+ questions, from fundamentals to system design.</p>
                            ${nextTopic ? `<a class="hero-cta" href="#${nextTopic.id}">Continue Learning → ${nextTopic.title}</a>` : `<a class="hero-cta" href="#${getRandomTopicId()}">Start Exploring →</a>`}
                        </div>
                        <div class="readiness-ring">
                            <svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="${ringR}"/><circle class="ring-fill" cx="60" cy="60" r="${ringR}" stroke-dasharray="${ringC}" stroke-dashoffset="${ringOff}"/></svg>
                            <div class="ring-label"><span class="ring-value">${readiness}%</span><span class="ring-caption">Ready</span></div>
                        </div>
                    </div>
                </div>

                <!-- Continue Learning -->
                ${nextTopic && completed > 0 ? `<a class="card continue-card" href="#${nextTopic.id}"><div class="continue-info"><div class="continue-label">Continue where you left off</div><div class="continue-title">${nextTopic.title}</div><div class="continue-meta">${currentLevel ? `Level ${currentLevel.level}: ${currentLevel.title}` : ''}</div></div><span class="continue-arrow">→</span></a>` : ''}

                <!-- Stats -->
                <div class="card-grid" style="margin-top: var(--space-xl);">
                    <div class="card stat-card"><div class="stat-icon">${Icons.check}</div><div class="stat-value">${completed}/${total}</div><div class="stat-label">Topics Completed</div><div class="progress-bar"><div class="progress-fill" style="width:${readiness}%"></div></div></div>
                    <div class="card stat-card"><div class="stat-icon">${Icons.bookmark}</div><div class="stat-value">${bookmarkCount}</div><div class="stat-label">Bookmarked</div></div>
                    <div class="card stat-card"><div class="stat-icon">${Icons.clock}</div><div class="stat-value">${getDaysSinceStart()}</div><div class="stat-label">Days Studying</div></div>
                    <div class="card stat-card"><div class="stat-icon">${Icons.zap}</div><div class="stat-value">${streak}</div><div class="stat-label">Day Streak</div></div>
                </div>

                <!-- Daily Challenge -->
                ${dailyChallenge ? `<div class="section-header"><h2>${Icons.target} Daily Challenge</h2></div><a class="card daily-challenge-card" href="#${dailyChallenge.topicId}" style="display:block;text-decoration:none;"><div class="challenge-date">${new Date().toLocaleDateString('en-US', {weekday:'long',month:'short',day:'numeric'})}</div><div class="challenge-topic">${dailyChallenge.topicTitle}</div><div class="challenge-question">${dailyChallenge.question}</div></a>` : ''}
                <!-- Where to Start (new users) -->
                ${completed === 0 ? `<div class="section-header"><h2>${Icons.target} Where to Start</h2></div>
                <div class="card-grid">
                    <div class="card action-card" onclick="App.navigateTo('binary-number-systems')" style="cursor:pointer;border-left:4px solid var(--brand-success);"><div class="card-title">${Icons.code} Junior</div><div class="card-description">Fundamentals: binary, OS, C# basics</div><div class="tag-group" style="margin-top:var(--space-xs);"><span class="tag">Level 0-3</span></div></div>
                    <div class="card action-card" onclick="App.navigateTo('csharp-async')" style="cursor:pointer;border-left:4px solid var(--brand-primary);"><div class="card-title">${Icons.layers} Mid-Level</div><div class="card-description">Async, patterns, API, SQL</div><div class="tag-group" style="margin-top:var(--space-xs);"><span class="tag">Level 1-6</span></div></div>
                    <div class="card action-card" onclick="App.navigateTo('arch-styles')" style="cursor:pointer;border-left:4px solid var(--brand-accent);"><div class="card-title">${Icons.globe} Senior</div><div class="card-description">Architecture, microservices, cloud</div><div class="tag-group" style="margin-top:var(--space-xs);"><span class="tag">Level 5-13</span></div></div>
                    <div class="card action-card" onclick="App.navigateTo('arch-decisions')" style="cursor:pointer;border-left:4px solid var(--brand-warning);"><div class="card-title">${Icons.award} Architect</div><div class="card-description">Decisions, scalability, leadership</div><div class="tag-group" style="margin-top:var(--space-xs);"><span class="tag">Level 13-17</span></div></div>
                </div>` : ''}

                <!-- Quick Actions -->
                <div class="section-header"><h2>${Icons.play} Quick Actions</h2></div>
                <div class="card-grid">
                    <a class="card action-card" href="#flash-cards">
                        <div class="card-title">${Icons.shuffle} Flash Cards</div>
                        <div class="card-description">Quick review with spaced repetition</div>
                    </a>
                    <a class="card action-card" href="#${getRandomTopicId()}">
                        <div class="card-title">${Icons.zap} Random Topic</div>
                        <div class="card-description">Jump to a random topic for variety</div>
                    </a>
                    <a class="card action-card" href="#study-plan">
                        <div class="card-title">${Icons.target} Study Plan</div>
                        <div class="card-description">Structured 4-week preparation roadmap</div>
                    </a>
                    <a class="card action-card" href="#roadmap">
                        <div class="card-title">${Icons.trendingUp} Learning Roadmap</div>
                        <div class="card-description">Visual path from fundamentals to mastery</div>
                    </a>
                    <a class="card action-card" href="#tracks">
                        <div class="card-title">${Icons.target} Learning Tracks</div>
                        <div class="card-description">Choose a focused path for your career goal</div>
                    </a>
                    <a class="card action-card" href="#career">
                        <div class="card-title">${Icons.award} Career Roadmap</div>
                        <div class="card-description">Map your progression from Junior to Principal</div>
                    </a>
                    <a class="card action-card" href="#dashboard">
                        <div class="card-title">${Icons.grid} Dashboard</div>
                        <div class="card-description">Skill radar, domain scores, streak calendar</div>
                    </a>
                </div>

                <!-- Interview Focus Areas -->
                <div class="section-header"><h2>${Icons.grid} Interview Focus Areas</h2></div>
                <div class="card-grid">
                    <a class="card action-card" href="#dp-creational" style="border-left: 3px solid var(--blue-400);">
                        <div class="card-title">Design Patterns</div>
                        <div class="card-description">GoF patterns, SOLID, enterprise patterns</div>
                    </a>
                    <a class="card action-card" href="#sd-netflix" style="border-left: 3px solid var(--purple-400);">
                        <div class="card-title">System Design</div>
                        <div class="card-description">Netflix, Uber, WhatsApp, Payment Gateway</div>
                    </a>
                    <a class="card action-card" href="#microservices" style="border-left: 3px solid var(--green-400);">
                        <div class="card-title">Microservices</div>
                        <div class="card-description">13-part deep dive: decomposition to deployment</div>
                    </a>
                    <a class="card action-card" href="#csharp-async" style="border-left: 3px solid var(--orange-400);">
                        <div class="card-title">C# & .NET Deep Dives</div>
                        <div class="card-description">Async, memory, DI, LINQ, generics</div>
                    </a>
                    <a class="card action-card" href="#behavioral-interviews" style="border-left: 3px solid var(--red-400);">
                        <div class="card-title">Behavioral & Leadership</div>
                        <div class="card-description">STAR method, conflict, estimation, strategy</div>
                    </a>
                    <a class="card action-card" href="#fullstack-auth" style="border-left: 3px solid var(--teal-400);">
                        <div class="card-title">Full-Stack & Architect</div>
                        <div class="card-description">Auth flows, API design, scalability, migration</div>
                    </a>
                </div>

                <!-- Interview Readiness -->
                ${iv ? `
                <div class="section-header"><h2>${Icons.trendingUp} Interview Readiness</h2></div>
                <div class="card-grid">
                    <div class="card stat-card">
                        <div class="stat-icon">${Icons.check}</div>
                        <div class="stat-value">${iv.knownPct}%</div>
                        <div class="stat-label">Questions Mastered</div>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${iv.knownPct}%"></div></div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-icon">${Icons.bookmark}</div>
                        <div class="stat-value">${iv.review}</div>
                        <div class="stat-label">Marked for Review</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-icon">${Icons.play}</div>
                        <div class="stat-value">${iv.sessionCount}</div>
                        <div class="stat-label">Practice Sessions</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-icon">${Icons.trendingUp}</div>
                        <div class="stat-value">${iv.avgScorePct === null ? '—' : iv.avgScorePct + '%'}</div>
                        <div class="stat-label">Recent Avg Score</div>
                    </div>
                </div>
                ${iv.weakAreas && iv.weakAreas.length ? `
                <div class="card" style="margin-top: var(--space-md);">
                    <div class="card-title">${Icons.target} Focus Areas</div>
                    <div class="tag-group" style="margin-top: var(--space-sm);">
                        ${iv.weakAreas.map(w => `<span class="tag">${w}</span>`).join('')}
                    </div>
                </div>` : ''}
                ` : ''}

                <!-- Recent Topics -->
                ${recent.length > 0 ? `
                <div class="section-header"><h2>${Icons.clock} Recently Viewed</h2></div>
                <div class="recent-list">
                    ${recent.map(id => {
                        const info = SiteMap.getPageInfo(id);
                        return info ? `<a class="card recent-card" href="#${id}">
                            <span class="recent-icon">${info.icon || Icons.fileText}</span>
                            <span class="recent-title">${info.title}</span>
                            <span class="recent-section">${info.section}</span>
                        </a>` : '';
                    }).join('')}
                </div>` : ''}

                <!-- Level Progress Grid -->
                <div class="section-header"><h2>${Icons.layers} Level Progress</h2></div>
                <div class="card-grid">
                    ${SiteMap.levels.map(level => {
                        const progress = getLevelProgress(level.level);
                        const isComplete = progress.total > 0 && progress.completed === progress.total;
                        const firstItem = getFirstTopicInLevel(level.level);
                        return `
                        <a class="card topic-overview-card level-card ${isComplete ? 'level-complete' : ''}" href="${firstItem ? '#' + firstItem.id : '#home'}">
                            <div class="level-card-header">
                                <span class="level-badge-sm">L${level.level}</span>
                                ${isComplete ? `<span class="level-complete-icon">${Icons.check}</span>` : ''}
                            </div>
                            <div class="card-title">${level.title}</div>
                            <div class="card-description">${progress.completed} of ${progress.total} topics</div>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${progress.percent}%"></div></div>
                            <div class="card-meta">
                                <span>${progress.percent}% complete</span>
                            </div>
                        </a>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // ─── Topic Page Renderer ────────────────────────────────────────
    async function renderTopicPage(container, pageId) {
        const pageInfo = SiteMap.getPageInfo(pageId);
        if (!pageInfo) {
            container.innerHTML = renderNotFound(pageId);
            return;
        }

        // Show loading state while data loads
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading ${pageInfo.title}...</p>
            </div>
        `;

        // Load data asynchronously
        let content;
        try {
            content = await PageData.getAsync(pageId);
        } catch (err) {
            console.warn('[PageLoader] Load failed for:', pageId, err);
            container.innerHTML = renderLoadError(pageInfo, pageId);
            return;
        }

        if (!content) {
            container.innerHTML = renderComingSoon(pageInfo);
            return;
        }

        // Render full topic page
        container.innerHTML = `
            <article class="topic-page">
                <header class="topic-header">
                    <div class="topic-header-meta">
                        <span class="badge badge-architect">${pageInfo.section}</span>
                        ${content.difficulty ? `<span class="badge badge-${content.difficulty}">${content.difficulty}</span>` : ''}
                    </div>
                    <h1>${content.title || pageInfo.title}</h1>
                    ${content.description ? `<p class="topic-description">${content.description}</p>` : ''}
                    <div class="topic-actions">
                        <button class="btn btn-secondary btn-sm" onclick="toggleBookmarkTopic('${pageId}', '${pageInfo.title}', '${pageInfo.section}')">
                            ${Icons.bookmark} <span>Bookmark</span>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="Progress.markCompleted('${pageId}'); Toast.show('Marked as completed!');">
                            ${Icons.check} <span>Mark Complete</span>
                        </button>
                    </div>
                </header>

                ${content.quickRecall ? renderQuickRecall(content.quickRecall) : ''}

                ${content.sections ? content.sections.map(section => renderSection(section)).join('') : ''}
                
                ${content.questions ? renderQuestions(content.questions) : ''}
                
                ${renderPageNav(pageId)}
            </article>
        `;

        // Initialize interactive elements
        initAccordions();
        initTabs();
        CodeBlocks.init();
        renderMermaidDiagrams();
    }

    // ─── Quick Recall Summary ───────────────────────────────────────
    function renderQuickRecall(recall) {
        // recall is an array of 3-7 bullet strings (cheat-sheet style)
        if (!Array.isArray(recall) || recall.length === 0) return '';
        return `
            <div class="quick-recall">
                <div class="quick-recall-header">
                    <span class="quick-recall-icon">${Icons.zap}</span>
                    <span class="quick-recall-title">Quick Recall — 30-Second Cheat Sheet</span>
                </div>
                <ul class="quick-recall-list">
                    ${recall.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // ─── Section Renderer ───────────────────────────────────────────
    function renderSection(section) {
        const id = slugify(section.title);
        return `
            <section class="content-section">
                <h2 id="${id}">${section.title}</h2>
                ${section.content || ''}
                ${section.mermaid ? renderMermaid(section.mermaid) : ''}
                ${section.tabs ? renderTabs(section.tabs) : ''}
                ${section.code ? renderCodeBlock(section.code, section.language || 'csharp') : ''}
                ${section.callout ? renderCallout(section.callout) : ''}
                ${section.table ? renderTable(section.table) : ''}
                ${section.diagram ? renderDiagram(section.diagram) : ''}
            </section>
        `;
    }

    // ─── Questions Renderer ─────────────────────────────────────────
    function renderQuestions(questions) {
        return `
            <section class="questions-section">
                <h2 id="interview-questions">Interview Questions</h2>
                <div class="question-filters">
                    <button class="btn btn-sm btn-secondary filter-btn active" data-filter="all">All</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="easy">Easy</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="medium">Medium</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="hard">Hard</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="advanced">Advanced</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="expert">Expert</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="junior">Junior</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="mid">Mid</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="senior">Senior</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="lead">Lead</button>
                    <button class="btn btn-sm btn-secondary filter-btn" data-filter="architect">Architect</button>
                </div>
                <div class="accordion" id="questions-accordion">
                    ${questions.map((q, idx) => renderQuestion(q, idx)).join('')}
                </div>
            </section>
        `;
    }

    function renderQuestion(q, idx) {
        const questionText = q.question || q.title || '';
        const difficulty = q.difficulty || q.level || 'medium';
        return `
            <div class="accordion-item question-item" data-difficulty="${difficulty}">
                <button class="accordion-trigger" aria-expanded="false" aria-controls="q-${idx}">
                    <span class="accordion-icon">${Icons.chevronRight}</span>
                    <span class="question-number">Q${idx + 1}</span>
                    <span class="question-text">${questionText}</span>
                    <span class="badge badge-${difficulty}">${difficulty}</span>
                </button>
                <div class="accordion-content" id="q-${idx}">
                    <div class="answer-body">
                        ${q.answer ? `<div class="answer-section"><h4>Answer</h4>${q.answer}</div>` : ''}
                        ${q.explanation ? `<div class="answer-section"><h4>Simple Explanation</h4><p>${q.explanation}</p></div>` : ''}
                        ${q.technical ? `<div class="answer-section"><h4>Technical Deep-Dive</h4>${q.technical}</div>` : ''}
                        ${q.code ? `<div class="answer-section"><h4>Code Example</h4>${renderCodeBlock(q.code, q.language || 'csharp')}</div>` : ''}
                        ${q.mermaid ? `<div class="answer-section"><h4>Architecture Diagram</h4>${renderMermaid(q.mermaid)}</div>` : ''}
                        ${q.realWorld ? `<div class="answer-section"><h4>Real World Example</h4><p>${q.realWorld}</p></div>` : ''}
                        ${q.bestPractices ? `<div class="answer-section"><h4>Best Practices</h4><ul>${q.bestPractices.map(bp => `<li>${bp}</li>`).join('')}</ul></div>` : ''}
                        ${q.commonMistakes ? `<div class="answer-section"><h4>Common Mistakes</h4><ul class="mistakes-list">${q.commonMistakes.map(m => `<li>${m}</li>`).join('')}</ul></div>` : ''}
                        ${q.interviewTip ? `<div class="callout callout-info"><div class="callout-content"><div class="callout-title">💡 Interview Tip</div><p>${q.interviewTip}</p></div></div>` : ''}
                        ${q.followUp ? `<div class="answer-section"><h4>Follow-up Questions</h4><ul>${q.followUp.map(f => `<li>${f}</li>`).join('')}</ul></div>` : ''}
                        ${q.seniorPerspective ? `<div class="answer-section senior-note"><h4>🏗️ Senior Engineer Perspective</h4><p>${q.seniorPerspective}</p></div>` : ''}
                        ${q.architectPerspective ? `<div class="answer-section architect-note"><h4>🏛️ Architect Perspective</h4><p>${q.architectPerspective}</p></div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ─── Code Block Renderer ────────────────────────────────────────
    function renderCodeBlock(code, language) {
        const langLabel = language ? language.toUpperCase() : '';
        return `
            <div class="code-block">
                <div class="code-block-header">
                    <span class="code-block-lang">${langLabel}</span>
                    <button class="copy-btn" onclick="CodeBlocks.copy(this)">
                        ${Icons.copy} <span>Copy</span>
                    </button>
                </div>
                <pre><code class="language-${language}">${escapeHtml(code)}</code></pre>
            </div>
        `;
    }

    // ─── Callout Renderer ───────────────────────────────────────────
    function renderCallout(callout) {
        const type = callout.type || 'info';
        return `
            <div class="callout callout-${type}">
                <div class="callout-content">
                    ${callout.title ? `<div class="callout-title">${callout.title}</div>` : ''}
                    <p>${callout.text}</p>
                </div>
            </div>
        `;
    }

    // ─── Table Renderer ─────────────────────────────────────────────
    function renderTable(table) {
        if (!table.headers || !table.rows) return '';
        return `
            <div style="overflow-x: auto;">
                <table>
                    <thead><tr>${table.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                    <tbody>${table.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
            </div>
        `;
    }

    // ─── Diagram Renderer (ASCII art) ───────────────────────────────
    function renderDiagram(diagram) {
        return `<div class="diagram-container"><pre class="diagram">${escapeHtml(diagram)}</pre></div>`;
    }

    // ─── Mermaid Diagram Renderer ───────────────────────────────────
    function renderMermaid(code) {
        const id = 'mermaid-' + Math.random().toString(36).slice(2, 10);
        return `
            <div class="mermaid-container">
                <div class="mermaid-toolbar">
                    <button type="button" class="mermaid-expand-btn" data-mermaid-expand="${id}" aria-label="Expand diagram to full screen">
                        ⛶ Expand
                    </button>
                </div>
                <div class="mermaid-diagram" id="${id}">
                    <pre class="mermaid">${escapeHtml(code)}</pre>
                </div>
            </div>
        `;
    }

    // A mermaid node is "hidden" if it sits inside a collapsed accordion answer or an
    // inactive tab panel — both use display:none, and mermaid measures text via layout,
    // so a display:none ancestor makes every measurement 0/NaN. That either throws
    // ("translate(undefined, NaN)") or silently produces a broken 0-size SVG, and mermaid
    // marks the node data-processed="true" either way — so it never gets a second chance
    // unless we explicitly re-render it once it becomes visible (see renderPendingMermaidIn).
    function isMermaidNodeHidden(el) {
        const hiddenAccordion = el.closest('.accordion-content');
        if (hiddenAccordion && !hiddenAccordion.closest('.accordion-item')?.classList.contains('expanded')) return true;
        const tabPanel = el.closest('.tab-panel');
        if (tabPanel && !tabPanel.classList.contains('active')) return true;
        return false;
    }

    function renderMermaidDiagrams() {
        if (typeof mermaid === 'undefined') return;

        // Use IntersectionObserver for lazy rendering (performance)
        const diagrams = document.querySelectorAll('.mermaid:not([data-processed])');
        if (!diagrams.length) return;

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        obs.unobserve(el);
                        if (!isMermaidNodeHidden(el)) {
                            try { mermaid.run({ nodes: [el] }); } catch (e) { console.warn('[Mermaid] lazy render error:', e); }
                        }
                    }
                });
            }, { rootMargin: '200px' }); // Start rendering 200px before visible

            diagrams.forEach(el => {
                if (isMermaidNodeHidden(el)) return; // Skip hidden (will render on reveal)
                observer.observe(el);
            });
        } else {
            // Fallback: render all visible at once
            try {
                const visible = Array.from(diagrams).filter(el => !isMermaidNodeHidden(el));
                if (visible.length) mermaid.run({ nodes: visible });
            } catch (e) { console.warn('[Mermaid] render error:', e); }
        }
        wireMermaidExpand();
    }

    // Render any mermaid diagrams inside a container the first time it becomes visible
    // (they are skipped on initial page render while hidden — see renderMermaidDiagrams).
    function renderPendingMermaidIn(container) {
        if (typeof mermaid === 'undefined') return;
        const pending = container.querySelectorAll('.mermaid:not([data-processed="true"])');
        if (!pending.length) return;
        try {
            mermaid.run({ nodes: Array.from(pending) });
        } catch (e) {
            console.warn('[Mermaid] render error:', e);
        }
        wireMermaidExpand();
    }

    // ─── Mermaid Zoom / Expand overlay ──────────────────────────────
    function ensureMermaidZoomOverlay() {
        let overlay = document.getElementById('mermaid-zoom-overlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.className = 'mermaid-zoom-overlay';
        overlay.id = 'mermaid-zoom-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Expanded diagram');
        overlay.innerHTML = `
            <div class="mermaid-zoom-bar">
                <button type="button" data-zoom-toggle>Actual size</button>
                <button type="button" data-zoom-close aria-label="Close expanded diagram">✕ Close</button>
            </div>
            <div class="mermaid-zoom-canvas fit"></div>
        `;
        document.body.appendChild(overlay);

        const canvas = overlay.querySelector('.mermaid-zoom-canvas');
        const toggleBtn = overlay.querySelector('[data-zoom-toggle]');

        const close = () => {
            overlay.classList.remove('open');
            canvas.innerHTML = '';
            document.removeEventListener('keydown', onKey);
        };
        const onKey = (e) => { if (e.key === 'Escape') close(); };

        overlay.querySelector('[data-zoom-close]').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        toggleBtn.addEventListener('click', () => {
            const actual = canvas.classList.toggle('actual');
            canvas.classList.toggle('fit', !actual);
            toggleBtn.textContent = actual ? 'Fit to screen' : 'Actual size';
        });

        overlay._open = () => {
            overlay.classList.add('open');
            document.addEventListener('keydown', onKey);
        };
        overlay._canvas = canvas;
        overlay._toggleBtn = toggleBtn;
        return overlay;
    }

    function wireMermaidExpand() {
        const buttons = document.querySelectorAll('[data-mermaid-expand]');
        buttons.forEach(btn => {
            if (btn._wired) return;
            btn._wired = true;
            btn.addEventListener('click', () => {
                const src = document.getElementById(btn.getAttribute('data-mermaid-expand'));
                const svg = src && src.querySelector('svg');
                if (!svg) return;
                const overlay = ensureMermaidZoomOverlay();
                overlay._canvas.className = 'mermaid-zoom-canvas fit';
                overlay._toggleBtn.textContent = 'Actual size';
                overlay._canvas.innerHTML = '';
                overlay._canvas.appendChild(svg.cloneNode(true));
                overlay._open();
            });
        });
    }

    // ─── Tabs Renderer (Interactive Comparisons) ────────────────────
    function renderTabs(tabs) {
        const groupId = 'tabs-' + Math.random().toString(36).slice(2, 8);
        return `
            <div class="tabs">
                <div class="tabs-header">
                    ${tabs.map((tab, idx) => `
                        <button class="tab-trigger ${idx === 0 ? 'active' : ''}" 
                                data-tab="${groupId}-${idx}" 
                                role="tab"
                                aria-selected="${idx === 0}">
                            ${tab.label}
                        </button>
                    `).join('')}
                </div>
                ${tabs.map((tab, idx) => `
                    <div class="tab-panel ${idx === 0 ? 'active' : ''}" 
                         id="${groupId}-${idx}" 
                         role="tabpanel">
                        ${tab.content || ''}
                        ${tab.code ? renderCodeBlock(tab.code, tab.language || 'csharp') : ''}
                        ${tab.mermaid ? renderMermaid(tab.mermaid) : ''}
                        ${tab.table ? renderTable(tab.table) : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ─── Page Navigation (Prev/Next) ────────────────────────────────
    function renderPageNav(pageId) {
        const nav = SiteMap.getNavigation(pageId);
        return `
            <nav class="page-nav" aria-label="Page navigation">
                ${nav.prev ? `
                    <a class="page-nav-link prev" href="#${nav.prev.id}">
                        <span class="page-nav-label">← Previous</span>
                        <span class="page-nav-title">${nav.prev.title}</span>
                    </a>
                ` : '<div></div>'}
                ${nav.next ? `
                    <a class="page-nav-link next" href="#${nav.next.id}">
                        <span class="page-nav-label">Next →</span>
                        <span class="page-nav-title">${nav.next.title}</span>
                    </a>
                ` : ''}
            </nav>
        `;
    }

    // ─── Not Found Page ────────────────────────────────────────────
    function renderNotFound(pageId) {
        return `
            <article class="topic-page">
                <h1>Page Not Found</h1>
                <p>The topic "${pageId}" does not exist.</p>
                <a class="btn btn-primary" href="#home">← Back to Dashboard</a>
            </article>
        `;
    }

    // ─── Load Error Page ────────────────────────────────────────────
    function renderLoadError(pageInfo, pageId) {
        const offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
        const message = offline
            ? `You appear to be offline and this topic hasn't been cached yet. Open it once while online and it will be available offline afterwards.`
            : `Could not load the topic data for "${pageInfo.title}". Check your connection and try again.`;
        return `
            <article class="topic-page">
                <div class="error-state">
                    <h2>${offline ? 'Not Available Offline Yet' : 'Failed to Load'}</h2>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.hash='${pageId}'; window.location.reload();">Retry</button>
                    <a class="btn btn-secondary" href="#home" style="margin-left: var(--space-sm);">Back to Dashboard</a>
                </div>
            </article>
        `;
    }

    // ─── Coming Soon Page ───────────────────────────────────────────
    function renderComingSoon(pageInfo) {
        return `
            <article class="topic-page">
                <h1>${pageInfo.title}</h1>
                <p class="subtitle">${pageInfo.section}</p>
                <div class="callout callout-info">
                    <div class="callout-content">
                        <div class="callout-title">Content Coming Soon</div>
                        <p>This section is being prepared with comprehensive interview questions, code examples, architecture diagrams, and best practices. Check back soon!</p>
                    </div>
                </div>
                ${pageInfo.topics ? `
                <h2>Topics to be covered</h2>
                <div class="tag-group">
                    ${pageInfo.topics.map(t => `<span class="tag">${t}</span>`).join('')}
                </div>
                ` : ''}
                ${renderPageNav(pageInfo.id)}
            </article>
        `;
    }

    // ─── Mock Interview ─────────────────────────────────────────────
    function renderMockInterview(container) {
        const allQuestions = PageData.getAllQuestions();
        container.innerHTML = `
            <div class="mock-interview">
                <h1>${Icons.play} Mock Interview Mode</h1>
                <p class="subtitle">Practice answering questions as if you're in a real interview. Questions are presented one at a time.</p>
                
                <div class="mock-controls">
                    <button class="btn btn-primary btn-lg" id="start-mock">Start Mock Interview</button>
                    <div class="mock-settings">
                        <label>Questions: <select id="mock-count"><option>5</option><option>10</option><option selected>15</option><option>20</option></select></label>
                        <label>Difficulty: <select id="mock-difficulty"><option value="all">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></label>
                    </div>
                </div>
                
                <div id="mock-area" class="mock-area" style="display:none;"></div>
            </div>
        `;

        document.getElementById('start-mock')?.addEventListener('click', () => {
            const count = parseInt(document.getElementById('mock-count').value);
            const difficulty = document.getElementById('mock-difficulty').value;
            Quiz.startMock(allQuestions, count, difficulty);
        });
    }

    // ─── Flash Cards ────────────────────────────────────────────────
    function renderFlashCards(container) {
        container.innerHTML = `
            <div class="flashcards-page">
                <h1>${Icons.shuffle} Flash Cards</h1>
                <p class="subtitle">Quick review with flip cards. Click to reveal the answer.</p>
                
                <div class="flashcard" id="flashcard" onclick="Quiz.flipCard()">
                    <div class="flashcard-inner">
                        <div class="flashcard-front">
                            <p id="flash-question">Click "Next" to start</p>
                        </div>
                        <div class="flashcard-back">
                            <p id="flash-answer"></p>
                        </div>
                    </div>
                </div>
                
                <div class="flash-controls">
                    <button class="btn btn-secondary" onclick="Quiz.prevCard()">← Previous</button>
                    <span id="flash-counter">0 / 0</span>
                    <button class="btn btn-primary" onclick="Quiz.nextCard()">Next →</button>
                </div>
            </div>
        `;
        Quiz.initFlashCards();
    }

    // ─── Study Plan ─────────────────────────────────────────────────
    function renderStudyPlan(container) {
        container.innerHTML = `
            <article class="topic-page">
                <h1>${Icons.target} 4-Week Study Plan</h1>
                <p class="subtitle">A structured preparation roadmap for senior engineer interviews.</p>
                
                <h2 id="week-1">Week 1 — Foundations</h2>
                <div class="callout callout-info"><div class="callout-content"><p>Focus on C#, LINQ, async/await, and design principles. These are asked in every .NET interview.</p></div></div>
                <ul>
                    <li><a href="#csharp-variables">C# Variables & Types</a></li>
                    <li><a href="#csharp-collections">Collections</a></li>
                    <li><a href="#csharp-linq">LINQ</a></li>
                    <li><a href="#csharp-async">Async/Await & TPL</a></li>
                    <li><a href="#csharp-di">Dependency Injection</a></li>
                    <li><a href="#arch-principles">SOLID & Design Principles</a></li>
                </ul>

                <h2 id="week-2">Week 2 — Architecture & Patterns</h2>
                <ul>
                    <li><a href="#arch-styles">Architecture Styles</a></li>
                    <li><a href="#arch-ddd">Domain-Driven Design</a></li>
                    <li><a href="#arch-distributed">Distributed Patterns (CQRS, Saga, etc.)</a></li>
                    <li><a href="#dp-creational">Creational Patterns</a></li>
                    <li><a href="#dp-structural">Structural Patterns</a></li>
                    <li><a href="#dp-behavioral">Behavioral Patterns</a></li>
                </ul>

                <h2 id="week-3">Week 3 — Cloud & Infrastructure</h2>
                <ul>
                    <li><a href="#aspnet-middleware">ASP.NET Core Middleware</a></li>
                    <li><a href="#aspnet-auth">Authentication & Authorization</a></li>
                    <li><a href="#azure-compute">Azure Compute</a></li>
                    <li><a href="#azure-data">Azure Data Services</a></li>
                    <li><a href="#docker-core">Docker</a></li>
                    <li><a href="#k8s-core">Kubernetes</a></li>
                </ul>

                <h2 id="week-4">Week 4 — System Design & Leadership</h2>
                <ul>
                    <li><a href="#sd-netflix">System Design: Netflix</a></li>
                    <li><a href="#sd-payment">System Design: Payment Gateway</a></li>
                    <li><a href="#leadership-core">Technical Leadership</a></li>
                    <li><a href="#security-owasp">Security (OWASP)</a></li>
                    <li><a href="#perf-caching">Caching Strategies</a></li>
                    <li><a href="#ai-fundamentals">AI & LLMs</a></li>
                </ul>
            </article>
        `;
    }

    // ─── Dashboard View ───────────────────────────────────────────────
    function renderDashboard(container) {
        const readiness = Progress.getReadinessPercent();
        const completed = Progress.getCompletedCount();
        const total = Progress.getTotalTopics();
        const streak = getStudyStreak();
        const streakDays = getStreakCalendar();

        // Domain scores for radar chart
        const domains = [
            { name: 'C# / .NET', levels: [1, 2] },
            { name: 'Architecture', levels: [5] },
            { name: 'Angular', levels: [7] },
            { name: 'Cloud / DevOps', levels: [8, 9] },
            { name: 'SQL / Data', levels: [6] },
            { name: 'Security', levels: [10] },
            { name: 'System Design', levels: [13] },
            { name: 'Leadership', levels: [15, 16] }
        ];

        const domainScores = domains.map(d => {
            let dTotal = 0, dDone = 0;
            d.levels.forEach(lv => { const p = getLevelProgress(lv); dTotal += p.total; dDone += p.completed; });
            return { name: d.name, percent: dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0, done: dDone, total: dTotal };
        });

        // Radar chart SVG (octagon)
        const radarSvg = buildRadarSvg(domainScores);

        container.innerHTML = `
            <div class="dashboard-page">
                <header class="dashboard-page-header">
                    <h1>Dashboard</h1>
                    <p class="dashboard-page-subtitle">Your interview readiness at a glance</p>
                </header>

                <!-- Top stats row -->
                <div class="card-grid" style="margin-bottom: var(--space-2xl);">
                    <div class="card stat-card"><div class="stat-icon">${Icons.target}</div><div class="stat-value">${readiness}%</div><div class="stat-label">Overall Readiness</div></div>
                    <div class="card stat-card"><div class="stat-icon">${Icons.check}</div><div class="stat-value">${completed}/${total}</div><div class="stat-label">Topics Done</div></div>
                    <div class="card stat-card"><div class="stat-icon">${Icons.zap}</div><div class="stat-value">${streak}</div><div class="stat-label">Day Streak</div></div>
                    <div class="card stat-card"><div class="stat-icon">${Icons.clock}</div><div class="stat-value">${getDaysSinceStart()}</div><div class="stat-label">Days Active</div></div>
                </div>

                <!-- Radar + Domain scores -->
                <div class="dashboard-grid">
                    <div class="card radar-card">
                        <div class="card-title">Skill Radar</div>
                        <div class="radar-container">${radarSvg}</div>
                    </div>
                    <div class="card domain-card">
                        <div class="card-title">Domain Readiness</div>
                        <div class="domain-list">
                            ${domainScores.map(d => `
                                <div class="domain-item">
                                    <div class="domain-item-header">
                                        <span class="domain-name">${d.name}</span>
                                        <span class="domain-pct">${d.percent}%</span>
                                    </div>
                                    <div class="progress-bar"><div class="progress-fill" style="width:${d.percent}%"></div></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Streak Calendar -->
                <div class="card streak-card" style="margin-top: var(--space-xl);">
                    <div class="card-title">Study Activity (Last 30 Days)</div>
                    <div class="streak-grid">
                        ${streakDays.map(day => `<div class="streak-cell ${day.active ? 'streak-active' : ''}" title="${day.date}"></div>`).join('')}
                    </div>
                    <div class="streak-legend">
                        <span class="streak-legend-label">Less</span>
                        <div class="streak-cell"></div>
                        <div class="streak-cell streak-active"></div>
                        <span class="streak-legend-label">More</span>
                    </div>
                </div>
            </div>
        `;
    }

    function buildRadarSvg(scores) {
        const cx = 120, cy = 120, r = 90;
        const n = scores.length;
        const angleStep = (2 * Math.PI) / n;

        // Background grid rings
        let gridRings = '';
        for (let ring = 0.25; ring <= 1; ring += 0.25) {
            const points = [];
            for (let i = 0; i < n; i++) {
                const angle = i * angleStep - Math.PI / 2;
                points.push(`${cx + r * ring * Math.cos(angle)},${cy + r * ring * Math.sin(angle)}`);
            }
            gridRings += `<polygon points="${points.join(' ')}" fill="none" stroke="var(--border-primary)" stroke-width="0.5"/>`;
        }

        // Axis lines
        let axes = '';
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            axes += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="var(--border-primary)" stroke-width="0.5"/>`;
        }

        // Data polygon
        const dataPoints = scores.map((s, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const val = s.percent / 100;
            return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
        });

        // Labels
        let labels = '';
        scores.forEach((s, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const lx = cx + (r + 20) * Math.cos(angle);
            const ly = cy + (r + 20) * Math.sin(angle);
            const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
            labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-size="11" fill="var(--text-secondary)">${s.name}</text>`;
        });

        return `<svg viewBox="0 0 240 240" class="radar-svg">
            ${gridRings}${axes}
            <polygon points="${dataPoints.join(' ')}" fill="rgba(0,120,212,0.15)" stroke="var(--brand-primary)" stroke-width="2"/>
            ${dataPoints.map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3" fill="var(--brand-primary)"/>`).join('')}
            ${labels}
        </svg>`;
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

    // ─── Roadmap View ─────────────────────────────────────────────────
    function renderRoadmap(container) {
        container.innerHTML = `
            <div class="roadmap-page">
                <header class="roadmap-header">
                    <h1>Learning Roadmap</h1>
                    <p class="roadmap-subtitle">Your path from fundamentals to technical leadership. Each node is a level — complete them to unlock mastery.</p>
                </header>
                <div class="roadmap-track">
                    ${SiteMap.levels.map((level, idx) => {
                        const progress = getLevelProgress(level.level);
                        const isComplete = progress.total > 0 && progress.completed === progress.total;
                        const isCurrent = !isComplete && (idx === 0 || getLevelProgress(SiteMap.levels[idx - 1].level).percent === 100 || progress.completed > 0);
                        const isLocked = !isComplete && !isCurrent && progress.completed === 0 && idx > 0;
                        const statusClass = isComplete ? 'node-complete' : isCurrent ? 'node-current' : isLocked ? 'node-locked' : 'node-available';
                        const firstTopic = getFirstTopicInLevel(level.level);
                        const topicCount = progress.total;
                        const difficulty = level.level <= 3 ? 'Beginner' : level.level <= 7 ? 'Intermediate' : level.level <= 11 ? 'Advanced' : level.level <= 14 ? 'Expert' : 'Principal';
                        const estTime = level.level <= 3 ? '1-2 weeks' : level.level <= 7 ? '2-3 weeks' : level.level <= 11 ? '2 weeks' : '1-2 weeks';
                        
                        return `
                        ${idx > 0 ? `<div class="roadmap-connector ${isComplete || isCurrent ? 'connector-active' : ''}"></div>` : ''}
                        <a class="roadmap-node ${statusClass}" href="${firstTopic ? '#' + firstTopic.id : '#home'}">
                            <div class="node-badge">
                                ${isComplete ? Icons.check : `<span class="node-level">L${level.level}</span>`}
                            </div>
                            <div class="node-content">
                                <div class="node-title">${level.title}</div>
                                <div class="node-meta">
                                    <span class="node-difficulty">${difficulty}</span>
                                    <span class="node-separator">·</span>
                                    <span class="node-topics">${topicCount} topics</span>
                                    <span class="node-separator">·</span>
                                    <span class="node-time">${estTime}</span>
                                </div>
                                <div class="node-progress-bar">
                                    <div class="node-progress-fill" style="width: ${progress.percent}%"></div>
                                </div>
                                <div class="node-progress-text">${progress.completed}/${progress.total} completed (${progress.percent}%)</div>
                            </div>
                            ${isLocked ? `<div class="node-lock">${Icons.shield}</div>` : ''}
                        </a>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // ─── Helpers ────────────────────────────────────────────────────
    function getDaysSinceStart() {
        try {
            const data = JSON.parse(localStorage.getItem('ih-progress'));
            if (data?.startDate) {
                const days = Math.floor((Date.now() - new Date(data.startDate).getTime()) / 86400000);
                return Math.max(1, days);
            }
        } catch (e) { /* ignore */ }
        return 1;
    }

    function getSectionProgress(section) {
        let completed = 0;
        section.items.forEach(item => {
            if (Progress.isCompleted(item.id)) completed++;
        });
        return section.items.length > 0 ? Math.round((completed / section.items.length) * 100) : 0;
    }

    function getCurrentLevel() {
        for (const level of SiteMap.levels) {
            const items = SiteMap.getLevelItems(level.level);
            const completed = items.filter(i => Progress.isCompleted(i.id)).length;
            if (completed < items.length) return level;
        }
        return SiteMap.levels[SiteMap.levels.length - 1];
    }

    function getNextIncompleteTopic(levelNum) {
        const items = SiteMap.getLevelItems(levelNum);
        return items.find(i => !Progress.isCompleted(i.id) && i.id !== 'home' && i.id !== 'study-plan' && i.id !== 'mock-interview' && i.id !== 'flash-cards') || null;
    }

    function getLevelProgress(levelNum) {
        const items = SiteMap.getLevelItems(levelNum);
        const completed = items.filter(i => Progress.isCompleted(i.id)).length;
        return { completed, total: items.length, percent: items.length > 0 ? Math.round((completed / items.length) * 100) : 0 };
    }

    function getFirstTopicInLevel(levelNum) {
        const items = SiteMap.getLevelItems(levelNum);
        return items.find(i => i.id !== 'home' && i.id !== 'study-plan' && i.id !== 'mock-interview' && i.id !== 'flash-cards') || items[0] || null;
    }

    function getRandomTopicId() {
        const allIds = SiteMap.getAllPageIds().filter(id => !['home', 'study-plan', 'mock-interview', 'flash-cards'].includes(id));
        return allIds[Math.floor(Math.random() * allIds.length)] || 'csharp-variables';
    }

    function getStudyStreak() {
        try {
            const data = JSON.parse(localStorage.getItem('ih-progress'));
            if (!data?.lastVisited?.length) return 0;
            // Check streak storage
            const streakData = JSON.parse(localStorage.getItem('ih-streak') || '{"days":[],"current":0}');
            const today = new Date().toISOString().slice(0, 10);
            if (!streakData.days.includes(today)) {
                streakData.days.push(today);
                // Keep last 90 days
                streakData.days = streakData.days.slice(-90);
            }
            // Count consecutive days backward from today
            let streak = 0;
            const sorted = [...streakData.days].sort().reverse();
            let expected = new Date();
            for (const day of sorted) {
                const expectedStr = expected.toISOString().slice(0, 10);
                if (day === expectedStr) {
                    streak++;
                    expected.setDate(expected.getDate() - 1);
                } else if (day < expectedStr) {
                    break;
                }
            }
            streakData.current = streak;
            localStorage.setItem('ih-streak', JSON.stringify(streakData));
            return streak;
        } catch (e) { return 0; }
    }

    function getDailyChallenge() {
        try {
            const allIds = SiteMap.getAllPageIds().filter(id => 
                !['home', 'study-plan', 'mock-interview', 'flash-cards'].includes(id));
            // Deterministic daily pick based on day-of-year
            const now = new Date();
            const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
            const topicIdx = dayOfYear % allIds.length;
            const topicId = allIds[topicIdx];
            const info = SiteMap.getPageInfo(topicId);
            if (!info) return null;
            // Pick a question preview based on day
            const questions = [
                "How would you explain this concept to a junior engineer?",
                "What are the trade-offs involved in this approach?",
                "When would you NOT use this pattern in production?",
                "How does this compare to alternative approaches?",
                "What real-world incident could result from misusing this?"
            ];
            const qIdx = dayOfYear % questions.length;
            return { topicId, topicTitle: info.title, question: questions[qIdx] };
        } catch (e) { return null; }
    }

    function slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function initAccordions() {
        document.querySelectorAll('.accordion-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const item = trigger.closest('.accordion-item');
                const wasExpanded = item.classList.contains('expanded');
                item.classList.toggle('expanded');
                trigger.setAttribute('aria-expanded', !wasExpanded);
                if (!wasExpanded) renderPendingMermaidIn(item);
            });
        });

        // Difficulty filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                document.querySelectorAll('.question-item').forEach(item => {
                    if (filter === 'all' || item.dataset.difficulty === filter) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    function initTabs() {
        document.querySelectorAll('.tab-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const tabGroup = trigger.closest('.tabs');
                tabGroup.querySelectorAll('.tab-trigger').forEach(t => t.classList.remove('active'));
                tabGroup.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                trigger.classList.add('active');
                const panel = tabGroup.querySelector(`#${trigger.dataset.tab}`);
                if (panel) {
                    panel.classList.add('active');
                    renderPendingMermaidIn(panel);
                }
            });
        });
    }

    return { load };
})();

// ─── Breadcrumb ─────────────────────────────────────────────────────
const Breadcrumb = (() => {
    function update(pageId) {
        const container = document.getElementById('breadcrumb');
        if (!container) return;

        if (['home', 'roadmap', 'dashboard', 'mock-interview', 'flash-cards', 'study-plan'].includes(pageId)) {
            const titles = { home: 'Home', roadmap: 'Roadmap', dashboard: 'Dashboard', 'mock-interview': 'Mock Interview', 'flash-cards': 'Flash Cards', 'study-plan': 'Study Plan' };
            container.innerHTML = `<a class="breadcrumb-item" href="#home">Home</a><span class="breadcrumb-separator">›</span><span class="breadcrumb-item"><strong>${titles[pageId] || pageId}</strong></span>`;
            return;
        }

        const info = SiteMap.getPageInfo(pageId);
        if (!info) return;

        container.innerHTML = `
            <a class="breadcrumb-item" href="#home">Home</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item breadcrumb-level">L${info.level}</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item">${info.section}</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item"><strong>${info.title}</strong></span>
        `;
    }

    return { update };
})();

// ─── Toast Notifications ────────────────────────────────────────────
const Toast = (() => {
    function show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return { show };
})();

// ─── Bookmark Helper ────────────────────────────────────────────────
function toggleBookmarkTopic(id, title, section) {
    const isBookmarked = Bookmarks.toggle(id, title, section);
    Toast.show(isBookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
}
