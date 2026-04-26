/* hero-3d.js — Parametric CARPORT-like wireframe in Three.js
   Module that draws an isometric-feeling, drafting-table 3D structure
   reacting to mouse + scroll. Drafting line aesthetic, not photoreal.
*/
import * as THREE from 'three';

const canvas = document.getElementById('heroCanvas');
if (canvas) initHero3D(canvas);

function initHero3D(canvas) {
    const wrap = canvas.parentElement;
    const W = () => wrap.clientWidth;
    const H = () => wrap.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H(), false);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, W() / H(), 0.1, 200);
    camera.position.set(8, 6, 11);
    camera.lookAt(0, 1.2, 0);

    /* Materials — drafting style */
    const drafting = new THREE.LineBasicMaterial({ color: 0x0E0E0C, transparent: true, opacity: 0.85, linewidth: 1 });
    const dashed = new THREE.LineDashedMaterial({ color: 0x1B4A6B, dashSize: 0.08, gapSize: 0.05, transparent: true, opacity: 0.5 });
    const accent = new THREE.LineBasicMaterial({ color: 0xC5352A, transparent: true, opacity: 0.9 });
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xEBE6D6, transparent: true, opacity: 0.0 });

    const root = new THREE.Group();
    scene.add(root);

    /* Helper: build line edges for a Box */
    function boxEdges(w, h, d, mat = drafting) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const edges = new THREE.EdgesGeometry(geo);
        const lines = new THREE.LineSegments(edges, mat);
        const fill = new THREE.Mesh(geo, fillMat.clone());
        const grp = new THREE.Group();
        grp.add(fill); grp.add(lines);
        return grp;
    }

    /* CARPORT: 4 columns, 2 long beams, sloped roof rafters, panels */
    const W_ = 6;       // width
    const D_ = 4.2;     // depth
    const H_ = 2.6;     // post height
    const SLOPE = 0.7;  // rise
    const POST = 0.16;  // post side

    // posts
    const postsXZ = [[-W_/2, -D_/2], [W_/2, -D_/2], [-W_/2, D_/2], [W_/2, D_/2]];
    postsXZ.forEach(([x, z]) => {
        const p = boxEdges(POST, H_, POST);
        p.position.set(x, H_/2, z);
        root.add(p);
    });

    // top beams (long sides) — sloped front-to-back
    function beam(x1, z1, x2, z2, y1, y2) {
        const dx = x2 - x1, dz = z2 - z1, dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const beam = boxEdges(POST*1.1, POST*1.1, len);
        beam.position.set((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
        beam.lookAt(x2, y2, z2);
        root.add(beam);
        return beam;
    }
    beam(-W_/2, -D_/2, -W_/2, D_/2, H_, H_ + SLOPE);
    beam( W_/2, -D_/2,  W_/2, D_/2, H_, H_ + SLOPE);

    // rafters across (front/back style, perpendicular to beams)
    const RAFTERS = 7;
    for (let i = 0; i < RAFTERS; i++) {
        const t = i / (RAFTERS - 1);
        const z = -D_/2 + t * D_;
        const y = H_ + t * SLOPE;
        const r = boxEdges(W_, POST, POST*0.9);
        r.position.set(0, y, z);
        root.add(r);
    }

    // diagonal braces (red accent)
    function brace(x1, y1, z1, x2, y2, z2, mat) {
        const g = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2),
        ]);
        const line = new THREE.Line(g, mat);
        if (mat === dashed) line.computeLineDistances();
        root.add(line);
        return line;
    }
    brace(-W_/2, 0, -D_/2, -W_/2, H_, D_/2, accent);
    brace( W_/2, 0,  D_/2,  W_/2, H_, -D_/2, accent);

    // ground grid (paper)
    const grid = new THREE.GridHelper(20, 20, 0x1B4A6B, 0x1B4A6B);
    grid.material.transparent = true;
    grid.material.opacity = 0.08;
    grid.position.y = 0;
    scene.add(grid);

    // dimension lines (dashed blueprint cyan)
    const dim1 = brace(-W_/2 - 0.6, 0, -D_/2, -W_/2 - 0.6, H_, -D_/2, dashed);
    const dim2 = brace(-W_/2, H_ + SLOPE + 0.4, -D_/2, W_/2, H_ + SLOPE + 0.4, -D_/2, dashed);

    // animation state — gentle rotation + mouse parallax
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    canvas.parentElement.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    canvas.parentElement.addEventListener('mouseleave', () => { tmx = 0; tmy = 0; });

    // resize
    function resize() {
        renderer.setSize(W(), H(), false);
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);

    // animate
    let t = 0;
    function tick() {
        t += 0.005;
        mx += (tmx - mx) * 0.06;
        my += (tmy - my) * 0.06;

        const auto = Math.sin(t) * 0.18;
        root.rotation.y = auto + mx * 0.4;
        root.rotation.x = -my * 0.18 - 0.04;
        root.position.y = -1.2 + Math.sin(t * 0.6) * 0.04;

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    // Reduced motion respect
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        renderer.render(scene, camera);
    } else {
        tick();
    }
}
