/* ═══════════════════════════════════════════════════════════════
   MAIN.JS — Design Engineer Portfolio · PREMIUM
   Костянтин Оверченко · 2026
   GSAP + ScrollTrigger + Lenis · Premium Animations
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ════════════════════════════════
    // PRELOADER
    // ════════════════════════════════
    const preloader = document.getElementById('preloader');
    const preloaderFill = document.getElementById('preloaderFill');
    const preloaderCounter = document.getElementById('preloaderCounter');
    let progress = 0;

    function updateLoader() {
        progress += Math.random() * 10 + 4;
        if (progress > 100) progress = 100;

        const rounded = Math.round(progress);
        if (preloaderCounter) preloaderCounter.textContent = rounded;
        if (preloaderFill) preloaderFill.style.width = rounded + '%';

        if (progress < 100) {
            setTimeout(updateLoader, 70 + Math.random() * 160);
        } else {
            setTimeout(() => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(preloader, {
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power3.inOut',
                        onComplete: () => {
                            preloader.classList.add('is-hidden');
                            preloader.style.display = 'none';
                            document.body.style.overflow = '';
                            initAll();
                            playEntrance();
                        }
                    });
                } else {
                    preloader.classList.add('is-hidden');
                    document.body.style.overflow = '';
                    initAll();
                }
            }, 300);
        }
    }

    document.body.style.overflow = 'hidden';
    setTimeout(updateLoader, 300);

    // ════════════════════════════════
    // INIT
    // ════════════════════════════════
    function initAll() {
        initLenis();
        initNavigation();
        initCustomCursor();
        initTypingEffect();
        initScrollAnimations();
        initParallax();
        initMagneticButtons();
        initPortfolioTabs();
        initLightbox();
        initTestimonialsSlider();
        initCounterAnimations();
        initTimelineFill();
        initDrawingsViewer();
        initContactForm();
        initTiltCards();
    }

    // ════════════════════════════════
    // ENTRANCE ANIMATION (after preloader)
    // ════════════════════════════════
    function playEntrance() {
        if (typeof gsap === 'undefined') return;
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Hero badge
        const badge = document.querySelector('.hero__badge');
        if (badge) {
            tl.fromTo(badge, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1);
        }

        // Hero title lines — split into chars for premium reveal
        const titleLines = document.querySelectorAll('.hero__title-line');
        titleLines.forEach((line, i) => {
            const chars = splitTextIntoSpans(line);
            tl.fromTo(chars,
                { opacity: 0, y: 60, rotateX: -40 },
                { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.02, ease: 'power3.out' },
                0.2 + i * 0.15
            );
        });

        // Hero subtitle
        const subtitle = document.querySelector('.hero__subtitle');
        if (subtitle) {
            tl.fromTo(subtitle, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, 0.7);
        }

        // Hero actions
        const actions = document.querySelector('.hero__actions');
        if (actions) {
            tl.fromTo(actions, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.85);
        }

        // Hero metrics
        const metrics = document.querySelector('.hero__metrics');
        if (metrics) {
            tl.fromTo(metrics, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 1.0);
        }

        // Scroll indicator
        const scroll = document.querySelector('.hero__scroll');
        if (scroll) {
            tl.fromTo(scroll, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.2);
        }
    }

    // ── Split Text Helper ───────────────────────
    function splitTextIntoSpans(el) {
        const text = el.textContent;
        el.innerHTML = '';
        el.style.perspective = '600px';
        const spans = [];
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, opacity';
            el.appendChild(span);
            spans.push(span);
        });
        return spans;
    }

    // ════════════════════════════════
    // LENIS SMOOTH SCROLL
    // ════════════════════════════════
    let lenis;
    function initLenis() {
        if (typeof Lenis === 'undefined') return;

        lenis = new Lenis({
            duration: 1.3,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
        }
    }

    // ════════════════════════════════
    // NAVIGATION
    // ════════════════════════════════
    function initNavigation() {
        const header = document.getElementById('header');
        const burger = document.getElementById('burger');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('.mobile-menu__link') : [];

        window.addEventListener('scroll', () => {
            if (header) header.classList.toggle('is-scrolled', window.scrollY > 60);
        });

        if (burger && mobileMenu) {
            burger.addEventListener('click', () => {
                burger.classList.toggle('is-active');
                mobileMenu.classList.toggle('is-active');
                document.body.style.overflow = mobileMenu.classList.contains('is-active') ? 'hidden' : '';
            });

            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    burger.classList.remove('is-active');
                    mobileMenu.classList.remove('is-active');
                    document.body.style.overflow = '';
                });
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    if (lenis) {
                        lenis.scrollTo(target, { offset: -80 });
                    } else {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // ════════════════════════════════
    // CUSTOM CURSOR
    // ════════════════════════════════
    function initCustomCursor() {
        if (window.matchMedia('(hover: none)').matches) return;

        const cursor = document.querySelector('.cursor');
        const cursorDot = document.querySelector('.cursor-dot');
        if (!cursor || !cursorDot) return;

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let dotX = 0, dotY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.classList.add('is-visible');
            cursorDot.classList.add('is-visible');
        });

        document.addEventListener('mouseleave', () => {
            cursor.classList.remove('is-visible');
            cursorDot.classList.remove('is-visible');
        });

        function animateCursor() {
            // Smooth follow for outer ring
            cursorX += (mouseX - cursorX) * 0.12;
            cursorY += (mouseY - cursorY) * 0.12;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';

            // Faster follow for dot
            dotX += (mouseX - dotX) * 0.5;
            dotY += (mouseY - dotY) * 0.5;
            cursorDot.style.left = dotX + 'px';
            cursorDot.style.top = dotY + 'px';

            requestAnimationFrame(animateCursor);
        }
        requestAnimationFrame(animateCursor);

        // Hover states
        const hoverTargets = document.querySelectorAll('a, button, .portfolio__item-inner, .featured__card, .stat-card, .process__card, .cert, .timeline__card, .drawings__sidebar-item, .contact__link, input, textarea');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
        });

        document.addEventListener('mousedown', () => cursor.classList.add('is-active'));
        document.addEventListener('mouseup', () => cursor.classList.remove('is-active'));
    }

    // ════════════════════════════════
    // TYPING EFFECT
    // ════════════════════════════════
    function initTypingEffect() {
        const el = document.getElementById('typedText');
        if (!el) return;

        const phrases = [
            'конструкції для реального виробництва',
            'рішення без "потім допиляємо"',
            'технічну документацію під ключ',
            'інноваційні інженерні проєкти',
        ];
        let phraseIdx = 0;
        let charIdx = 0;
        let deleting = false;
        let speed = 60;

        function type() {
            const phrase = phrases[phraseIdx];

            if (!deleting) {
                el.textContent = phrase.substring(0, charIdx + 1);
                charIdx++;
                if (charIdx === phrase.length) {
                    deleting = true;
                    speed = 2500;
                } else {
                    speed = 35 + Math.random() * 30;
                }
            } else {
                el.textContent = phrase.substring(0, charIdx - 1);
                charIdx--;
                speed = 18;
                if (charIdx === 0) {
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                    speed = 400;
                }
            }

            setTimeout(type, speed);
        }
        setTimeout(type, 1800);
    }

    // ════════════════════════════════
    // SCROLL ANIMATIONS (GSAP premium)
    // ════════════════════════════════
    function initScrollAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // ── Fade Up reveals ──
        document.querySelectorAll('[data-animate="fade-up"]').forEach(el => {
            const delay = parseFloat(el.dataset.delay) || 0;
            gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: 0.9,
                delay: delay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    once: true,
                }
            });
        });

        // ── Fade Left ──
        document.querySelectorAll('[data-animate="fade-left"]').forEach(el => {
            const delay = parseFloat(el.dataset.delay) || 0;
            gsap.to(el, {
                opacity: 1,
                x: 0,
                duration: 0.9,
                delay: delay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    once: true,
                }
            });
        });

        // ── Fade Right ──
        document.querySelectorAll('[data-animate="fade-right"]').forEach(el => {
            const delay = parseFloat(el.dataset.delay) || 0;
            gsap.to(el, {
                opacity: 1,
                x: 0,
                duration: 0.9,
                delay: delay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    once: true,
                }
            });
        });

        // ── Fade Scale ──
        document.querySelectorAll('[data-animate="fade-scale"]').forEach(el => {
            const delay = parseFloat(el.dataset.delay) || 0;
            gsap.to(el, {
                opacity: 1,
                scale: 1,
                duration: 0.9,
                delay: delay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    once: true,
                }
            });
        });

        // ── Section titles — split lines reveal ──
        document.querySelectorAll('.section__title').forEach(title => {
            const chars = splitTextIntoSpans(title);
            gsap.fromTo(chars,
                { opacity: 0, y: 30, rotateX: -30 },
                {
                    opacity: 1, y: 0, rotateX: 0,
                    duration: 0.6,
                    stagger: 0.015,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: title,
                        start: 'top 85%',
                        once: true,
                    }
                }
            );
        });

        // ── Stagger reveal for card grids ──
        const grids = ['.about__stats', '.process__grid', '.drawings__features', '.certs__grid'];
        grids.forEach(selector => {
            const grid = document.querySelector(selector);
            if (!grid) return;
            const cards = grid.children;
            gsap.fromTo(cards,
                { opacity: 0, y: 40, scale: 0.95 },
                {
                    opacity: 1, y: 0, scale: 1,
                    duration: 0.7,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: grid,
                        start: 'top 82%',
                        once: true,
                    }
                }
            );
        });

        // ── Featured cards stagger ──
        const featuredGrid = document.querySelector('.featured__grid');
        if (featuredGrid) {
            gsap.fromTo(featuredGrid.children,
                { opacity: 0, y: 50 },
                {
                    opacity: 1, y: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: featuredGrid,
                        start: 'top 80%',
                        once: true,
                    }
                }
            );
        }

        // ── Parallax on featured card images ──
        document.querySelectorAll('.featured__img img').forEach(img => {
            gsap.to(img, {
                yPercent: -10,
                ease: 'none',
                scrollTrigger: {
                    trigger: img.closest('.featured__card'),
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5,
                }
            });
        });

        // ── Portfolio items stagger on scroll ──
        const portfolioGrid = document.getElementById('portfolioGrid');
        if (portfolioGrid) {
            gsap.fromTo(portfolioGrid.children,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0,
                    duration: 0.7,
                    stagger: 0.07,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: portfolioGrid,
                        start: 'top 80%',
                        once: true,
                    }
                }
            );
        }
    }

    // ════════════════════════════════
    // PARALLAX (Hero orbs & decorations)
    // ════════════════════════════════
    function initParallax() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        // Hero orbs parallax
        const orb1 = document.querySelector('.hero__orb--1');
        const orb2 = document.querySelector('.hero__orb--2');
        if (orb1) {
            gsap.to(orb1, {
                y: 150, x: -30,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2 }
            });
        }
        if (orb2) {
            gsap.to(orb2, {
                y: -80, x: 40,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2 }
            });
        }

        // About photo parallax
        const aboutPhoto = document.querySelector('.about__photo');
        if (aboutPhoto) {
            gsap.to(aboutPhoto, {
                y: -30,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.about',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 2,
                }
            });
        }
    }

    // ════════════════════════════════
    // MAGNETIC BUTTONS
    // ════════════════════════════════
    function initMagneticButtons() {
        if (window.matchMedia('(hover: none)').matches) return;

        const magnetics = document.querySelectorAll('.btn, .header__cta, .testimonials__btn, .footer__social a');

        magnetics.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const strength = 0.25;

                el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
                el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                setTimeout(() => { el.style.transition = ''; }, 500);
            });
        });
    }

    // ════════════════════════════════
    // TILT CARDS (3D micro-tilt on hover)
    // ════════════════════════════════
    function initTiltCards() {
        if (window.matchMedia('(hover: none)').matches) return;

        const tiltTargets = document.querySelectorAll('.featured__card, .stat-card, .timeline__card');

        tiltTargets.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                const tiltX = y * -6;
                const tiltY = x * 6;

                card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
                card.style.transition = 'transform 0.1s ease-out';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            });
        });
    }

    // ════════════════════════════════
    // PORTFOLIO TABS
    // ════════════════════════════════
    function initPortfolioTabs() {
        const tabs = document.querySelectorAll('.portfolio__tab');
        const items = document.querySelectorAll('.portfolio__item');
        if (!tabs.length || !items.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const category = tab.dataset.tab;

                items.forEach((item, i) => {
                    const cats = item.dataset.category || '';
                    const show = category === 'all' || cats.includes(category);

                    if (show) {
                        item.classList.remove('is-hidden');
                        if (typeof gsap !== 'undefined') {
                            gsap.fromTo(item,
                                { opacity: 0, y: 24, scale: 0.96 },
                                { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: i * 0.04, ease: 'power3.out' }
                            );
                        } else {
                            item.style.opacity = '1';
                            item.style.transform = 'none';
                        }
                    } else {
                        if (typeof gsap !== 'undefined') {
                            gsap.to(item, {
                                opacity: 0, y: 16, scale: 0.96,
                                duration: 0.3,
                                onComplete: () => item.classList.add('is-hidden')
                            });
                        } else {
                            item.classList.add('is-hidden');
                        }
                    }
                });
            });
        });
    }

    // ════════════════════════════════
    // LIGHTBOX
    // ════════════════════════════════
    function initLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxClose = document.getElementById('lightboxClose');
        if (!lightbox || !lightboxImg) return;

        // Portfolio items
        document.querySelectorAll('.portfolio__item-inner').forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const title = item.querySelector('h4');
                if (img) {
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt;
                    if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
                    lightbox.classList.add('is-active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        // Featured items
        document.querySelectorAll('.featured__img').forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const card = item.closest('.featured__card');
                const title = card ? card.querySelector('h4') : null;
                if (img) {
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt;
                    if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
                    lightbox.classList.add('is-active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        // Close
        function closeLightbox() {
            lightbox.classList.remove('is-active');
            document.body.style.overflow = '';
        }
        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('is-active')) closeLightbox();
        });
    }

    // ════════════════════════════════
    // TESTIMONIALS SLIDER
    // ════════════════════════════════
    function initTestimonialsSlider() {
        const track = document.getElementById('testimonialsTrack');
        const prevBtn = document.getElementById('testPrev');
        const nextBtn = document.getElementById('testNext');
        const dotsContainer = document.getElementById('testDots');
        if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

        const cards = track.querySelectorAll('.testimonial');
        const dots = dotsContainer.querySelectorAll('span');
        let current = 0;
        const total = cards.length;

        function slide(index) {
            current = index;
            const card = cards[0];
            if (!card) return;
            const gap = 20;
            const shift = current * (card.offsetWidth + gap);

            if (typeof gsap !== 'undefined') {
                gsap.to(track, {
                    x: -shift,
                    duration: 0.7,
                    ease: 'power3.out',
                });
            } else {
                track.style.transform = `translateX(-${shift}px)`;
            }

            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        nextBtn.addEventListener('click', () => slide(current < total - 1 ? current + 1 : 0));
        prevBtn.addEventListener('click', () => slide(current > 0 ? current - 1 : total - 1));
        dots.forEach((dot, i) => dot.addEventListener('click', () => slide(i)));

        // Autoplay
        let autoplay = setInterval(() => slide(current < total - 1 ? current + 1 : 0), 6000);
        const slider = track.closest('.testimonials__slider');
        if (slider) {
            slider.addEventListener('mouseenter', () => clearInterval(autoplay));
            slider.addEventListener('mouseleave', () => {
                autoplay = setInterval(() => slide(current < total - 1 ? current + 1 : 0), 6000);
            });
        }

        // Touch swipe
        let touchStartX = 0;
        let touchEndX = 0;
        if (slider) {
            slider.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
            slider.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) slide(current < total - 1 ? current + 1 : 0);
                    else slide(current > 0 ? current - 1 : total - 1);
                }
            }, { passive: true });
        }
    }

    // ════════════════════════════════
    // COUNTER ANIMATIONS
    // ════════════════════════════════
    function initCounterAnimations() {
        if (typeof ScrollTrigger === 'undefined') return;

        const counters = document.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            if (isNaN(target)) return;
            let triggered = false;

            ScrollTrigger.create({
                trigger: counter,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    if (triggered) return;
                    triggered = true;
                    animateCounter(counter, target);
                }
            });
        });

        function animateCounter(el, target) {
            const duration = 2000;
            const start = performance.now();

            function update(now) {
                const elapsed = now - start;
                const p = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(eased * target);

                if (p < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = target;
                }
            }
            requestAnimationFrame(update);
        }
    }

    // ════════════════════════════════
    // TIMELINE FILL
    // ════════════════════════════════
    function initTimelineFill() {
        const fill = document.getElementById('timelineProgress');
        if (!fill || typeof ScrollTrigger === 'undefined') return;

        gsap.to(fill, {
            height: '100%',
            ease: 'none',
            scrollTrigger: {
                trigger: '.timeline',
                start: 'top 80%',
                end: 'bottom 20%',
                scrub: 1,
            }
        });
    }

    // ════════════════════════════════
    // DRAWINGS VIEWER
    // ════════════════════════════════
    function initDrawingsViewer() {
        const sidebar = document.getElementById('drawingsList');
        const preview = document.getElementById('drawingsPreview');
        if (!sidebar || !preview) return;

        const drawings = [
            { name: 'Баскетбольна стійка з підйомником', file: 'assets/Зразки креслень/Баскетбольна стійка з підйомником для регулювання по висоті.pdf' },
            { name: 'Баскетбольна стійка — Паспорт', file: 'assets/Зразки креслень/Баскетбольна стійка. Паспорт.PDF' },
            { name: 'Баскетбольна стійка без щита', file: 'assets/Зразки креслень/Баскетольна стійка без щита.pdf' },
            { name: 'Волейбольна суддівська вишка', file: 'assets/Зразки креслень/Волейбольна суддівська вишка.pdf' },
            { name: 'Ворота для міні-футболу тип 2М', file: 'assets/Зразки креслень/Ворота для міні футболу та гандболу тип 2М.pdf' },
            { name: 'Навіс', file: 'assets/Зразки креслень/Навіс.pdf' },
            { name: 'Огородження футбольного поля', file: 'assets/Зразки креслень/Огородження футбольного поля.pdf' },
            { name: 'Інструкція з монтажу огородження', file: 'assets/Зразки креслень/Огородження футбольного поля. Інструкція з монтажу.pdf' },
            { name: 'Опорна конструкція СЕС 11×2', file: 'assets/Зразки креслень/Опорна конструкція СЕС -11х2.pdf' },
            { name: 'Опорна конструкція СЕС 6×2 — ТЗ8', file: 'assets/Зразки креслень/Опорна конструкція СЕС-6х2. Технічне завдання 8.PDF' },
            { name: 'Спортивний комплекс', file: 'assets/Зразки креслень/ХЗБВМ-ШЕ1т213-0000 СК.pdf' },
        ];

        function loadDrawing(d, listItem) {
            sidebar.querySelectorAll('.drawings__sidebar-item').forEach(el => el.classList.remove('active'));
            listItem.classList.add('active');

            // Smooth transition
            preview.style.opacity = '0';
            setTimeout(() => {
                preview.innerHTML = `<embed src="${d.file}" type="application/pdf" style="width:100%;height:100%;min-height:400px;border-radius:8px;">`;
                preview.style.opacity = '1';
            }, 200);
        }

        // Style transition
        preview.style.transition = 'opacity 0.3s ease';

        drawings.forEach((d, i) => {
            const item = document.createElement('div');
            item.className = 'drawings__sidebar-item';
            item.textContent = d.name;
            if (i === 0) item.classList.add('active');
            item.addEventListener('click', () => loadDrawing(d, item));
            sidebar.appendChild(item);
        });

        if (drawings.length) {
            preview.innerHTML = `<embed src="${drawings[0].file}" type="application/pdf" style="width:100%;height:100%;min-height:400px;border-radius:8px;">`;
        }
    }

    // ════════════════════════════════
    // CONTACT FORM
    // ════════════════════════════════
    function initContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (!btn) return;

            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span>Надіслано &#10003;</span>';
            btn.style.background = '#16a34a';

            if (typeof gsap !== 'undefined') {
                gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
            }

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                form.reset();
            }, 3000);
        });
    }

}); // end DOMContentLoaded