/* ═══════════════════════════════════════════════════════════════════
   QUIZ.JS — Mock Interview & Flash Cards Engine
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const Quiz = (() => {
    let flashCards = [];
    let flashIndex = 0;

    // ─── Mock Interview ─────────────────────────────────────────────
    function startMock(allQuestions, count, difficulty) {
        let pool = [...allQuestions];
        if (difficulty !== 'all') {
            pool = pool.filter(q => q.difficulty === difficulty);
        }

        // Shuffle and pick
        pool = shuffleArray(pool).slice(0, count);

        const area = document.getElementById('mock-area');
        if (!area || pool.length === 0) {
            if (area) area.innerHTML = '<p>No questions available for the selected criteria.</p>';
            return;
        }

        area.style.display = 'block';
        let current = 0;

        function renderQuestion() {
            const q = pool[current];
            area.innerHTML = `
                <div class="mock-question">
                    <div class="mock-progress">Question ${current + 1} of ${pool.length}</div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${((current + 1) / pool.length) * 100}%"></div></div>
                    <h3 class="mock-q-text">${q.question}</h3>
                    <div class="mock-meta">
                        <span class="badge badge-${q.difficulty || 'medium'}">${q.difficulty || 'medium'}</span>
                        <span class="tag">${q.topic || 'General'}</span>
                    </div>
                    <div class="mock-actions">
                        <button class="btn btn-primary" id="mock-reveal">Reveal Answer</button>
                        ${current < pool.length - 1 ? '<button class="btn btn-secondary" id="mock-skip">Skip →</button>' : ''}
                    </div>
                    <div id="mock-answer" class="mock-answer" style="display:none;">
                        <h4>Answer</h4>
                        ${q.answer || '<p>No detailed answer available.</p>'}
                        ${q.code ? `<div class="code-block"><div class="code-block-header"><span class="code-block-lang">${(q.language || 'csharp').toUpperCase()}</span></div><pre><code class="language-${q.language || 'csharp'}">${escapeHtml(q.code)}</code></pre></div>` : ''}
                        ${q.interviewTip ? `<div class="callout callout-info"><div class="callout-content"><div class="callout-title">💡 Interview Tip</div><p>${q.interviewTip}</p></div></div>` : ''}
                        <div class="mock-next-actions">
                            ${current < pool.length - 1 ? '<button class="btn btn-primary" id="mock-next">Next Question →</button>' : '<button class="btn btn-primary" id="mock-finish">Finish Interview</button>'}
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('mock-reveal')?.addEventListener('click', () => {
                document.getElementById('mock-answer').style.display = 'block';
                document.getElementById('mock-reveal').style.display = 'none';
                CodeBlocks.init();
            });

            document.getElementById('mock-skip')?.addEventListener('click', () => {
                current++;
                renderQuestion();
            });

            document.getElementById('mock-next')?.addEventListener('click', () => {
                current++;
                renderQuestion();
            });

            document.getElementById('mock-finish')?.addEventListener('click', () => {
                area.innerHTML = `
                    <div class="mock-complete">
                        <h2>🎉 Mock Interview Complete!</h2>
                        <p>You reviewed ${pool.length} questions. Great practice session!</p>
                        <button class="btn btn-primary" onclick="window.location.hash='home'">Back to Dashboard</button>
                    </div>
                `;
            });
        }

        renderQuestion();
    }

    // ─── Flash Cards ────────────────────────────────────────────────
    function initFlashCards() {
        flashCards = PageData.getAllQuestions().map(q => ({
            front: q.question,
            back: q.explanation || (q.answer ? q.answer.replace(/<[^>]*>/g, '').slice(0, 200) + '...' : 'No answer available')
        }));
        flashCards = shuffleArray(flashCards);
        flashIndex = 0;
        updateFlashCard();
    }

    function nextCard() {
        if (flashCards.length === 0) return;
        flashIndex = (flashIndex + 1) % flashCards.length;
        document.getElementById('flashcard')?.classList.remove('flipped');
        setTimeout(updateFlashCard, 200);
    }

    function prevCard() {
        if (flashCards.length === 0) return;
        flashIndex = (flashIndex - 1 + flashCards.length) % flashCards.length;
        document.getElementById('flashcard')?.classList.remove('flipped');
        setTimeout(updateFlashCard, 200);
    }

    function flipCard() {
        document.getElementById('flashcard')?.classList.toggle('flipped');
    }

    function updateFlashCard() {
        if (flashCards.length === 0) return;
        const card = flashCards[flashIndex];
        const qEl = document.getElementById('flash-question');
        const aEl = document.getElementById('flash-answer');
        const counter = document.getElementById('flash-counter');
        if (qEl) qEl.textContent = card.front;
        if (aEl) aEl.textContent = card.back;
        if (counter) counter.textContent = `${flashIndex + 1} / ${flashCards.length}`;
    }

    // ─── Helpers ────────────────────────────────────────────────────
    function shuffleArray(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return { startMock, initFlashCards, nextCard, prevCard, flipCard };
})();
