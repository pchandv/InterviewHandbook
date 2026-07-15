/* ═══════════════════════════════════════════════════════════════════
   SCROLLSPY.JS — Table of Contents Scroll Spy + Reading Progress
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const ScrollSpy = (() => {
    let headings = [];
    let tocLinks = [];
    let observer = null;

    function init() {
        // Will be re-initialized when page loads
        window.addEventListener('hashchange', () => {
            setTimeout(refresh, 100);
        });
    }

    function refresh() {
        cleanup();

        const content = document.querySelector('.main-content');
        if (!content) return;

        headings = Array.from(content.querySelectorAll('h2[id], h3[id]'));
        if (headings.length === 0) return;

        renderTOC();
        setupObserver();
        updateReadingProgress();

        content.addEventListener('scroll', updateReadingProgress);
    }

    function renderTOC() {
        const tocContainer = document.getElementById('toc-list');
        if (!tocContainer) return;

        tocContainer.innerHTML = headings.map(h => {
            const depth = h.tagName === 'H3' ? 'depth-2' : '';
            return `<li class="toc-item">
                <a class="toc-link ${depth}" href="#${h.id}" data-target="${h.id}">${h.textContent}</a>
            </li>`;
        }).join('');

        tocLinks = Array.from(tocContainer.querySelectorAll('.toc-link'));
        
        // Bind smooth scroll
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(link.dataset.target);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.replaceState(null, '', `#${link.dataset.target}`);
                }
            });
        });
    }

    function setupObserver() {
        const options = {
            root: null,
            rootMargin: '-80px 0px -70% 0px',
            threshold: 0
        };

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveTOC(entry.target.id);
                }
            });
        }, options);

        headings.forEach(h => observer.observe(h));
    }

    function setActiveTOC(id) {
        tocLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.target === id);
        });
    }

    function updateReadingProgress() {
        const content = document.querySelector('.main-content');
        const progressBar = document.getElementById('reading-progress');
        if (!content || !progressBar) return;

        const scrollTop = content.scrollTop || window.scrollY;
        const scrollHeight = content.scrollHeight - content.clientHeight;
        const progress = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0;
        progressBar.style.width = `${progress}%`;
    }

    function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        headings = [];
        tocLinks = [];
    }

    return { init, refresh };
})();
