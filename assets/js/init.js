function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 10000);
    camera.updateProjectionMatrix();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a1a, 1);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 300, 500);
    controls.update();

    dummy = new THREE.Object3D();
    dummyAtm = new THREE.Object3D();

    velocities = new Float32Array(TOTAL_PLANETS * 3);
    colors = new Float32Array(TOTAL_PLANETS * 3);
    sizes = new Float32Array(TOTAL_PLANETS);

    planetTexture = new THREE.TextureLoader().load("images/MakeMake/2k_makemake_fictional.jpg");

    instMesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshPhongMaterial({ map: planetTexture, vertexColors: true, flatShading: true }),
        TOTAL_PLANETS
    );
    instMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(TOTAL_PLANETS * 3), 3);

    atmMesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1.1, 8, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3, color: 0xffffff, blending: THREE.AdditiveBlending }),
        TOTAL_PLANETS
    );
    atmMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    atmMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(TOTAL_PLANETS * 3), 3);

    for (let i = 0; i < TOTAL_PLANETS; i++) {
        particleData.push({});
    }

    // Erstelle Sonnen
    for (let i = 0; i < numSuns; i++) {
        let sunSize = 10 * (0.5 + rand());
        let sunGeo = new THREE.SphereGeometry(sunSize, 16, 16);
        let sunMat = new THREE.MeshPhongMaterial({ color: 0xffaa00, emissive: 0xffcc00 });
        let sun = new THREE.Mesh(sunGeo, sunMat);
        let pos;
        do {
            pos = new THREE.Vector3((rand() - 0.5) * 2000, (rand() - 0.5) * 2000, (rand() - 0.5) * 2000);
        } while (pos.length() < 500);
        sun.position.copy(pos);
        sun.userData = {
            type: { type: "Sun" },
            name: generateName(),
            mass: 2e30 * (0.5 + rand()),
            initialPosition: pos.clone(),
            velocity: pos.clone().normalize().multiplyScalar(rand() * 2 + 0.5),
            planets: []
        };
        let sunAtm = new THREE.Mesh(
            new THREE.SphereGeometry(sunSize * 1.1, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending })
        );
        sun.add(sunAtm);
        scene.add(sun);
        suns.push(sun);
    }

    // Erstelle Partikel
    for (let i = 0; i < TOTAL_PLANETS; i++) {
        let isOrbiting = rand() < 0.3 && suns.length > 0;
        let pos, orbitRadius = 0, orbitAngle = 0, orbitSpeed = 0;

        if (isOrbiting) {
            let parent = suns[Math.floor(rand() * suns.length)];
            orbitRadius = 50 + rand() * 200;
            orbitAngle = rand() * Math.PI * 2;
            pos = parent.position.clone();
            pos.x += orbitRadius * Math.cos(orbitAngle);
            pos.z += orbitRadius * Math.sin(orbitAngle);
            particleData[i].parent = parent;
            parent.userData.planets.push(i);
            orbitSpeed = 0.001 + rand() * 0.01;
        } else {
            do {
                pos = new THREE.Vector3((rand() - 0.5) * 2000, (rand() - 0.5) * 2000, (rand() - 0.5) * 2000);
            } while (pos.length() < 500);
            particleData[i].parent = null;
        }

        particleData[i].position = pos.clone();
        let vel = pos.clone().normalize().multiplyScalar(rand() * 1.5 + 0.5);
        particleData[i].velocity = vel.clone();
        particleData[i].initialVelocity = vel.clone();

        let t = Math.random();
        let density = t < 0.33 ? 5 : t < 0.66 ? 10 : 2;
        let col, size;
        if (t < 0.33) {
            col = new THREE.Color(0.4, 0.4, 1);
            size = 3 * (0.8 + Math.random() * 0.4);
            particleData[i].type = { type: "Spiral Galaxy", color: col, size: size, speed: 0.3, glow: true };
        } else if (t < 0.66) {
            col = new THREE.Color(1.0, 0.8, 0.2);
            size = 1.5 * (0.8 + Math.random() * 0.4);
            particleData[i].type = { type: "Star Cluster", color: col, size: size, speed: 0.6, glow: true };
        } else {
            col = new THREE.Color(0.3, 0.1, 0.6);
            size = 0.5 * (0.8 + Math.random() * 0.4);
            particleData[i].type = { type: "Dark Matter", color: col, size: size, speed: 0.8, glow: false };
        }
        particleData[i].mass = (4 / 3) * Math.PI * Math.pow(size, 3) * density;
        particleData[i].name = generateName();
        particleData[i].discovered = new Date(
            2023 - Math.floor(Math.random() * 50),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28)
        );
        particleData[i].orbitRadius = orbitRadius;
        particleData[i].orbitAngle = orbitAngle;
        particleData[i].orbitSpeed = orbitSpeed;
        particleData[i].glow = particleData[i].type.glow;

        velocities[i * 3] = particleData[i].velocity.x * particleData[i].type.speed;
        velocities[i * 3 + 1] = particleData[i].velocity.y * particleData[i].type.speed;
        velocities[i * 3 + 2] = particleData[i].velocity.z * particleData[i].type.speed;

        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;

        sizes[i] = size;

        dummy.position.copy(pos);
        dummy.scale.set(size * globalSizeMultiplier, size * globalSizeMultiplier, size * globalSizeMultiplier);
        dummy.updateMatrix();

        instMesh.setMatrixAt(i, dummy.matrix);
        instMesh.instanceColor.setXYZ(i, col.r, col.g, col.b);

        dummyAtm.position.copy(pos);
        dummyAtm.scale.set(size * 1.1 * globalSizeMultiplier, size * 1.1 * globalSizeMultiplier, size * 1.1 * globalSizeMultiplier);
        dummyAtm.updateMatrix();

        atmMesh.setMatrixAt(i, dummyAtm.matrix);
        atmMesh.instanceColor.setXYZ(i, col.r, col.g, col.b);
    }

    scene.add(instMesh);
    scene.add(atmMesh);

    // Sterne und Fog
    let starMaterial = new THREE.PointsMaterial({ size: 0.1, color: 0xffffff });
    let starGeometry = new THREE.BufferGeometry();
    let starPositions = new Float32Array(300000);
    for (let i = 0; i < 300000; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 8000;
        starPositions[i + 1] = (Math.random() - 0.5) * 8000;
        starPositions[i + 2] = (Math.random() - 0.5) * 8000;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0005);

    // Minimap
    let gridMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true, transparent: true, opacity: 0.5 });
    let ambient = new THREE.AmbientLight(0xffffff, 0.5);
    let directional = new THREE.DirectionalLight(0xffffff, 1);

    minimapRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    minimapRenderer.setSize(200, 200);
    minimapRenderer.domElement.id = "minimap";
    minimapRenderer.domElement.style.pointerEvents = "none";
    document.getElementById("minimap").parentNode.replaceChild(minimapRenderer.domElement, document.getElementById("minimap"));

    minimapCamera = new THREE.OrthographicCamera(-500, 500, 500, -500, 0.1, 10000);
    minimapCamera.position.set(0, 1000, 0);
    minimapCamera.lookAt(0, 0, 0);

    highlightMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ map: planetTexture, wireframe: true }));
    highlightMesh.visible = false;

    directional.position.set(1, 1, 1);

    scene.add(highlightMesh);
    scene.add(ambient);
    scene.add(directional);

    gridGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    gridGeometry.rotateX(-Math.PI / 2);
    gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    scene.add(gridMesh);

    raycaster.params.InstancedMesh = { threshold: Math.max(20, camera.position.distanceTo(controls.target) * 0.1) };

    // Event Listener
    window.addEventListener("resize", onWindowResize, false);
    document.getElementById("startBtn").addEventListener("click", startAnimation);
    document.getElementById("pauseBtn").addEventListener("click", pauseAnimation);
    document.getElementById("resetBtn").addEventListener("click", resetSimulation);

    document.getElementById("resetCamera").addEventListener("click", function () {
        camera.position.set(0, 300, 500);
        controls.target.set(0, 0, 0);
        controls.update();
    });

    document.getElementById("screenshotBtn").addEventListener("click", takeScreenshot);
    document.getElementById("musicToggle").addEventListener("click", toggleMusic);
    document.getElementById("fogToggle").addEventListener("click", toggleFog);
    document.getElementById("starToggle").addEventListener("click", toggleStarfield);

    document.getElementById("speedSlider").addEventListener("input", function (e) {
        simulationSpeed = parseFloat(e.target.value);
    });

    document.getElementById("sizeSlider").addEventListener("input", function (e) {
        globalSizeMultiplier = parseFloat(e.target.value);
    });

    document.getElementById("shortcutsToggle").addEventListener("click", function () {
        let m = document.getElementById("shortcutsMenu");
        m.style.display = m.style.display === "block" ? "none" : "block";
    });

    document.getElementById("attractionToggle").addEventListener("click", function () {
        attractionEnabled = !attractionEnabled;
    });

    document.getElementById("reinitParticles").addEventListener("click", reinitParticles);

    document.getElementById("trailsToggle").addEventListener("click", function () {
        trailsEnabled = !trailsEnabled;
        updateConnectionLines();
    });

    document.getElementById("fullscreenToggle").addEventListener("click", toggleFullscreen);

    document.getElementById("fovSlider").addEventListener("input", function (e) {
        camera.fov = parseFloat(e.target.value);
        camera.updateProjectionMatrix();
    });

    document.getElementById("ambientSoundToggle").addEventListener("click", function () {
        let a = document.getElementById("ambientSound");
        if (a.paused) a.play();
        else a.pause();
    });

    document.getElementById("randomizeSimBtn").addEventListener("click", randomizeSim);

    document.getElementById("debugToggle").addEventListener("click", function () {
        debugEnabled = !debugEnabled;
        document.getElementById("debugOverlay").style.display = debugEnabled ? "block" : "none";
    });

    document.getElementById("trailOpacitySlider").addEventListener("input", function (e) {
        trailOpacity = parseFloat(e.target.value);
        if (connectionLines) connectionLines.material.opacity = trailOpacity;
    });

    document.getElementById("toggleOrbitBtn").addEventListener("click", function () {
        toggleOrbitDisplay(selectedObject);
    });

    document.getElementById("clearOrbitDisplaysBtn").addEventListener("click", function () {
        clearAllOrbitDisplays();
    });

    document.getElementById("setDateBtn").addEventListener("click", function () {
        const input = prompt("Gib ein Datum ein (DD.MM.YYYY):");

        if (input) {
            const parts = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

            if (parts) {
                const day = parseInt(parts[1], 10);
                const month = parseInt(parts[2], 10) - 1;
                const year = parseInt(parts[3], 10);
                const date = new Date(year, month, day);

                if (!isNaN(date.getTime())) {
                    setPlanetenNachDatum(date);
                } else {
                    alert("Ungültiges Datum!");
                }
            } else {
                alert("Format: DD.MM.YYYY");
            }
        }
    });

    controls.addEventListener("change", () => {
        if (followTarget && !currentTween) {
            let targetPos = new THREE.Vector3();

            if (followTarget.type === "planet") {
                targetPos.copy(particleData[followTarget.index].position);
            } else {
                followTarget.object.getWorldPosition(targetPos);
            }

            followOffset.copy(camera.position).sub(targetPos);
        }
    });

    window.addEventListener("keydown", handleKeyDown);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("click", onClick);
    document.addEventListener("dblclick", onDoubleClick);

    solarSystem = createSolarSystem();
    scene.add(solarSystem);
    realSun = solarSystem.children[0];

    suns.push(realSun);
    setPlanetenNachDatum(new Date());
    animate();
}