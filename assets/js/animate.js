function animate() {
    let currentTime = performance.now();
    let delta = (currentTime - prevTime) / 1000;

    prevTime = currentTime;

    requestAnimationFrame(animate);

    frameCount++;

    if (currentTime - lastFrameTime >= 1000) {
        fps = frameCount;
        document.getElementById("fpsCounter").textContent = "FPS: " + fps;
        frameCount = 0;
        lastFrameTime = currentTime;
    }

    TWEEN.update();

    if (followTarget && !currentTween) {
        let targetPos = new THREE.Vector3();

        if (followTarget.type === "planet") {
            targetPos.copy(particleData[followTarget.index].position);
        } else {
            followTarget.object.getWorldPosition(targetPos);
        }

        controls.target.copy(targetPos);
        camera.position.copy(targetPos).add(followOffset);
        controls.update();
    }

    if (isAnimating) {
        updateParticles();
        controls.update();
        updateSimulationDate();
    }

    if (solarSystem) {
        const sunPos = new THREE.Vector3();
        solarSystem.children[0].getWorldPosition(sunPos); // Sonne

        // 1 Erdenjahr ≈ 31.42 Sim.-Einheiten → 1 Tag ≈ 31.42/365.25 ≈ 0.0861 Sim.-Einheiten
        // 2π / 0.0861 ≈ 73.09 rad/Sim.-Einheit
        const orbits = [
            // Merkur: Rotationsperiode = 58.6 Tage 
            // rotationSpeed = 2π / (58.6 * 0.0861) ≈ 1.245 rad/Sim.-Einheit
            { planet: solarSystem.children[1], distance: 50, speed: 0.833, rotationSpeed: 1.245 },

            // Venus: 243 Tage (rückläufig)
            // rotationSpeed = -2π / (243 * 0.0861) ≈ -0.300 rad/Sim.-Einheit
            { planet: solarSystem.children[2], distance: 80, speed: 0.322, rotationSpeed: -0.300 },

            // Erde: 1 Tag Rotation
            // rotationSpeed = 2π / 0.0861 ≈ 73.09 rad/Sim.-Einheit
            { planet: solarSystem.children[3], distance: 110, speed: 0.2, rotationSpeed: 73.09 },

            // Mars: 1.03 Tage
            // rotationSpeed = 2π / (1.03 * 0.0861) ≈ 70.87 rad/Sim.-Einheit
            { planet: solarSystem.children[4], distance: 150, speed: 0.106, rotationSpeed: 70.87 },

            // Jupiter: 0.41 Tage
            // rotationSpeed = 2π / (0.41 * 0.0861) ≈ 177.85 rad/Sim.-Einheit
            { planet: solarSystem.children[5], distance: 200, speed: 0.0169, rotationSpeed: 177.85 },

            // Saturn: 0.45 Tage
            // rotationSpeed = 2π / (0.45 * 0.0861) ≈ 162.00 rad/Sim.-Einheit
            { planet: solarSystem.children[6], distance: 250, speed: 0.0068, rotationSpeed: 162.00 },

            // Uranus: 0.72 Tage (retrograd)
            // rotationSpeed = -2π / (0.72 * 0.0861) ≈ -101.38 rad/Sim.-Einheit
            { planet: solarSystem.children[7], distance: 300, speed: 0.00238, rotationSpeed: -101.38 },

            // Neptun: 0.67 Tage
            // rotationSpeed = 2π / (0.67 * 0.0861) ≈ 108.90 rad/Sim.-Einheit
            { planet: solarSystem.children[8], distance: 350, speed: 0.00121, rotationSpeed: 108.90 }
        ];

        orbits.forEach(o => {
            const angle = time * o.speed;

            // Orbit-Position berechnen
            o.planet.position.set(
                sunPos.x + o.distance * Math.cos(angle),
                0,
                sunPos.z + o.distance * Math.sin(angle)
            );

            if (isAnimating) {
                const simDt = 0.01 * simulationSpeed;
                // 1 Sim.-Tag (≈0.0861 Sim.-Einheiten)
                o.planet.rotation.y += o.rotationSpeed * simDt;
            }
        });
    }

    if (solarSystem.children[3].children.length > 0) {
        // 27 Tage×24 Stunden/Tag=648 Stunden + 7 Stunden=655 Stunden / 24 = 27,2917 / 10 = 2.72917
        const earth = solarSystem.children[3];
        const moon = earth.children.find(child => child.userData?.type?.type === "Moon");

        const moonOrbitSpeed = 2.72917;
        const angle = time * moonOrbitSpeed;

        moon.position.set(15 * Math.cos(angle), 0, 15 * Math.sin(angle));
        moon.lookAt(earth.position);
    }

    // Phobos
    if (solarSystem.children[4].children.length > 0) {
        const mars = solarSystem.children[4];
        const phobos = mars.children.find(child => child.userData?.name === "Phobos");

        if (phobos) {
            const phobosOrbitSpeed = (2 * Math.PI) / 0.3189;
            const angle = time * phobosOrbitSpeed;

            phobos.rotation.y = angle * 10;
            phobos.position.set(6 * Math.cos(angle), 0, 6 * Math.sin(angle));
        }
    }

    // Deimos
    if (solarSystem.children[4].children.length > 0) {
        const mars = solarSystem.children[4];
        const deimos = mars.children.find(child => child.userData?.name === "Deimos");

        if (deimos) {
            const deimosOrbitSpeed = (2 * Math.PI) / 1.262; // Umlaufzeit 1.262 Tage
            const angle = time * deimosOrbitSpeed;

            deimos.rotation.y = angle * 10;
            deimos.position.set(12 * Math.cos(angle), 0, 12 * Math.sin(angle));
        }
    }

    if (selectedObject) {
        if (selectedObject.type === "planet") {
            let d = particleData[selectedObject.index];
            let s = sizes[selectedObject.index] * 1.5;

            highlightMesh.position.copy(d.position);
            highlightMesh.scale.set(s, s, s);
        } else {
            let pos = new THREE.Vector3();

            selectedObject.object.getWorldPosition(pos);
            highlightMesh.position.copy(pos);

            let s = selectedObject.object.scale.x * 1.5;

            highlightMesh.scale.set(s, s, s);
        }

        highlightMesh.visible = true;
    }

    if (debugEnabled) {
        document.getElementById("debugOverlay").innerHTML =
            "Cam: " + camera.position.x.toFixed(2) + ", " + camera.position.y.toFixed(2) + ", " + camera.position.z.toFixed(2) +
            "<br>Speed: " + simulationSpeed.toFixed(2) + "<br>Size: " + globalSizeMultiplier.toFixed(2);
    }

    updateConnectionLines();
    updateGridDeformation();
    updateAllOrbitDisplays();

    renderer.setClearColor(0x0a0a1a, trailsEnabled ? trailOpacity : 1);
    renderer.clear();
    renderer.render(scene, camera);

    minimapRenderer.render(scene, minimapCamera);
}