// Motion layer — scroll reveals, split headings, nav indicator, reading progress.
// Loaded with `defer` on every page. Does nothing visual if the visitor
// prefers reduced motion, beyond the nav indicator and progress-free layout.

(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    if (!reduceMotion) root.classList.add('motion');

    const REVEAL_SELECTOR = [
        '.hero .subtitle', '.hero .bio', '.hero .links',
        '.section-header', '.preview-item', '.item', '.view-all',
        '.article-meta', '.article-subtitle', '.article-content > *',
        '.project-media', '.back-link'
    ].join(',');

    // Wrap each word of a display heading so it can rise out of a mask
    function splitWords(el) {
        if (el.dataset.split) return;
        el.dataset.split = 'true';
        const words = el.textContent.trim().split(/\s+/);
        el.setAttribute('aria-label', el.textContent.trim());
        el.innerHTML = words
            .map((w, i) => `<span class="split-word" aria-hidden="true"><span style="transition-delay:${i * 90}ms">${w}</span></span>`)
            .join(' ');
        el.classList.add('split');
    }

    document.querySelectorAll('.hero h1, article h1').forEach(splitWords);

    // Reveal on scroll; elements entering together are staggered top to bottom
    const targets = document.querySelectorAll(REVEAL_SELECTOR);
    targets.forEach(el => {
        // Pieces inside a revealed parent ride along with it
        if (el.parentElement.closest('[data-reveal]')) return;
        el.setAttribute('data-reveal', '');
    });

    const reveal = (el, delay) => {
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('in');
        // Clear the delay afterwards so hover transitions stay snappy
        setTimeout(() => { el.style.transitionDelay = ''; }, delay + 1000);
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
        document.querySelectorAll('[data-reveal], .split, .hero').forEach(el => el.classList.add('in'));
    } else {
        const io = new IntersectionObserver(entries => {
            entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                .forEach((e, i) => {
                    reveal(e.target, Math.min(i, 6) * 80);
                    io.unobserve(e.target);
                });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

        document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

        // Headings and the hero rule play on load rather than on scroll
        requestAnimationFrame(() => requestAnimationFrame(() => {
            document.querySelectorAll('.split, .hero').forEach(el => el.classList.add('in'));
        }));
    }

    // Nav: border on scroll, plus a hairline that slides to the active link
    const nav = document.querySelector('nav');
    const links = document.querySelector('.nav-links');
    let indicator = null;

    if (links) {
        indicator = document.createElement('span');
        indicator.className = 'nav-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        links.appendChild(indicator);
    }

    function moveIndicator(target) {
        if (!indicator) return;
        const active = target || links.querySelector('a.active');
        if (!active || active.offsetParent === null) {
            indicator.style.opacity = '0';
            return;
        }
        const left = active.offsetLeft;
        const top = active.offsetTop + active.offsetHeight;
        indicator.style.top = `${top + 6}px`;
        indicator.style.bottom = 'auto';
        indicator.style.transform = `translateX(${left}px) scaleX(${active.offsetWidth})`;
        indicator.style.opacity = '1';
    }

    if (links) {
        links.querySelectorAll('a').forEach(a => {
            a.addEventListener('mouseenter', () => moveIndicator(a));
        });
        links.addEventListener('mouseleave', () => moveIndicator());
        window.addEventListener('resize', () => moveIndicator());
        document.fonts && document.fonts.ready.then(() => moveIndicator());
        moveIndicator();
    }

    // Reading progress on article pages
    const article = document.querySelector('article');
    let bar = null;
    if (article && !reduceMotion) {
        bar = document.createElement('div');
        bar.className = 'read-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            if (nav) nav.classList.toggle('scrolled', y > 8);
            if (bar) {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
            }
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Looping demo videos play only while on screen; with reduced motion they
    // stay paused on their poster and get controls instead
    const demos = document.querySelectorAll('video.demo-video');
    if (reduceMotion) {
        demos.forEach(v => { v.removeAttribute('autoplay'); v.pause(); v.controls = true; });
    } else if ('IntersectionObserver' in window) {
        const vio = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) e.target.play().catch(() => {});
                else e.target.pause();
            });
        }, { threshold: 0.25 });
        demos.forEach(v => { v.autoplay = false; v.pause(); vio.observe(v); });
    }

    // Exposed for the home page's view switcher
    window.Motion = { moveIndicator };
})();
