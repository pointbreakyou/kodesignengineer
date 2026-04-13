/* ═══════════════════════════════════════════════════════════════
   HERO 3D GEAR + PARTICLES — Three.js Premium Animation
   Rotating wireframe gear with floating engineering particles
   ═══════════════════════════════════════════════════════════════ */

(function () {
    const container = document.getElementById('heroGearCanvas');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const accentColor = 0xdc2626;
    const accentLight = 0xef4444;

    function createGearGeometry(outerR, innerR, teeth, toothDepth, thickness) {
        const shape = new THREE.Shape();
        const anglePerTooth = (Math.PI * 2) / teeth;
        const halfTooth = anglePerTooth * 0.25;

        for (let i = 0; i < teeth; i++) {
            const angle = i * anglePerTooth;
            const r1 = outerR;
            const r2 = outerR + toothDepth;

            const a0 = angle - halfTooth * 1.1;
            const a1 = angle - halfTooth * 0.7;
            const a2 = angle + halfTooth * 0.7;
            const a3 = angle + halfTooth * 1.1;

            if (i === 0) {
                shape.moveTo(Math.cos(a0) * r1, Math.sin(a0) * r1);
            }
            shape.lineTo(Math.cos(a1) * r2, Math.sin(a1) * r2);
            shape.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
            shape.lineTo(Math.cos(a3) * r1, Math.sin(a3) * r1);

            const nextAngle = (i + 1) * anglePerTooth;
            const na0 = nextAngle - halfTooth * 1.1;
            shape.lineTo(Math.cos(na0) * r1, Math.sin(na0) * r1);
        }

        const holePath = new THREE.Path();
        holePath.absarc(0, 0, innerR, 0, Math.PI * 2, true);
        shape.holes.push(holePath);

        const extrudeSettings = { depth: thickness, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    function createGear(outerR, innerR, teeth, toothDepth, thickness, position, color, opacity) {
        const geo = createGearGeometry(outerR, innerR, teeth, toothDepth, thickness);
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: opacity,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position.x, position.y, position.z);
        return mesh;
    }

    const gear1 = createGear(1.8, 1.3, 20, 0.22, 0.35, { x: 0, y: 0, z: 0 }, accentColor, 0.25);
    mainGroup.add(gear1);

    const gear2 = createGear(1.0, 0.7, 12, 0.15, 0.35, { x: 2.3, y: -1.2, z: 0.3 }, accentLight, 0.18);
    mainGroup.add(gear2);

    const gear3 = createGear(0.6, 0.4, 8, 0.1, 0.25, { x: 3.1, y: -2.0, z: 0.5 }, accentColor, 0.14);
    mainGroup.add(gear3);

    function createRing(radius, segments, color, opacity) {
        const geo = new THREE.RingGeometry(radius - 0.01, radius + 0.01, segments);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
        return new THREE.Mesh(geo, mat);
    }

    const ring1 = createRing(2.4, 80, accentColor, 0.08);
    ring1.position.z = -0.2;
    mainGroup.add(ring1);

    const ring2 = createRing(2.7, 80, accentColor, 0.04);
    ring2.position.z = -0.3;
    mainGroup.add(ring2);

    const spokeGroup = new THREE.Group();
    const spokeMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.12 });
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const points = [
            new THREE.Vector3(Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0.18),
            new THREE.Vector3(Math.cos(angle) * 1.3, Math.sin(angle) * 1.3, 0.18),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        spokeGroup.add(new THREE.Line(geo, spokeMat));
    }
    mainGroup.add(spokeGroup);

    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        velocities.push({
            x: (Math.random() - 0.5) * 0.003,
            y: (Math.random() - 0.5) * 0.003,
            z: (Math.random() - 0.5) * 0.001,
        });
        sizes[i] = Math.random() * 2 + 0.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
        color: accentColor,
        size: 0.03,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const dimGroup = new THREE.Group();
    const dimMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.06 });

    function addDimLine(x1, y1, x2, y2, z) {
        const pts = [new THREE.Vector3(x1, y1, z), new THREE.Vector3(x2, y2, z)];
        dimGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), dimMat));
    }

    addDimLine(-3.5, -2.5, 3.5, -2.5, -0.5);
    addDimLine(-3.5, -2.5, -3.5, -2.6, -0.5);
    addDimLine(3.5, -2.5, 3.5, -2.6, -0.5);
    addDimLine(3.2, 2.5, 3.2, -2.5, -0.5);
    addDimLine(3.2, 2.5, 3.1, 2.5, -0.5);
    addDimLine(3.2, -2.5, 3.1, -2.5, -0.5);
    mainGroup.add(dimGroup);

    mainGroup.position.set(0.5, 0.2, 0);
    mainGroup.rotation.x = -0.1;

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    });

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.008;

        gear1.rotation.z = time * 0.5;
        gear2.rotation.z = -time * 0.75;
        gear3.rotation.z = time * 1.1;
        ring1.rotation.z = -time * 0.15;
        ring2.rotation.z = time * 0.1;
        spokeGroup.rotation.z = time * 0.5;

        mainGroup.rotation.y += (mouseX - mainGroup.rotation.y) * 0.03;
        mainGroup.rotation.x += (-mouseY * 0.3 - 0.1 - mainGroup.rotation.x) * 0.03;

        const posArr = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArr[i * 3] += velocities[i].x;
            posArr[i * 3 + 1] += velocities[i].y;
            posArr[i * 3 + 2] += velocities[i].z;

            if (Math.abs(posArr[i * 3]) > 5) velocities[i].x *= -1;
            if (Math.abs(posArr[i * 3 + 1]) > 4) velocities[i].y *= -1;
            if (Math.abs(posArr[i * 3 + 2]) > 2) velocities[i].z *= -1;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
})();
