/* animations.js — kodesignengineer v2.2
   Premium GSAP + ScrollTrigger animation layer.
   ─ Hero kinetic entrance, title split, schematic draw-in, dial spin,
     live clock, data-tape marquee, magnetic CTAs, scroll parallax.
   ─ Site-wide: section title masks, service/case stagger, smooth
     trust marquee, FAQ height tween, portfolio tile stagger.
*/
(() => {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

    if (!hasGSAP) return; // CSS / IntersectionObserver fallback in main.js handles it

    if (hasST) gsap.registerPlugin(ScrollTrigger);

    // tell CSS that GSAP-managed reveals are taking over
    document.documentElement.classList.add('motion-ready');
    document.body.classList.add('motion-ready');

    gsap.defaults({ ease: 'expo.out', duration: 1 });

    /* ═══════════ Utility: char split for kinetic title ═══════════ */
    function splitChars(el) {
        if (el.dataset.split === 'done') return Array.from(el.querySelectorAll('.char'));
        const text = el.textContent;
        el.textContent = '';
        const frag = document.createDocumentFragment();
        const out = [];
        for (const ch of text) {
            if (ch === ' ' || ch === ' ') {
                frag.appendChild(document.createTextNode(' '));
                continue;
            }
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            frag.appendChild(span);
            out.push(span);
        }
        el.appendChild(frag);
        el.dataset.split = 'done';
        return out;
    }

    /* ═══════════ HERO MASTER TIMELINE ═══════════ */
    function initHero() {
        const hero = document.querySelector('[data-hero]');
        if (!hero) return;

        // Pre-set initial states
        const lines = hero.querySelectorAll('[data-line] .kinetic-line__inner');
        const eyebrow = hero.querySelector('[data-hero-eyebrow]');
        const lead = hero.querySelector('[data-hero-lead]');
        const legendItems = hero.querySelectorAll('[data-hero-legend] li');
        const actions = hero.querySelector('[data-hero-actions]');
        const metricsWrap = hero.querySelector('[data-hero-metrics]');
        const indexer = hero.querySelector('.hero__indexer');
        const stage = hero.querySelector('.hero__stage');

        if (reduced) {
            // make everything immediately visible
            gsap.set([lines, eyebrow, lead, legendItems, actions, metricsWrap, indexer, stage], { opacity: 1, y: 0, x: 0, clearProps: 'all' });
            document.body.classList.add('is-loaded');
            return;
        }

        gsap.set(lines, { yPercent: 110 });
        gsap.set(eyebrow, { opacity: 0, y: -10 });
        gsap.set(lead, { opacity: 0, y: 20 });
        gsap.set(legendItems, { opacity: 0, y: 12 });
        gsap.set(actions, { opacity: 0, y: 16 });
        gsap.set(metricsWrap, { opacity: 0, y: 20 });
        gsap.set(indexer, { opacity: 0, x: 30 });
        gsap.set(stage, { opacity: 0, scale: 0.96 });

        const startTL = () => {
            const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => document.body.classList.add('is-loaded') });

            tl.to(stage, { opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out' }, 0)
              .to(indexer, { opacity: 1, x: 0, duration: 1.0 }, 0.1)
              .to(eyebrow, { opacity: 1, y: 0, duration: 0.8 }, 0.15)
              .to(lines, { yPercent: 0, duration: 1.4, stagger: 0.09, ease: 'expo.out' }, 0.25)
              .to(lead, { opacity: 1, y: 0, duration: 0.9 }, 0.85)
              .to(legendItems, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06 }, 0.95)
              .to(actions, { opacity: 1, y: 0, duration: 0.9 }, 1.0)
              .to(metricsWrap, { opacity: 1, y: 0, duration: 1.0 }, 1.1);

            // Schematic SVG draw-in — expand groups into individual drawable primitives
            const drawTargets = [];
            hero.querySelectorAll('[data-draw]').forEach((el) => {
                if (el.tagName === 'g' || el.tagName === 'G') {
                    el.querySelectorAll('line, path, rect, circle, polyline, polygon').forEach(p => drawTargets.push(p));
                } else {
                    drawTargets.push(el);
                }
            });
            drawTargets.forEach(el => {
                let len = 1200;
                try {
                    if (typeof el.getTotalLength === 'function') {
                        len = el.getTotalLength() || 1200;
                    } else {
                        const bb = el.getBBox();
                        len = (bb.width + bb.height) * 2 || 1200;
                    }
                } catch (_) { len = 1200; }
                gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
            });
            tl.to(drawTargets, { strokeDashoffset: 0, duration: 1.4, stagger: 0.04, ease: 'power2.inOut' }, 0.35);

            // Hero metric counters: animate after metrics row is visible
            setTimeout(animateHeroCounters, 1100);
        };

        // wait for preloader to finish, otherwise fire after window load
        if (document.readyState === 'complete') {
            // give preloader its beat
            setTimeout(startTL, 1000);
        } else {
            window.addEventListener('load', () => setTimeout(startTL, 800));
        }

        /* Hero metric counters */
        function animateHeroCounters() {
            hero.querySelectorAll('.hero__metric-value[data-count]').forEach(el => {
                const target = parseInt(el.dataset.count, 10) || 0;
                const span = el.querySelector('span') || el;
                if (el.dataset.counted === '1') return;
                el.dataset.counted = '1';
                const obj = { v: 0 };
                gsap.to(obj, {
                    v: target,
                    duration: 1.6,
                    ease: 'expo.out',
                    onUpdate: () => { span.textContent = Math.floor(obj.v); },
                    onComplete: () => { span.textContent = target; }
                });
            });
        }
    }

    /* ═══════════ HERO MICRO ANIMATIONS ═══════════ */
    function initHeroMicros() {
        // Live clock (HH:MM:SS)
        const clock = document.querySelector('[data-clock]');
        if (clock) {
            const tick = () => {
                const d = new Date();
                const fmt = (n) => String(n).padStart(2, '0');
                clock.textContent = `${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`;
            };
            tick();
            setInterval(tick, 1000);
        }

        // Slot-machine dials. data-dial-init = digit to land on.
        document.querySelectorAll('[data-dial]').forEach((d, i) => {
            const target = parseInt(d.dataset.dialInit ?? '0', 10) || 0;
            // Wrap digit children in an inner stack we can translate
            if (!d.querySelector('.dial__stack')) {
                const stack = document.createElement('span');
                stack.className = 'dial__stack';
                while (d.firstChild) stack.appendChild(d.firstChild);
                d.appendChild(stack);
            }
            const stack = d.querySelector('.dial__stack');
            const cells = stack.children;
            const cellH = cells[0]?.getBoundingClientRect().height || 16;
            // Roll in: start ahead by full cycle (10 digits) and land on target
            gsap.set(stack, { y: -10 * cellH });
            gsap.to(stack, {
                y: -target * cellH,
                duration: 2.2,
                delay: 1.5 + i * 0.18,
                ease: 'expo.out'
            });

            // Re-roll periodically with the same target — feels alive
            const reroll = () => {
                if (reduced) return;
                gsap.fromTo(stack, { y: -10 * cellH - cellH }, {
                    y: -target * cellH,
                    duration: 1.6,
                    ease: 'expo.out',
                    delay: 8 + Math.random() * 6,
                    onComplete: reroll
                });
            };
            setTimeout(reroll, 6000 + i * 1500);
        });

        // Tape marquee (smooth GSAP infinite tween — pauses on hover)
        const tape = document.querySelector('[data-tape]');
        if (tape && !reduced) {
            // duplicate-content already in DOM; we tween width/2
            const updateTape = () => {
                gsap.killTweensOf(tape);
                const w = tape.scrollWidth / 2;
                if (w <= 0) return;
                gsap.set(tape, { x: 0 });
                gsap.to(tape, { x: -w, duration: w / 60, ease: 'none', repeat: -1 });
            };
            // wait fonts
            if (document.fonts?.ready) document.fonts.ready.then(updateTape);
            else setTimeout(updateTape, 600);
            window.addEventListener('resize', () => setTimeout(updateTape, 100));
            tape.parentElement.addEventListener('mouseenter', () => gsap.to(tape, { timeScale: 0.2, duration: 0.4, overwrite: false }));
            tape.parentElement.addEventListener('mouseleave', () => gsap.to(tape, { timeScale: 1, duration: 0.4, overwrite: false }));
        }
    }

    /* ═══════════ HERO KINETIC STRIP — slider-crank live animator ═══════════ */
    function initKineticStrip() {
        const svg = document.querySelector('.kstrip__svg');
        if (!svg) return;
        const rod = svg.querySelector('.krod');
        const slider = svg.querySelector('.kslider');
        if (!rod || !slider) return;

        const omegaEl = svg.querySelector('[data-omega]');
        const thetaEl = svg.querySelector('[data-theta]');
        const velEl   = svg.querySelector('[data-vel]');
        const forceEl = svg.querySelector('[data-force]');
        const rpmEl   = document.querySelector('.kstrip__rpm [data-rpm]');

        // World coords (match SVG): crank center (600,120), rail origin (840,120), slider rest x (1020).
        const CRANK_X = 600, CRANK_Y = 120, R = 42;
        const ROD_L = 378;
        const SLIDER_X0 = 1020;
        const period = reduced ? 12 : 3; // seconds per revolution — matches CSS .kcrank
        let start = performance.now();
        let rpmTarget = 1450;
        let rpmShown = 1450;

        function frame(now) {
            const t = (now - start) / 1000;
            const theta = (t / period) * Math.PI * 2 * -1; // matches kspin-rev (negative)
            // Crank pin world position
            const px = CRANK_X + R * Math.cos(theta);
            const py = CRANK_Y + R * Math.sin(theta);

            // Slider X: crank_x + sqrt(rodL^2 - (py-120)^2) → ensures rod length stays L
            const dy = py - CRANK_Y;
            const sx = px + Math.sqrt(Math.max(0, ROD_L * ROD_L - dy * dy));

            rod.setAttribute('x1', px.toFixed(2));
            rod.setAttribute('y1', py.toFixed(2));
            rod.setAttribute('x2', sx.toFixed(2));
            rod.setAttribute('y2', CRANK_Y);

            // Slider transform — slide along its rail (origin at world 840). Translate by (sx - 840 - 180), rest at 1020 → tx = 0
            const tx = sx - 1020;
            slider.setAttribute('transform', `translate(${(180 + tx).toFixed(2)} 0)`);

            // Live readouts
            if (thetaEl) thetaEl.textContent = (((-theta * 180 / Math.PI) % 360 + 360) % 360).toFixed(0);
            if (omegaEl) omegaEl.textContent = (Math.PI * 2 / period).toFixed(0);
            if (velEl) {
                const v = -R * Math.sin(theta) * (Math.PI * 2 / period) * 0.001 * 60; // arbitrary scale
                velEl.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
            }
            if (forceEl) {
                const f = 1.6 + Math.abs(Math.cos(theta)) * 0.6;
                forceEl.textContent = f.toFixed(2);
            }
            if (rpmEl) {
                // Wander RPM ±25 around 1450
                rpmTarget = 1450 + Math.sin(t * 0.4) * 18 + Math.sin(t * 1.7) * 8;
                rpmShown += (rpmTarget - rpmShown) * 0.06;
                rpmEl.textContent = Math.round(rpmShown);
            }

            req = requestAnimationFrame(frame);
        }

        let req = requestAnimationFrame(frame);

        // Pause when out of view to save CPU
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        if (!req) { start = performance.now() - (period * 1000 / 2); req = requestAnimationFrame(frame); }
                    } else {
                        cancelAnimationFrame(req); req = 0;
                    }
                });
            }, { threshold: 0.05 });
            io.observe(svg);
        }
    }

    /* ═══════════ MAGNETIC BUTTONS ═══════════ */
    function initMagnetic() {
        if (reduced) return;
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!fine) return;
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            const strength = parseFloat(el.dataset.magnetic) || 0.35;
            const setX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'expo.out' });
            const setY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'expo.out' });
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * strength;
                const dy = (e.clientY - (r.top + r.height / 2)) * strength;
                setX(dx); setY(dy);
            });
            el.addEventListener('mouseleave', () => { setX(0); setY(0); });
        });
    }

    /* ═══════════ SITE-WIDE REVEALS via ScrollTrigger ═══════════ */
    function initSiteReveals() {
        if (!hasST || reduced) return;

        // Override main.js IntersectionObserver behavior: kick all data-reveal back to invisible state managed by GSAP
        const reveals = document.querySelectorAll('[data-reveal]:not([data-hero-eyebrow]):not([data-hero-lead]):not([data-hero-legend]):not([data-hero-actions]):not([data-hero-metrics])');

        reveals.forEach(el => {
            // skip elements inside hero (hero handles its own)
            if (el.closest('[data-hero]')) return;

            const dir = el.dataset.reveal || 'up';
            let from = { opacity: 0, y: 28 };
            if (dir === 'left') from = { opacity: 0, x: -32 };
            else if (dir === 'right') from = { opacity: 0, x: 32 };
            else if (dir === 'scale') from = { opacity: 0, scale: 0.94 };

            gsap.fromTo(el, from, {
                opacity: 1, x: 0, y: 0, scale: 1,
                duration: 1.1,
                ease: 'expo.out',
                delay: parseFloat(el.style.getPropertyValue('--d')) || 0,
                scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' }
            });
        });

        /* Section heads — letter-stagger mask reveal for big titles */
        document.querySelectorAll('.sheet-head__title, .page-hero__title').forEach(title => {
            // wrap each line in mask if not already
            // Simpler: animate the whole title from y -> 0 with mask via clip-path
            gsap.fromTo(title, { clipPath: 'inset(0 0 100% 0)', y: 18 }, {
                clipPath: 'inset(0 0 0% 0)',
                y: 0,
                duration: 1.4,
                ease: 'expo.out',
                scrollTrigger: { trigger: title, start: 'top 88%' }
            });
        });

        /* Service cards — stagger with subtle scale */
        const services = document.querySelectorAll('.service');
        if (services.length) {
            gsap.fromTo(services, { opacity: 0, y: 40, scale: 0.98 }, {
                opacity: 1, y: 0, scale: 1,
                duration: 1.1, ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: services[0].parentElement, start: 'top 80%' }
            });
        }

        /* Calculator */
        const calc = document.querySelector('.calc');
        if (calc) {
            gsap.fromTo(calc.children, { opacity: 0, y: 30 }, {
                opacity: 1, y: 0,
                duration: 1.0, ease: 'expo.out',
                stagger: 0.12,
                scrollTrigger: { trigger: calc, start: 'top 82%' }
            });
        }

        /* Case studies — visual parallax + body slide */
        document.querySelectorAll('.case').forEach((c) => {
            const visual = c.querySelector('.case__visual img');
            const body = c.querySelector('.case__body');
            if (visual) {
                gsap.fromTo(visual, { scale: 1.12, y: 30 }, {
                    scale: 1, y: 0,
                    duration: 1.6, ease: 'expo.out',
                    scrollTrigger: { trigger: c, start: 'top 88%' }
                });
                // soft scrub-tied parallax
                gsap.to(visual, {
                    yPercent: -8, ease: 'none',
                    scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: 0.4 }
                });
            }
            if (body) {
                const items = body.querySelectorAll(':scope > *');
                gsap.fromTo(items, { opacity: 0, y: 24 }, {
                    opacity: 1, y: 0,
                    duration: 0.9, ease: 'expo.out', stagger: 0.06,
                    scrollTrigger: { trigger: c, start: 'top 80%' }
                });
            }
        });

        /* Process steps — fan stagger */
        const steps = document.querySelectorAll('.process__step');
        if (steps.length) {
            gsap.fromTo(steps, { opacity: 0, y: 50, rotateZ: 1.2 }, {
                opacity: 1, y: 0, rotateZ: 0,
                duration: 1.0, ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: steps[0].parentElement, start: 'top 82%' }
            });
        }

        /* Portfolio cards (preview + grid) */
        const portCards = document.querySelectorAll('.port-card, .port-item');
        if (portCards.length) {
            gsap.fromTo(portCards, { opacity: 0, y: 36, scale: 0.97 }, {
                opacity: 1, y: 0, scale: 1,
                duration: 0.9, ease: 'expo.out',
                stagger: { each: 0.05, from: 'start' },
                scrollTrigger: { trigger: portCards[0].parentElement, start: 'top 85%' }
            });
        }

        /* Testimonials / quotes */
        const quotes = document.querySelectorAll('.quote');
        if (quotes.length) {
            gsap.fromTo(quotes, { opacity: 0, y: 28 }, {
                opacity: 1, y: 0,
                duration: 1.0, ease: 'expo.out',
                stagger: 0.1,
                scrollTrigger: { trigger: quotes[0].parentElement, start: 'top 84%' }
            });
        }

        /* Brief form — split intro and form */
        document.querySelectorAll('.brief__intro, .brief__form').forEach(el => {
            gsap.fromTo(el, { opacity: 0, y: 30 }, {
                opacity: 1, y: 0,
                duration: 1.1, ease: 'expo.out',
                scrollTrigger: { trigger: el, start: 'top 86%' }
            });
        });

        /* Footer chips */
        const footChips = document.querySelectorAll('.foot-grid > *, .foot-meta > *');
        if (footChips.length) {
            gsap.fromTo(footChips, { opacity: 0, y: 18 }, {
                opacity: 1, y: 0,
                duration: 0.8, ease: 'expo.out',
                stagger: 0.05,
                scrollTrigger: { trigger: footChips[0].closest('footer, .site-foot'), start: 'top 90%' }
            });
        }

        /* Generic counters animated when in view (handles non-hero counters) */
        document.querySelectorAll('[data-count]').forEach(el => {
            if (el.closest('[data-hero]')) return; // hero handled separately
            if (el.dataset.counted === '1') return;
            const target = parseInt(el.dataset.count, 10);
            if (!Number.isFinite(target)) return;
            const span = el.querySelector('span') || el;
            ScrollTrigger.create({
                trigger: el,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    if (el.dataset.counted === '1') return;
                    el.dataset.counted = '1';
                    const obj = { v: 0 };
                    gsap.to(obj, {
                        v: target,
                        duration: 1.5, ease: 'expo.out',
                        onUpdate: () => { span.textContent = Math.floor(obj.v); },
                        onComplete: () => { span.textContent = target; }
                    });
                }
            });
        });
    }

    /* ═══════════ TRUST MARQUEE — replace CSS keyframe with smooth GSAP loop ═══════════ */
    function initTrustMarquee() {
        const tracks = document.querySelectorAll('.trust__track');
        if (!tracks.length) return;
        tracks.forEach(track => {
            track.style.animation = 'none';
            if (reduced) return;
            const update = () => {
                gsap.killTweensOf(track);
                const w = track.scrollWidth / 2;
                if (w <= 0) return;
                gsap.set(track, { x: 0 });
                gsap.to(track, { x: -w, duration: Math.max(28, w / 50), ease: 'none', repeat: -1 });
            };
            if (document.fonts?.ready) document.fonts.ready.then(update);
            else setTimeout(update, 700);
            window.addEventListener('resize', () => setTimeout(update, 100));

            track.parentElement.addEventListener('mouseenter', () => gsap.to(track, { timeScale: 0.18, duration: 0.5 }));
            track.parentElement.addEventListener('mouseleave', () => gsap.to(track, { timeScale: 1, duration: 0.5 }));
        });
    }

    /* ═══════════ FAQ — smooth GSAP height ═══════════ */
    function initFAQ() {
        document.querySelectorAll('.faq__item').forEach(item => {
            const a = item.querySelector('.faq__a');
            const inner = item.querySelector('.faq__a-inner');
            if (!a || !inner) return;

            // Disable the CSS grid-row transition so it doesn't race with GSAP's height tween
            a.style.transition = 'none';
            gsap.set(a, { height: 0, opacity: 0, overflow: 'hidden' });

            const observer = new MutationObserver(() => {
                if (item.classList.contains('is-open')) {
                    // Measure real content height — avoids GSAP's height:'auto' flash-measure bug in grid context
                    const h = inner.scrollHeight;
                    gsap.fromTo(a,
                        { height: 0, opacity: 0 },
                        {
                            height: h, opacity: 1,
                            duration: 0.5, ease: 'expo.out',
                            onComplete: () => gsap.set(a, { height: 'auto' })
                        }
                    );
                } else {
                    gsap.to(a, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut' });
                }
            });
            observer.observe(item, { attributes: true, attributeFilter: ['class'] });
        });
    }

    /* ═══════════ HEADER always visible (fixed) ═══════════ */
    function initHeader() {
        const head = document.getElementById('siteHead');
        if (!head) return;
        gsap.set(head, { yPercent: 0 });
    }

    /* ═══════════ Lenis ↔ ScrollTrigger sync ═══════════ */
    function syncLenisScrollTrigger() {
        if (!hasST) return;
        const tryLink = () => {
            const lenis = window.__lenis?.();
            if (!lenis) return false;
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
            return true;
        };
        if (tryLink()) return;
        // Lenis init in main.js may run after us; retry once.
        setTimeout(tryLink, 200);
        setTimeout(tryLink, 800);
    }

    /* ═══════════ Init ═══════════ */
    function init() {
        initHero();
        initHeroMicros();
        initKineticStrip();
        initMagnetic();
        initSiteReveals();
        initTrustMarquee();
        initFAQ();
        initHeader();
        syncLenisScrollTrigger();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
