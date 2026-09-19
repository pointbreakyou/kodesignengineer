/* hero-assembly.js — Chaos → Order assembly simulation
   Metallic structural elements floating chaotically, attracted by an invisible force
   field, self-assembling into an engineered truss. Visible force vectors guide the
   motion; each connection node fires a brief light pulse.
   Style: ultra-minimal, cinematic, dark + cold neon (cyan / ice white).
*/
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('assemblyCanvas');
if (canvas) initAssembly(canvas);

function initAssembly(canvas) {
    const wrap = canvas.parentElement;
    const hudState = document.querySelector('[data-asm-state]');
    const hudPhase = document.querySelector('[data-asm-phase]');
    const hudCount = document.querySelector('[data-asm-count]');
    const hudPct   = document.querySelector('[data-asm-pct]');
    const hudBar   = document.querySelector('[data-asm-bar]');
    const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const W = () => wrap.clientWidth || 600;
    const H = () => wrap.clientHeight || 750;

    /* ── Renderer ────────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H(), false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    /* ── Scene ───────────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#06090f');
    scene.fog = new THREE.Fog('#06090f', 14, 38);

    /* radial glow background — subtle dark gradient via large sphere */
    {
        const bgGeo = new THREE.SphereGeometry(60, 32, 32);
        const bgMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: { uT: { value: 0 } },
            vertexShader: `
                varying vec3 vP;
                void main() {
                    vP = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vP;
                uniform float uT;
                void main() {
                    float r = length(vP.xy) / 60.0;
                    float v = smoothstep(1.2, 0.0, r);
                    vec3 a = vec3(0.022, 0.030, 0.045);
                    vec3 b = vec3(0.005, 0.010, 0.020);
                    vec3 c = mix(b, a, v);
                    // cool cyan center hint
                    c += vec3(0.0, 0.05, 0.09) * pow(v, 4.0) * (0.65 + 0.35 * sin(uT*0.4));
                    gl_FragColor = vec4(c, 1.0);
                }
            `,
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        scene.add(bg);
        scene.userData.bgMat = bgMat;
    }

    /* ── Camera ──────────────────────────────────────────────────────── */
    const camera = new THREE.PerspectiveCamera(36, W() / H(), 0.1, 200);
    const camTarget = new THREE.Vector3(0, 1.0, 0);
    camera.position.set(7.5, 3.6, 8.2);
    camera.lookAt(camTarget);

    /* ── Lights ──────────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0x6480a0, 0.35));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(6, 8, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x4ad6ff, 1.4);
    rimLight.position.set(-6, 3, -4);
    scene.add(rimLight);

    const underLight = new THREE.PointLight(0x7ed6ff, 0.5, 18);
    underLight.position.set(0, -4, 0);
    scene.add(underLight);

    const warm = new THREE.PointLight(0xffb070, 0.18, 12);
    warm.position.set(3, 5, 5);
    scene.add(warm);

    /* ── Materials ───────────────────────────────────────────────────── */
    const COLORS = {
        steel:   0x6b7480,
        steelDark: 0x2a3038,
        edge:    0x9bb6c8,
        cyan:    0x6ee7ff,
        cyanHi:  0xa6f1ff,
        white:   0xffffff,
        force:   0x4ad6ff,
    };

    function makeSteelMat() {
        return new THREE.MeshStandardMaterial({
            color: COLORS.steel,
            metalness: 0.92,
            roughness: 0.34,
            envMapIntensity: 0.7,
        });
    }
    function makePanelMat() {
        return new THREE.MeshStandardMaterial({
            color: 0x4a5663,
            metalness: 0.7,
            roughness: 0.5,
            transparent: true,
            opacity: 0.86,
        });
    }
    const matEdge = new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.8 });
    const matEdgeAccent = new THREE.LineBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.0 });

    /* ── Pulse texture (radial gradient) ─────────────────────────────── */
    const pulseTex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.18, 'rgba(180,240,255,0.95)');
        grad.addColorStop(0.45, 'rgba(110,231,255,0.45)');
        grad.addColorStop(1, 'rgba(110,231,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    })();

    /* ── Build target structure: a small engineered frame ───────────── */
    /* Coordinate system: y up. Frame footprint 3.6 × 3.0, height 3.6  */
    const FX = 1.8, FZ = 1.5, FY_LOW = -1.6, FY_HI = 2.0, MID = 0.2;
    const POST = 0.16;          // square section of beams
    const PANEL_T = 0.06;
    const NODE_R = 0.16;

    /* Element factory ----------------------------------------------- */
    const elements = [];        // list of all assembled elements
    const root = new THREE.Group();
    scene.add(root);

    function makeBeam(p1, p2, w = POST, h = POST, accent = false) {
        const a = new THREE.Vector3(...p1);
        const b = new THREE.Vector3(...p2);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        const geo = new THREE.BoxGeometry(w, h, len);
        const mat = makeSteelMat();
        if (accent) {
            mat.color = new THREE.Color(0x808890);
            mat.metalness = 0.95;
            mat.roughness = 0.28;
        }
        const mesh = new THREE.Mesh(geo, mat);
        // edges
        const eGeo = new THREE.EdgesGeometry(geo);
        const edges = new THREE.LineSegments(eGeo, matEdge.clone());
        mesh.add(edges);

        // optional cyan glow strip (one accent line)
        const glowG = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w*0.35, h*0.51, -len*0.42),
            new THREE.Vector3(-w*0.35, h*0.51,  len*0.42),
        ]);
        const glow = new THREE.Line(glowG, matEdgeAccent.clone());
        mesh.add(glow);

        // align mesh: BoxGeometry is centered, length along z, so set position to midpoint and orient z toward b
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const target = { pos: mid.clone(), quat: new THREE.Quaternion() };
        const z = new THREE.Vector3().copy(dir).normalize();
        const up = Math.abs(z.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const x = new THREE.Vector3().crossVectors(up, z).normalize();
        const y = new THREE.Vector3().crossVectors(z, x).normalize();
        const m = new THREE.Matrix4().makeBasis(x, y, z);
        target.quat.setFromRotationMatrix(m);

        root.add(mesh);
        const el = registerElement(mesh, target, edges, glow, 'beam');
        // store node endpoints in world space for pulse triggering
        el.nodes = [a.clone(), b.clone()];
        return el;
    }

    function makeNode(p, r = NODE_R) {
        const geo = new THREE.IcosahedronGeometry(r, 1);
        const mat = makeSteelMat();
        mat.color = new THREE.Color(0x9aa6b2);
        mat.roughness = 0.25;
        const mesh = new THREE.Mesh(geo, mat);
        const eGeo = new THREE.EdgesGeometry(geo);
        const edges = new THREE.LineSegments(eGeo, matEdge.clone());
        mesh.add(edges);

        const target = { pos: new THREE.Vector3(...p), quat: new THREE.Quaternion() };
        root.add(mesh);
        const el = registerElement(mesh, target, edges, null, 'node');
        el.nodes = [target.pos.clone()];
        return el;
    }

    function makePanel(p, w, h, normal = [0, 0, 1]) {
        const geo = new THREE.BoxGeometry(w, h, PANEL_T);
        const mat = makePanelMat();
        const mesh = new THREE.Mesh(geo, mat);
        const eGeo = new THREE.EdgesGeometry(geo);
        const edges = new THREE.LineSegments(eGeo, matEdge.clone());
        mesh.add(edges);

        const target = { pos: new THREE.Vector3(...p), quat: new THREE.Quaternion() };
        const n = new THREE.Vector3(...normal).normalize();
        const z = new THREE.Vector3(0, 0, 1);
        target.quat.setFromUnitVectors(z, n);

        root.add(mesh);
        const el = registerElement(mesh, target, edges, null, 'panel');
        el.nodes = [target.pos.clone()];
        return el;
    }

    function registerElement(mesh, target, edges, glowLine, type) {
        // chaos initial state — random position/quat in a sphere around origin
        const radius = 6 + Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const sx = radius * Math.sin(phi) * Math.cos(theta);
        const sy = radius * Math.cos(phi) * 0.6 + (Math.random() - 0.5) * 2;
        const sz = radius * Math.sin(phi) * Math.sin(theta);
        const startPos = new THREE.Vector3(sx, sy, sz);
        const startQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        ));
        const drift = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6
        );
        const angDrift = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6
        );

        mesh.position.copy(startPos);
        mesh.quaternion.copy(startQuat);
        mesh.material.opacity = 1;

        const el = {
            type,
            mesh, edges, glowLine,
            target,
            startPos, startQuat,
            drift, angDrift,
            assembleStart: 0,    // global time t when this element starts assembling
            assembleDur: 1.6,
            assembled: false,
            snappedAt: -1,
        };
        elements.push(el);
        return el;
    }

    /* ── DEFINE TARGET TRUSS ───────────────────────────────────────── */
    /* 8 corner nodes */
    const corners = [
        [-FX, FY_LOW, -FZ], [ FX, FY_LOW, -FZ], [ FX, FY_LOW,  FZ], [-FX, FY_LOW,  FZ],
        [-FX, FY_HI,  -FZ], [ FX, FY_HI,  -FZ], [ FX, FY_HI,   FZ], [-FX, FY_HI,   FZ],
    ];
    corners.forEach(c => makeNode(c));

    /* 4 vertical posts */
    makeBeam([-FX, FY_LOW, -FZ], [-FX, FY_HI, -FZ]);
    makeBeam([ FX, FY_LOW, -FZ], [ FX, FY_HI, -FZ]);
    makeBeam([ FX, FY_LOW,  FZ], [ FX, FY_HI,  FZ]);
    makeBeam([-FX, FY_LOW,  FZ], [-FX, FY_HI,  FZ]);

    /* top frame */
    makeBeam([-FX, FY_HI, -FZ], [ FX, FY_HI, -FZ]);
    makeBeam([ FX, FY_HI, -FZ], [ FX, FY_HI,  FZ]);
    makeBeam([ FX, FY_HI,  FZ], [-FX, FY_HI,  FZ]);
    makeBeam([-FX, FY_HI,  FZ], [-FX, FY_HI, -FZ]);

    /* bottom frame */
    makeBeam([-FX, FY_LOW, -FZ], [ FX, FY_LOW, -FZ]);
    makeBeam([ FX, FY_LOW,  FZ], [-FX, FY_LOW,  FZ]);

    /* mid horizontal ring (only front/back to keep visual room) */
    makeBeam([-FX, MID, -FZ], [ FX, MID, -FZ], POST*0.85, POST*0.85);
    makeBeam([-FX, MID,  FZ], [ FX, MID,  FZ], POST*0.85, POST*0.85);

    /* X-braces on front face */
    makeBeam([-FX, FY_LOW, -FZ], [ FX, FY_HI, -FZ], POST*0.7, POST*0.7, true);
    makeBeam([ FX, FY_LOW, -FZ], [-FX, FY_HI, -FZ], POST*0.7, POST*0.7, true);

    /* X-braces on right face */
    makeBeam([ FX, FY_LOW, -FZ], [ FX, FY_HI,  FZ], POST*0.7, POST*0.7, true);
    makeBeam([ FX, FY_LOW,  FZ], [ FX, FY_HI, -FZ], POST*0.7, POST*0.7, true);

    /* top platform (decorative, semi-transparent panel) */
    makePanel([0, FY_HI + 0.05, 0], FX*1.85, FZ*1.85, [0, 1, 0]);

    /* Total elements ~ 8 + 10 + 4 + 1 = 23 */
    if (hudCount) hudCount.textContent = String(elements.length).padStart(2, '0');

    /* ── Force-vector lines (curve chaos→target with flowing dashes) ── */
    const forceLines = [];
    {
        const lineMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uT: { value: 0 },
                uOpacity: { value: 0 },
                uColor: { value: new THREE.Color(COLORS.force) },
            },
            vertexShader: `
                attribute float aT;
                varying float vT;
                void main() {
                    vT = aT;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uT;
                uniform float uOpacity;
                uniform vec3 uColor;
                varying float vT;
                void main() {
                    float flow = fract(vT * 4.0 - uT * 1.4);
                    float dash = step(0.5, flow);
                    float fade = smoothstep(0.0, 0.15, vT) * smoothstep(1.0, 0.85, vT);
                    float alpha = dash * fade * uOpacity * 0.9;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
        });
        for (const el of elements) {
            const points = sampleCurve(el.startPos, el.target.pos, 28);
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const tArr = new Float32Array(points.length);
            for (let i = 0; i < points.length; i++) tArr[i] = i / (points.length - 1);
            geo.setAttribute('aT', new THREE.BufferAttribute(tArr, 1));
            const line = new THREE.Line(geo, lineMat);
            line.frustumCulled = false;
            scene.add(line);
            forceLines.push({ line, mat: lineMat, el });
        }
        scene.userData.forceMat = lineMat;
    }

    function sampleCurve(a, b, n) {
        const mid = a.clone().add(b).multiplyScalar(0.5);
        // bend toward an offset perpendicular vector for visual curvature
        const off = new THREE.Vector3(
            (Math.random() - 0.5) * 2.5,
            (Math.random() - 0.5) * 2.5,
            (Math.random() - 0.5) * 2.5
        );
        const ctrl = mid.clone().add(off);
        const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
        return curve.getPoints(n);
    }

    /* ── Pulse pool (sprites that flash on snap) ─────────────────── */
    const pulses = [];
    function spawnPulse(pos, scale = 1.4, color = COLORS.cyanHi) {
        const mat = new THREE.SpriteMaterial({
            map: pulseTex,
            color,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            opacity: 1.0,
        });
        const s = new THREE.Sprite(mat);
        s.scale.set(scale, scale, 1);
        s.position.copy(pos);
        scene.add(s);
        pulses.push({ sprite: s, mat, born: clock.t, life: 0.7 + Math.random() * 0.25, scale });
    }

    /* ── Snap rings (flat torus that expands at connection) ──────── */
    const rings = [];
    function spawnRing(pos, normal = new THREE.Vector3(0, 1, 0)) {
        const geo = new THREE.RingGeometry(0.05, 0.07, 48);
        const mat = new THREE.MeshBasicMaterial({
            color: COLORS.cyanHi,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.position.copy(pos);
        const z = new THREE.Vector3(0, 0, 1);
        ring.quaternion.setFromUnitVectors(z, normal.clone().normalize());
        scene.add(ring);
        rings.push({ mesh: ring, mat, born: clock.t, life: 0.55 });
    }

    /* ── Cycle & timing ─────────────────────────────────────────── */
    const PHASE = {
        CHAOS:    { t: 3.0, name: 'CHAOS · DRIFT' },
        FIELD:    { t: 1.6, name: 'FIELD · ENGAGE' },
        ASSEMBLE: { t: 7.5, name: 'ASSEMBLY · LOCK' },
    };

    const clock = { t: 0, dt: 0, last: performance.now() };
    let cycleStart = 0;
    let orbitMode = false;

    function startCycle() {
        cycleStart = clock.t;
        // schedule each element to assemble at a stagger between FIELD end and ASSEMBLE end
        const T_FIELD_END = PHASE.CHAOS.t + PHASE.FIELD.t;
        const T_ASSEMBLE_END = T_FIELD_END + PHASE.ASSEMBLE.t;
        const window = T_ASSEMBLE_END - T_FIELD_END - 1.6; // each takes 1.6s, last one snaps at T_ASSEMBLE_END
        const order = elements.map((_, i) => i);
        // assemble nodes first, then beams, then panels
        order.sort((a, b) => {
            const rank = e => e.type === 'node' ? 0 : (e.type === 'beam' ? 1 : 2);
            return rank(elements[a]) - rank(elements[b]);
        });
        order.forEach((idx, i) => {
            const el = elements[idx];
            const frac = i / Math.max(1, order.length - 1);
            el.assembleStart = T_FIELD_END + frac * window;
            el.assembleDur = 1.4 + Math.random() * 0.4;
            el.assembled = false;
            el.snappedAt = -1;
            // re-randomize chaos start
            const radius = 6 + Math.random() * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            el.startPos.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi) * 0.6 + (Math.random() - 0.5) * 2,
                radius * Math.sin(phi) * Math.sin(theta)
            );
            el.startQuat.setFromEuler(new THREE.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            ));
            el.drift.set((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6);
            el.angDrift.set((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6);
            el.mesh.position.copy(el.startPos);
            el.mesh.quaternion.copy(el.startQuat);
        });

        // refresh force-line geometries to match new chaos positions
        forceLines.forEach(({ line, el }) => {
            const pts = sampleCurve(el.startPos, el.target.pos, 28);
            const positions = new Float32Array(pts.length * 3);
            for (let i = 0; i < pts.length; i++) {
                positions[i*3] = pts[i].x;
                positions[i*3+1] = pts[i].y;
                positions[i*3+2] = pts[i].z;
            }
            line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            line.geometry.attributes.position.needsUpdate = true;
        });
    }

    startCycle();

    /* ── easing helpers ─────────────────────────────────────────── */
    const ease = {
        outCubic: t => 1 - Math.pow(1 - t, 3),
        inOutCubic: t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2,
        outBack: (t, s = 1.55) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
        outQuint: t => 1 - Math.pow(1 - t, 5),
    };

    /* ── Mouse parallax ─────────────────────────────────────────── */
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    wrap.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    wrap.addEventListener('mouseleave', () => { tmx = 0; tmy = 0; });

    /* ── Resize ─────────────────────────────────────────────────── */
    function resize() {
        renderer.setSize(W(), H(), false);
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);

    /* ── Animate ────────────────────────────────────────────────── */
    function tick(now) {
        clock.dt = Math.min(0.05, (now - clock.last) / 1000);
        clock.last = now;
        clock.t += clock.dt;
        const T = clock.t;
        const cycleT = T - cycleStart;
        const total = PHASE.CHAOS.t + PHASE.FIELD.t + PHASE.ASSEMBLE.t;

        // determine current phase
        let phase = 'CHAOS';
        let phasePct = 0;
        const T_CHAOS_END    = PHASE.CHAOS.t;
        const T_FIELD_END    = T_CHAOS_END + PHASE.FIELD.t;
        const T_ASSEMBLE_END = T_FIELD_END + PHASE.ASSEMBLE.t;

        if (cycleT < T_CHAOS_END) {
            phase = 'CHAOS';
            phasePct = cycleT / T_CHAOS_END;
        } else if (cycleT < T_FIELD_END) {
            phase = 'FIELD';
            phasePct = (cycleT - T_CHAOS_END) / PHASE.FIELD.t;
        } else if (cycleT < T_ASSEMBLE_END) {
            phase = 'ASSEMBLE';
            phasePct = (cycleT - T_FIELD_END) / PHASE.ASSEMBLE.t;
        } else {
            // assembled — permanent orbit, no restart
            phase = 'HOLD';
            phasePct = 1.0;
            if (!orbitMode) orbitMode = true;
        }

        /* Force-lines opacity:
           - 0 in CHAOS (early), fade in during late CHAOS + FIELD,
           - hold during ASSEMBLE, fade out at end. */
        let forceOp = 0;
        if (phase === 'CHAOS')    forceOp = ease.outCubic(Math.max(0, phasePct - 0.55) / 0.45);
        else if (phase === 'FIELD') forceOp = 1.0;
        else if (phase === 'ASSEMBLE') forceOp = 1.0 - phasePct * 0.85;
        else forceOp = 0;
        scene.userData.forceMat.uniforms.uT.value = T;
        scene.userData.forceMat.uniforms.uOpacity.value = forceOp;
        // hide force lines for elements already assembled
        forceLines.forEach(({ line, el }) => {
            line.visible = !el.assembled && forceOp > 0.02;
        });

        /* Background pulse */
        scene.userData.bgMat.uniforms.uT.value = T;

        /* Update each element */
        for (const el of elements) {
            if (cycleT < el.assembleStart) {
                // Chaos drift
                el.mesh.position.x = el.startPos.x + Math.sin(T * 0.6 + el.drift.x * 4) * 0.35;
                el.mesh.position.y = el.startPos.y + Math.cos(T * 0.5 + el.drift.y * 4) * 0.30;
                el.mesh.position.z = el.startPos.z + Math.sin(T * 0.4 + el.drift.z * 4) * 0.35;
                el.mesh.rotation.x += el.angDrift.x * clock.dt * 0.6;
                el.mesh.rotation.y += el.angDrift.y * clock.dt * 0.6;
                el.mesh.rotation.z += el.angDrift.z * clock.dt * 0.6;
            } else {
                const localT = (cycleT - el.assembleStart) / el.assembleDur;
                if (localT < 1) {
                    const ePos = ease.outQuint(localT);
                    const eRot = ease.inOutCubic(Math.min(1, localT * 1.05));
                    // capture chaos position at moment of assembleStart for clean lerp:
                    if (!el._chaosCap) {
                        el._chaosCap = el.mesh.position.clone();
                        el._chaosQuat = el.mesh.quaternion.clone();
                    }
                    el.mesh.position.lerpVectors(el._chaosCap, el.target.pos, ePos);
                    el.mesh.quaternion.copy(el._chaosQuat).slerp(el.target.quat, eRot);
                    // accent line glow (cyan stripes light up as it locks)
                    if (el.glowLine && el.glowLine.material) {
                        el.glowLine.material.opacity = Math.max(0, localT - 0.4) / 0.6 * 0.9;
                    }
                } else if (!el.assembled) {
                    el.mesh.position.copy(el.target.pos);
                    el.mesh.quaternion.copy(el.target.quat);
                    el.assembled = true;
                    el.snappedAt = T;
                    // SNAP! spawn pulse + ring at each node of this element
                    el.nodes.forEach((n, idx) => {
                        spawnPulse(n, 1.3 + Math.random() * 0.4);
                        if (idx === 0) spawnRing(n);
                    });
                    if (el.glowLine && el.glowLine.material) {
                        el.glowLine.material.opacity = 0.9;
                    }
                }
                // post-snap subtle shimmer on accent stripe
                if (el.assembled && el.glowLine && el.glowLine.material) {
                    const since = T - el.snappedAt;
                    el.glowLine.material.opacity = 0.45 + Math.sin(since * 4 + el.target.pos.x) * 0.18;
                }
            }
        }

        if (phase === 'CHAOS') {
            for (const el of elements) el._chaosCap = null;
        }

        /* Pulses lifecycle */
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            const age = (T - p.born) / p.life;
            if (age >= 1) {
                scene.remove(p.sprite);
                p.mat.dispose();
                pulses.splice(i, 1);
                continue;
            }
            const e = ease.outCubic(age);
            p.sprite.scale.setScalar(p.scale * (1 + e * 1.8));
            p.mat.opacity = (1 - age) * 0.95;
        }

        /* Rings lifecycle */
        for (let i = rings.length - 1; i >= 0; i--) {
            const r = rings[i];
            const age = (T - r.born) / r.life;
            if (age >= 1) {
                scene.remove(r.mesh);
                r.mesh.geometry.dispose();
                r.mat.dispose();
                rings.splice(i, 1);
                continue;
            }
            const e = ease.outQuint(age);
            const s = 0.2 + e * 2.2;
            r.mesh.scale.set(s, s, s);
            r.mat.opacity = (1 - age) * 0.85;
        }

        /* Camera — slow cinematic orbit + mouse parallax */
        mx += (tmx - mx) * 0.04;
        my += (tmy - my) * 0.04;
        const orbit = T * 0.085;
        const camR = 8.6 + Math.sin(T * 0.18) * 0.4;
        camera.position.x = Math.cos(orbit) * camR + mx * 0.6;
        camera.position.z = Math.sin(orbit) * camR + my * 0.2;
        camera.position.y = 3.4 + Math.sin(T * 0.22) * 0.7 - my * 0.4;
        camera.lookAt(camTarget);

        /* HUD updates */
        if (hudState) hudState.textContent = orbitMode ? 'LIVE · ORBIT' : phase;
        if (hudPhase) hudPhase.textContent = orbitMode ? 'STRUCTURE · LIVE' : PHASE[phase].name;
        const overall = Math.min(1, cycleT / total);
        if (hudPct) hudPct.textContent = String(Math.round(overall * 100)).padStart(2, '0') + '%';
        if (hudBar) hudBar.style.transform = `scaleX(${overall})`;

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    if (reduced) {
        // Skip animation: lock to assembled state
        for (const el of elements) {
            el.mesh.position.copy(el.target.pos);
            el.mesh.quaternion.copy(el.target.quat);
            if (el.glowLine && el.glowLine.material) el.glowLine.material.opacity = 0.55;
        }
        scene.userData.forceMat.uniforms.uOpacity.value = 0;
        if (hudState) hudState.textContent = 'STATIC';
        if (hudPhase) hudPhase.textContent = 'STRUCTURE · HOLD';
        if (hudPct) hudPct.textContent = '100%';
        if (hudBar) hudBar.style.transform = 'scaleX(1)';
        renderer.render(scene, camera);
    } else {
        requestAnimationFrame((n) => { clock.last = n; tick(n); });
    }
}
