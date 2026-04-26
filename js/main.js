/* main.js — kodesignengineer v2 */
(() => {
    'use strict';

    /* Preloader */
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('preloaderCounter');
    let pct = 0;

    function runPreloader() {
        if (!preloader) { document.body.classList.add('is-loaded'); startReveals(); return; }
        const tick = () => {
            pct += Math.random() * 14 + 4;
            if (pct >= 100) {
                pct = 100;
                if (counter) counter.textContent = '100';
                setTimeout(() => {
                    preloader.classList.add('is-done');
                    preloader.style.transition = 'opacity .5s ease, visibility .5s';
                    preloader.style.opacity = '0';
                    setTimeout(() => {
                        preloader.style.visibility = 'hidden';
                        document.body.classList.add('is-loaded');
                        startReveals();
                    }, 500);
                }, 200);
                return;
            }
            if (counter) counter.textContent = Math.floor(pct);
            setTimeout(tick, 80 + Math.random() * 120);
        };
        tick();
    }

    /* Cursor + coords */
    const cursor = document.getElementById('cursor');
    const coords = document.getElementById('cursorCoords');
    if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.body.classList.add('cursor-ready');
        let cx = 0, cy = 0, tx = 0, ty = 0;
        document.addEventListener('mousemove', (e) => {
            tx = e.clientX; ty = e.clientY;
            cursor.classList.add('is-visible');
            if (coords) {
                coords.classList.add('is-visible');
                coords.textContent = `X:${String(Math.round(tx)).padStart(3, '0')} Y:${String(Math.round(ty)).padStart(3, '0')}`;
                coords.style.transform = `translate(${tx + 18}px, ${ty + 18}px)`;
            }
        }, { passive: true });
        document.addEventListener('mouseleave', () => { cursor.classList.remove('is-visible'); coords?.classList.remove('is-visible'); });
        const lerp = () => {
            cx += (tx - cx) * 0.22;
            cy += (ty - cy) * 0.22;
            cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
            requestAnimationFrame(lerp);
        };
        requestAnimationFrame(lerp);
        document.querySelectorAll('a, button, [data-hover]').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
        });
    }

    /* Smooth scroll (Lenis) */
    let lenis = null;
    function initLenis() {
        if (typeof Lenis === 'undefined') return;
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const id = a.getAttribute('href');
                if (id.length > 1) {
                    const target = document.querySelector(id);
                    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
                }
            });
        });
    }

    /* Micrometer */
    const micro = document.getElementById('micrometerFill');
    function updateMicro() {
        if (!micro) return;
        const h = document.documentElement;
        const sp = (h.scrollTop || document.body.scrollTop) / Math.max(1, (h.scrollHeight - h.clientHeight)) * 100;
        micro.style.width = Math.min(100, sp) + '%';
    }
    document.addEventListener('scroll', updateMicro, { passive: true });

    /* Header scrolled state */
    const head = document.getElementById('siteHead');
    function updateHead() {
        if (!head) return;
        head.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    document.addEventListener('scroll', updateHead, { passive: true });
    updateHead();

    /* Mobile menu */
    const burger = document.getElementById('burger');
    const mobile = document.getElementById('mobileMenu');
    function closeMobile() { burger?.classList.remove('is-open'); mobile?.classList.remove('is-open'); burger?.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
    function openMobile() { burger?.classList.add('is-open'); mobile?.classList.add('is-open'); burger?.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
    burger?.addEventListener('click', () => {
        burger.classList.contains('is-open') ? closeMobile() : openMobile();
    });
    mobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobile));

    /* Reveal on scroll */
    let revealObserver = null;
    function startReveals() {
        const els = document.querySelectorAll('[data-reveal]');
        if (!('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('is-in'));
            return;
        }
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        els.forEach(el => revealObserver.observe(el));
    }

    /* Counters */
    function animateCounters() {
        const els = document.querySelectorAll('[data-count]');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                const el = en.target;
                const target = parseInt(el.dataset.count, 10) || 0;
                const span = el.querySelector('span') || el;
                const start = performance.now();
                const dur = 1400;
                const tick = (t) => {
                    const p = Math.min(1, (t - start) / dur);
                    const eased = 1 - Math.pow(1 - p, 3);
                    span.textContent = Math.floor(target * eased);
                    if (p < 1) requestAnimationFrame(tick);
                    else span.textContent = target;
                };
                requestAnimationFrame(tick);
                obs.unobserve(el);
            });
        }, { threshold: 0.4 });
        els.forEach(el => obs.observe(el));
    }

    /* FAQ accordion */
    document.querySelectorAll('.faq__item').forEach(item => {
        const btn = item.querySelector('.faq__q');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const open = item.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.querySelectorAll('.faq__item.is-open').forEach(other => {
                if (other !== item) { other.classList.remove('is-open'); other.querySelector('.faq__q')?.setAttribute('aria-expanded', 'false'); }
            });
        });
    });

    /* Portfolio filter (used on /portfolio.html) */
    document.querySelectorAll('[data-filter-group]').forEach(group => {
        const items = group.querySelectorAll('[data-filter-item]');
        const btns = group.querySelectorAll('.filter');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const f = btn.dataset.filter;
                btns.forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                items.forEach(it => {
                    if (f === 'all' || it.dataset.cat === f) it.style.display = '';
                    else it.style.display = 'none';
                });
            });
        });
    });

    /* Lightbox + gallery (delegated) */
    const lb = document.getElementById('lightbox');
    if (lb) {
        const lbImg = lb.querySelector('.lightbox__img');
        const lbTitle = lb.querySelector('.lightbox__title');
        const lbCounter = lb.querySelector('.lightbox__counter');
        const lbThumbs = lb.querySelector('.lightbox__thumbs');
        const closeBtn = lb.querySelector('.lightbox__close');
        const prevBtn = lb.querySelector('.lightbox__prev');
        const nextBtn = lb.querySelector('.lightbox__next');

        let gallery = [];
        let idx = 0;
        let title = '';

        function render() {
            if (!gallery.length) return;
            idx = ((idx % gallery.length) + gallery.length) % gallery.length;
            const src = gallery[idx];
            lbImg.style.opacity = '0';
            const im = new Image();
            im.onload = () => { lbImg.src = src; lbImg.style.opacity = '1'; };
            im.onerror = () => { lbImg.src = src; lbImg.style.opacity = '1'; };
            im.src = src;
            if (lbTitle) lbTitle.textContent = title;
            if (lbCounter) lbCounter.textContent = `${String(idx + 1).padStart(2,'0')} / ${String(gallery.length).padStart(2,'0')}`;
            if (lbThumbs) {
                lbThumbs.querySelectorAll('.lightbox__thumb').forEach((t, i) => {
                    t.classList.toggle('is-active', i === idx);
                    if (i === idx) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                });
            }
            const single = gallery.length <= 1;
            prevBtn?.classList.toggle('is-hidden', single);
            nextBtn?.classList.toggle('is-hidden', single);
            if (lbCounter) lbCounter.style.display = single ? 'none' : '';
            if (lbThumbs) lbThumbs.style.display = single ? 'none' : '';
        }

        function buildThumbs() {
            if (!lbThumbs) return;
            lbThumbs.innerHTML = '';
            gallery.forEach((src, i) => {
                const t = document.createElement('button');
                t.className = 'lightbox__thumb';
                t.style.backgroundImage = `url("${src.replace(/"/g, '\\"')}")`;
                t.setAttribute('aria-label', `Зображення ${i + 1}`);
                t.addEventListener('click', (e) => { e.stopPropagation(); idx = i; render(); });
                lbThumbs.appendChild(t);
            });
        }

        function open(srcOrSlug, t, sourceEl) {
            const map = window.PORTFOLIO_GALLERY || {};
            let resolved = null;
            if (sourceEl?.dataset?.gallery && map[sourceEl.dataset.gallery]) {
                resolved = map[sourceEl.dataset.gallery];
            } else if (typeof srcOrSlug === 'string' && map[srcOrSlug]) {
                resolved = map[srcOrSlug];
            }
            if (resolved) {
                gallery = resolved.images.slice();
                title = t || resolved.title || '';
                if (resolved.cat) title = `${resolved.title} · ${resolved.cat}`;
            } else {
                gallery = [srcOrSlug];
                title = t || '';
            }
            idx = 0;
            buildThumbs();
            lb.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            render();
        }
        function close() { lb.classList.remove('is-open'); document.body.style.overflow = ''; }
        function step(d) { if (gallery.length > 1) { idx += d; render(); } }

        document.querySelectorAll('[data-lightbox], [data-gallery]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const slug = el.dataset.gallery;
                const fallbackSrc = el.dataset.lightbox || el.querySelector('img')?.src;
                open(slug || fallbackSrc, el.dataset.title || el.querySelector('img')?.alt || '', el);
            });
        });

        closeBtn?.addEventListener('click', close);
        prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
        nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); step(1); });
        lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
        document.addEventListener('keydown', (e) => {
            if (!lb.classList.contains('is-open')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'ArrowLeft') step(-1);
        });

        /* swipe on touch */
        let tx0 = null;
        lb.addEventListener('touchstart', (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', (e) => {
            if (tx0 === null) return;
            const dx = (e.changedTouches[0].clientX - tx0);
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            tx0 = null;
        });
    }

    /* Init */
    function init() {
        initLenis();
        runPreloader();
        animateCounters();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.__lenis = () => lenis;
})();
