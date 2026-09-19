/* services.js — сцена «одна деталь, чотири стани» + мікровзаємодії сторінки послуг */
(() => {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ready = (fn) => (document.readyState === 'loading')
        ? document.addEventListener('DOMContentLoaded', fn)
        : fn();

    /* ─────────────────────────────────────────────────────────────────
       Сцена
       ───────────────────────────────────────────────────────────────── */
    function initStage() {
        const stage = document.querySelector('[data-stage]');
        if (!stage) return;

        const viewport = stage.querySelector('[data-stage-viewport]');
        const shots = Array.from(stage.querySelectorAll('[data-shot]'));
        const overs = Array.from(stage.querySelectorAll('[data-over]'));
        const cards = Array.from(stage.querySelectorAll('[data-card]'));
        const steps = Array.from(stage.querySelectorAll('[data-step]'));
        const indexEl = stage.querySelector('[data-stage-index]');
        const hint = stage.querySelector('[data-stage-hint]');
        if (!shots.length) return;

        const overFor = (i) => overs.find(o => Number(o.dataset.over) === i) || null;

        /* Відеокадр крутиться лише поки його стан активний: інакше він
           молотить декодером за межами екрана й з'їдає кадри в решти сцени. */
        const video = stage.querySelector('[data-stage-video]');
        const videoShot = video ? video.closest('[data-shot]') : null;
        const videoIndex = videoShot ? Number(videoShot.dataset.shot) : -1;
        const syncVideo = (idx) => {
            if (!video) return;
            if (idx === videoIndex) {
                if (video.paused) video.play().catch(() => { /* автоплей міг не дозволити */ });
            } else if (!video.paused) {
                video.pause();
            }
        };

        /* стартовий стан — завжди видимий перший кадр */
        const show = (el, v) => { if (el) el.style.opacity = String(v); };
        shots.forEach((s, i) => show(s, i === 0 ? 1 : 0));
        cards.forEach((c, i) => show(c, i === 0 ? 1 : 0));
        overs.forEach(o => show(o, Number(o.dataset.over) === 0 ? 1 : 0));

        if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            steps.forEach((s, i) => s.classList.toggle('is-on', i === 0));
            stage.querySelectorAll('[data-count-to]').forEach(el => { el.textContent = el.dataset.countTo; });
            stage.querySelectorAll('[data-plot]').forEach(el => el.classList.add('is-static'));
            if (hint) hint.classList.add('is-gone');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        const HOLD = 1, FADE = 0.55;

        const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: stage,
                start: 'top top',
                end: () => '+=' + Math.round(window.innerHeight * 3.4),
                pin: viewport,
                pinSpacing: true,
                scrub: 0.6,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const idx = Math.min(shots.length - 1, Math.floor(self.progress * shots.length + 0.0001));
                    steps.forEach((s, i) => s.classList.toggle('is-on', i === idx));
                    if (indexEl) indexEl.textContent = String(idx + 1).padStart(2, '0');
                    if (hint) hint.classList.toggle('is-gone', self.progress > 0.04);
                    syncVideo(idx);
                }
            }
        });

        /* ── Кадр 03: аркуш друкується плотером ──────────────────────────
           t0 — момент, коли папір уже ліг на стіл і перо стає на верхній край.
           Шторка (.sheet__mask) сходить донизу й відкриває друк, перо їде на її
           краю як частина тієї самої трансформації. Виноски вистрілюють рівно
           тоді, коли перо проходить свій рядок специфікації. */
        function addPlot(plot, t0) {
            const mask  = plot.querySelector('[data-plot-mask]');
            const pen   = plot.querySelector('[data-plot-pen]');
            const stamp = plot.querySelector('[data-plot-stamp] rect');
            const RUN   = HOLD * 0.50;   /* решта HOLD — пауза на готовому аркуші */

            /* папір лягає на стіл */
            tl.fromTo(plot,
                { y: 24, scale: 0.985 },
                { y: 0, scale: 1, duration: FADE, ease: 'power2.out' },
                Math.max(0, t0 - FADE));

            /* прохід пера */
            if (mask) tl.fromTo(mask, { yPercent: 0 }, { yPercent: 100, duration: RUN }, t0);
            if (pen) {
                tl.fromTo(pen, { opacity: 0 }, { opacity: 1, duration: RUN * 0.06 }, t0);
                tl.to(pen, { opacity: 0, duration: RUN * 0.08 }, t0 + RUN * 0.92);
            }

            /* штамп обводиться останнім — разом із лічильником «32 аркуші» */
            if (stamp) tl.fromTo(stamp,
                { strokeDashoffset: 1 },
                { strokeDashoffset: 0, duration: 0.2, ease: 'none' },
                t0 + RUN * 0.96);
        }

        let at = 0;
        shots.forEach((shot, i) => {
            const card = cards[i];
            const over = overFor(i);
            const bar = steps[i] ? steps[i].querySelector('.stage__step-bar i') : null;
            const plot = shot.querySelector('[data-plot]');

            if (i > 0) {
                const prev = [shots[i - 1], cards[i - 1], overFor(i - 1)].filter(Boolean);
                tl.to(prev, { opacity: 0, duration: FADE }, at);
                tl.fromTo([shot, card, over].filter(Boolean), { opacity: 0 }, { opacity: 1, duration: FADE }, at);
                /* аркуш не наїжджає — він лягає на стіл, це робить addPlot */
                /* Масштаб іде знизу вгору (0.97 → 1), а не згори вниз.
                   При 1.06 кадр вилазив за межі сцени, а .stage__viewport має
                   overflow:hidden — боки картинки зрізало на весь час наїзду. */
                if (!plot) tl.fromTo(shot, { scale: 0.97 }, { scale: 1, duration: FADE + HOLD }, at);
                if (card) tl.fromTo(card, { y: 26 }, { y: 0, duration: FADE }, at);
            } else {
                tl.fromTo(shot, { scale: 0.985 }, { scale: 1, duration: HOLD }, at);
            }

            /* промальовування технічних ліній накладки */
            if (over) {
                const strokes = over.querySelectorAll('[data-draw]');
                strokes.forEach((el, k) => {
                    let len = 0;
                    try { len = el.getTotalLength ? el.getTotalLength() : 0; } catch (e) { len = 0; }
                    if (!len) return;
                    tl.fromTo(el,
                        { strokeDasharray: len, strokeDashoffset: len },
                        { strokeDashoffset: 0, duration: HOLD * 0.55 },
                        at + (i > 0 ? FADE : 0) + k * 0.04);
                });
            }

            /* лічильники стану */
            if (card) {
                card.querySelectorAll('[data-count-to]').forEach(el => {
                    const target = parseFloat(el.dataset.countTo) || 0;
                    const box = { v: 0 };
                    tl.to(box, {
                        v: target,
                        duration: HOLD * 0.72,
                        onUpdate() { el.textContent = String(Math.round(box.v)); }
                    }, at + (i > 0 ? FADE : 0));
                });
            }

            if (plot) addPlot(plot, at + (i > 0 ? FADE : 0));

            if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: HOLD }, at + (i > 0 ? FADE : 0));

            at += HOLD + (i < shots.length - 1 ? FADE : 0);
        });

    }

    /* ─────────────────────────────────────────────────────────────────
       Магнітні кнопки (канон: strength 0.4, elastic.out на відпускання)
       ───────────────────────────────────────────────────────────────── */
    function initMagnetic() {
        if (reduced || typeof gsap === 'undefined') return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        document.querySelectorAll('.btn--magnetic').forEach(btn => {
            const S = 0.4;
            const move = (e) => {
                const r = btn.getBoundingClientRect();
                gsap.to(btn, {
                    x: (e.clientX - (r.left + r.width / 2)) * S,
                    y: (e.clientY - (r.top + r.height / 2)) * S,
                    duration: 0.5,
                    ease: 'power3.out'
                });
            };
            const out = () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
            btn.addEventListener('mousemove', move);
            btn.addEventListener('mouseleave', out);
        });
    }

    /* ─────────────────────────────────────────────────────────────────
       Смуга прогресу стрічки скрінів SolidWorks
       ───────────────────────────────────────────────────────────────── */
    function initInsideBar() {
        const track = document.querySelector('.inside__track');
        const bar = document.querySelector('[data-inside-bar]');
        if (!track || !bar) return;
        const fill = bar.querySelector('i');
        if (!fill) return;
        bar.hidden = false;

        const update = () => {
            const max = track.scrollWidth - track.clientWidth;
            const p = max > 0 ? track.scrollLeft / max : 0;
            const w = Math.max(12, (track.clientWidth / track.scrollWidth) * 100);
            fill.style.width = w + '%';
            fill.style.transform = 'translate3d(' + (p * (100 - w) / w * 100) + '%,0,0)';
        };
        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();

        const count = document.querySelector('[data-inside-count]');
        if (count) count.textContent = String(track.querySelectorAll('.inside__shot').length).padStart(2, '0');
    }

    /* ─────────────────────────────────────────────────────────────────
       Слайдер «каркас → фінал» (сторінка візуалізації)
       ───────────────────────────────────────────────────────────────── */
    function initCompare() {
        document.querySelectorAll('.compare').forEach(box => {
            const top = box.querySelector('.compare__top');
            const handle = box.querySelector('.compare__handle');
            if (!top || !handle) return;

            const set = (clientX) => {
                const r = box.getBoundingClientRect();
                const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
                top.style.clipPath = 'inset(0 ' + ((1 - p) * 100).toFixed(2) + '% 0 0)';
                handle.style.transform = 'translate3d(' + ((p - 0.5) * r.width).toFixed(1) + 'px,0,0)';
            };

            let dragging = false;
            box.addEventListener('pointerdown', (e) => { dragging = true; box.setPointerCapture(e.pointerId); set(e.clientX); });
            box.addEventListener('pointermove', (e) => { if (dragging) set(e.clientX); });
            box.addEventListener('pointerup', () => { dragging = false; });
            box.addEventListener('pointercancel', () => { dragging = false; });
            box.addEventListener('mousemove', (e) => { if (!dragging) set(e.clientX); });
        });
    }

    /* ─────────────────────────────────────────────────────────────────
       Відео дисципліни крутиться лише поки видиме на екрані — інакше
       декодер молотить у фоні на кожному візиті сторінки.
       ───────────────────────────────────────────────────────────────── */
    function initDiscVideo() {
        const videos = Array.from(document.querySelectorAll('[data-disc-video]'));
        if (!videos.length) return;

        if (reduced || !('IntersectionObserver' in window)) return;   /* лишається постер */

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const v = entry.target;
                if (entry.isIntersecting) {
                    if (v.paused) v.play().catch(() => { /* автоплей міг не дозволити */ });
                } else if (!v.paused) {
                    v.pause();
                }
            });
        }, { threshold: 0.25 });

        videos.forEach(v => io.observe(v));
    }

    /* ─────────────────────────────────────────────────────────────────
       Стрічка SolidWorks: тягнеться мишею, колесо над нею гортає по
       горизонталі. На краях подія не перехоплюється — спливає далі й
       Lenis гортає сторінку, тож стрічка не стає пасткою для скролу.
       ───────────────────────────────────────────────────────────────── */
    function initStripDrag() {
        const track = document.querySelector('[data-strip]');
        if (!track) return;

        const maxScroll = () => track.scrollWidth - track.clientWidth;

        track.addEventListener('wheel', (e) => {
            const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
            if (!d) return;
            const max = maxScroll();
            if (max <= 0) return;
            const at = track.scrollLeft;
            /* уперлись у край — віддаємо скрол сторінці */
            if ((d < 0 && at <= 0) || (d > 0 && at >= max - 1)) return;
            e.preventDefault();
            e.stopPropagation();          /* інакше Lenis смикне ще й сторінку */
            track.scrollLeft = at + d;
        }, { passive: false });

        let down = false, startX = 0, startLeft = 0, moved = 0;

        track.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') return;   /* тач гортає нативно */
            down = true;
            moved = 0;
            startX = e.clientX;
            startLeft = track.scrollLeft;
            track.setPointerCapture(e.pointerId);
            track.classList.add('is-grabbing');
        });

        track.addEventListener('pointermove', (e) => {
            if (!down) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > moved) moved = Math.abs(dx);
            track.scrollLeft = startLeft - dx;
        });

        const release = (e) => {
            if (!down) return;
            down = false;
            track.classList.remove('is-grabbing');
            try { track.releasePointerCapture(e.pointerId); } catch (err) { /* вже віддано */ }
        };
        track.addEventListener('pointerup', release);
        track.addEventListener('pointercancel', release);

        /* тягнули, а не клікали — лайтбокс не відкриваємо */
        track.addEventListener('click', (e) => {
            if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    }

    ready(() => {
        initStage();
        initMagnetic();
        initInsideBar();
        initCompare();
        initStripDrag();
        initDiscVideo();
    });
})();
