/* hero-3d.js — STAGED self-assembling parametric carport
   "Living Engineering Drawing" — pieces draw in like CAD building a model,
   then live orbit + mouse-parallax + scroll-tied rotation.
*/
import * as THREE from 'three';

const canvas = document.getElementById('heroCanvas');
if (canvas) initHero3D(canvas);

function initHero3D(canvas) {
    const wrap = canvas.parentElement;
    const stateEl = document.querySelector('[data-stage-state]');
    const stepEl  = document.querySelector('[data-stage-step]');
    const barEl   = document.querySelector('[data-stage-bar]');
    const pctEl   = document.querySelector('[data-stage-pct]');
    const rebuildBtn = document.querySelector('[data-stage-rebuild]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const W = () => wrap.clientWidth;
    const H = () => wrap.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H(), false);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(34, W() / H(), 0.1, 200);
    camera.position.set(8.5, 6.4, 11);
    camera.lookAt(0, 1.2, 0);

    /* Materials — drafting line aesthetic */
    const matInk = new THREE.LineBasicMaterial({ color: 0x0E0E0C, transparent: true, opacity: 0.9 });
    const matDashed = new THREE.LineDashedMaterial({ color: 0x1B4A6B, dashSize: 0.10, gapSize: 0.06, transparent: true, opacity: 0.55 });
    const matAccent = new THREE.LineBasicMaterial({ color: 0xC5352A, transparent: true, opacity: 0.95 });
    const matFill = new THREE.MeshBasicMaterial({ color: 0xEBE6D6, transparent: true, opacity: 0.0 });

    const root = new THREE.Group();
    scene.add(root);

    /* ── Geometry primitives ────────────────────────────────────────── */
    const elements = []; // { lines: LineSegments, fill: Mesh, dashed?: bool, lengths: [..] }

    function makeBoxEdges(w, h, d, mat = matInk) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const edgesGeo = new THREE.EdgesGeometry(geo);
        const lines = new THREE.LineSegments(edgesGeo, mat.clone());
        const fill = new THREE.Mesh(geo, matFill.clone());
        const grp = new THREE.Group();
        grp.add(fill);
        grp.add(lines);
        // initial: invisible (will be revealed)
        lines.material.opacity = 0;
        fill.material.opacity = 0;
        elements.push({ root: grp, lines, fill, type: 'box' });
        return { grp, lines, fill };
    }

    function makeLine(p1, p2, mat = matInk, dashed = false) {
        const g = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(...p1), new THREE.Vector3(...p2)
        ]);
        const m = mat.clone();
        m.opacity = 0;
        const line = dashed ? new THREE.Line(g, m) : new THREE.Line(g, m);
        if (dashed) line.computeLineDistances();
        elements.push({ root: line, lines: line, fill: null, type: 'line' });
        return line;
    }

    /* ── Build CARPORT ─────────────────────────────────────────────── */
    const W_ = 6, D_ = 4.2, H_ = 2.6, SLOPE = 0.7, POST = 0.16;

    const stages = []; // each: { name, items: [groups] }

    /* Stage 1: 4 posts */
    const postsXZ = [[-W_/2, -D_/2], [W_/2, -D_/2], [W_/2, D_/2], [-W_/2, D_/2]];
    const postItems = postsXZ.map(([x, z]) => {
        const { grp } = makeBoxEdges(POST, H_, POST);
        grp.position.set(x, H_/2, z);
        root.add(grp);
        return grp;
    });
    stages.push({ name: 'POSTS · 4', items: postItems });

    /* Stage 2: long beams (sloped) */
    function makeBeam(x1, z1, x2, z2, y1, y2) {
        const dx = x2-x1, dz = z2-z1, dy = y2-y1;
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const { grp } = makeBoxEdges(POST*1.1, POST*1.1, len);
        grp.position.set((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
        grp.lookAt(x2, y2, z2);
        root.add(grp);
        return grp;
    }
    const beamItems = [
        makeBeam(-W_/2, -D_/2, -W_/2, D_/2, H_, H_+SLOPE),
        makeBeam( W_/2, -D_/2,  W_/2, D_/2, H_, H_+SLOPE),
    ];
    stages.push({ name: 'BEAMS · 2', items: beamItems });

    /* Stage 3: rafters */
    const RAFTERS = 7;
    const rafterItems = [];
    for (let i = 0; i < RAFTERS; i++) {
        const t = i / (RAFTERS - 1);
        const z = -D_/2 + t * D_;
        const y = H_ + t * SLOPE;
        const { grp } = makeBoxEdges(W_, POST, POST*0.9);
        grp.position.set(0, y, z);
        root.add(grp);
        rafterItems.push(grp);
    }
    stages.push({ name: `RAFTERS · ${RAFTERS}`, items: rafterItems });

    /* Stage 4: diagonal red braces */
    const braceItems = [
        makeLine([-W_/2, 0, -D_/2], [-W_/2, H_, D_/2], matAccent),
        makeLine([ W_/2, 0,  D_/2], [ W_/2, H_, -D_/2], matAccent),
    ];
    braceItems.forEach(l => root.add(l));
    stages.push({ name: 'BRACES · 2', items: braceItems });

    /* Stage 5: blueprint dashed dimension lines */
    const dimItems = [
        makeLine([-W_/2 - 0.6, 0, -D_/2], [-W_/2 - 0.6, H_, -D_/2], matDashed, true),
        makeLine([-W_/2, H_+SLOPE+0.4, -D_/2], [W_/2, H_+SLOPE+0.4, -D_/2], matDashed, true),
        makeLine([-W_/2, 0, -D_/2 - 0.5], [W_/2, 0, -D_/2 - 0.5], matDashed, true),
    ];
    dimItems.forEach(l => root.add(l));
    stages.push({ name: 'DIMS · 3', items: dimItems });

    /* Stage 6: ground grid (subtle) */
    const grid = new THREE.GridHelper(20, 20, 0x1B4A6B, 0x1B4A6B);
    grid.material.transparent = true;
    grid.material.opacity = 0;
    grid.position.y = 0;
    scene.add(grid);
    elements.push({ root: grid, lines: grid, fill: null, type: 'grid' });
    stages.push({ name: 'GRID · 1', items: [grid] });

    /* Stage 7: floating dimension labels via sprites */
    const labelTextures = [];
    function makeLabel(text, color = '#C5352A') {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#F5F2E8';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.strokeStyle = '#0E0E0C';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, c.width-4, c.height-4);
        ctx.fillStyle = color;
        ctx.font = 'bold 28px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, c.width/2, c.height/2);
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        labelTextures.push(tex);
        return tex;
    }
    function makeSprite(text, x, y, z, scale = 1) {
        const tex = makeLabel(text);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
        const sp = new THREE.Sprite(mat);
        sp.position.set(x, y, z);
        sp.scale.set(1.1 * scale, 0.28 * scale, 1);
        scene.add(sp);
        elements.push({ root: sp, lines: sp, fill: null, type: 'sprite' });
        return sp;
    }
    const labelItems = [
        makeSprite('L = 6000', 0, H_ + SLOPE + 0.7, -D_/2),
        makeSprite('H = 2600', -W_/2 - 0.95, H_/2, -D_/2),
        makeSprite('∅ 12 mm · S235', 0, -0.4, 0),
    ];
    stages.push({ name: 'LABELS · 3', items: labelItems });

    /* ── Helper: fade item in via tween ─────────────────────────────── */
    function fadeItem(item, fillTarget = 0.04, lineTarget = 0.9, dur = 0.5) {
        // For groups (boxes), iterate children
        if (item.children && item.children.length) {
            item.traverse(obj => {
                if (obj.material) {
                    const target = obj.isMesh ? fillTarget : lineTarget;
                    tween(obj.material, 'opacity', target, dur);
                }
            });
            // Drop-in motion: from y -> y
            const finalY = item.position.y;
            item.position.y = finalY + 0.6;
            tween(item.position, 'y', finalY, dur, 'cubic-out');
        } else if (item.material) {
            const target = item.isLine || item.isSprite ? lineTarget : lineTarget;
            tween(item.material, 'opacity', target, dur);
        }
    }

    /* tiny tween helper */
    const _tweens = [];
    function tween(obj, key, to, dur = 0.5, ease = 'cubic-out') {
        const from = obj[key];
        const start = performance.now();
        const t = { obj, key, from, to, start, dur: dur*1000, ease, done: false };
        _tweens.push(t);
        return t;
    }
    const easings = {
        'linear': p => p,
        'cubic-out': p => 1 - Math.pow(1-p, 3),
        'cubic-in-out': p => p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2,
    };
    function stepTweens(now) {
        for (const t of _tweens) {
            if (t.done) continue;
            const p = Math.min(1, (now - t.start) / t.dur);
            const e = easings[t.ease](p);
            t.obj[t.key] = t.from + (t.to - t.from) * e;
            if (p >= 1) t.done = true;
        }
    }

    /* ── Run staged build sequence ──────────────────────────────────── */
    let currentStage = 0;
    let assembling = true;

    function setProgressUI(stageIdx, totalStages) {
        const pct = Math.round((stageIdx / totalStages) * 100);
        if (barEl) barEl.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
        if (stepEl) stepEl.textContent = stages[Math.min(stageIdx, totalStages-1)]?.name + ` · ${stageIdx}/${totalStages}`;
    }

    function startBuild() {
        currentStage = 0;
        assembling = true;
        if (stateEl) stateEl.textContent = 'ASSEMBLING';
        setProgressUI(0, stages.length);
        // hide everything
        elements.forEach(e => {
            const m = e.lines.material || (e.lines.children && e.lines.children[0]?.material);
            if (e.lines.traverse) {
                e.lines.traverse(o => { if (o.material) o.material.opacity = 0; });
            } else if (m) m.opacity = 0;
        });
        // clear existing tweens
        _tweens.length = 0;
        nextStage();
    }

    function nextStage() {
        if (currentStage >= stages.length) {
            assembling = false;
            if (stateEl) stateEl.textContent = 'LIVE · ORBIT';
            setProgressUI(stages.length, stages.length);
            return;
        }
        const s = stages[currentStage];
        const stagger = 0.18;
        s.items.forEach((it, i) => {
            setTimeout(() => fadeItem(it, 0.03, 0.9, 0.55), i * stagger * 1000);
        });
        currentStage++;
        setProgressUI(currentStage, stages.length);
        const totalDur = (s.items.length * stagger + 0.55) * 1000;
        setTimeout(nextStage, totalDur + 80);
    }

    rebuildBtn?.addEventListener('click', () => { if (!assembling) startBuild(); });

    /* ── Mouse parallax + scroll-tied rotation ──────────────────────── */
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    wrap.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    wrap.addEventListener('mouseleave', () => { tmx = 0; tmy = 0; });

    let scrollY = 0;
    document.addEventListener('scroll', () => { scrollY = window.scrollY || 0; }, { passive: true });

    /* resize */
    function resize() {
        renderer.setSize(W(), H(), false);
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);

    /* ── animate ────────────────────────────────────────────────────── */
    let t0 = performance.now();
    function tick(now) {
        const dt = (now - t0) / 1000;
        t0 = now;
        const t = now / 1000;

        stepTweens(now);

        mx += (tmx - mx) * 0.07;
        my += (tmy - my) * 0.07;

        const auto = Math.sin(t * 0.4) * 0.16;
        const scrollRot = (scrollY * 0.0006) % (Math.PI * 2);
        root.rotation.y = auto + mx * 0.45 + scrollRot;
        root.rotation.x = -my * 0.18 - 0.04;
        root.position.y = -1.2 + Math.sin(t * 0.6) * 0.04;

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    if (reduced) {
        // jump straight to fully visible state
        elements.forEach(e => {
            if (e.lines.traverse) e.lines.traverse(o => { if (o.material) o.material.opacity = o.isMesh ? 0.03 : 0.9; });
            else if (e.lines.material) e.lines.material.opacity = 0.9;
        });
        if (stateEl) stateEl.textContent = 'LIVE · ORBIT';
        setProgressUI(stages.length, stages.length);
        renderer.render(scene, camera);
    } else {
        // delay slightly so the page can paint first
        setTimeout(startBuild, 300);
        requestAnimationFrame((n) => { t0 = n; tick(n); });
    }
}
