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
        const orbits = [
            // Periode = 2π / speed; 1 Erdenjahr ≈ 31.42 Zeiteinheiten (speed=0.2)

            // Merkur: 0.24 Jahre → speed ≈ 0.833
            { planet: solarSystem.children[1], distance: 50, speed: 0.833 },
            // Venus: 0.62 Jahre → speed ≈ 0.322
            { planet: solarSystem.children[2], distance: 80, speed: 0.322 },
            // Erde: 1 Jahr → speed = 0.2
            { planet: solarSystem.children[3], distance: 110, speed: 0.2 },
            // Mars: 1.88 Jahre → speed ≈ 0.106
            { planet: solarSystem.children[4], distance: 150, speed: 0.106 },
            // Jupiter: 11.86 Jahre → speed ≈ 0.0169
            { planet: solarSystem.children[5], distance: 200, speed: 0.0169 },
            // Saturn: 29.46 Jahre → speed ≈ 0.0068
            { planet: solarSystem.children[6], distance: 250, speed: 0.0068 },
            // Uranus: 84 Jahre → speed ≈ 0.00238
            { planet: solarSystem.children[7], distance: 300, speed: 0.00238 },
            // Neptun: 164.8 Jahre → speed ≈ 0.00121
            { planet: solarSystem.children[8], distance: 350, speed: 0.00121 }
        ];
        orbits.forEach(o => {
            const angle = time * o.speed;
            o.planet.position.set(
                sunPos.x + o.distance * Math.cos(angle),
                0,
                sunPos.z + o.distance * Math.sin(angle)
            );
            o.planet.rotation.y = angle;
        });
    }

    if (moon && earth) {
        // 27 Tage×24 Stunden/Tag=648 Stunden + 7 Stunden=655 Stunden / 24 = 27,2917 / 10 = 2.72917
        const moonOrbitSpeed = 2.72917;
        const angle = time * moonOrbitSpeed;
        moon.position.set(15 * Math.cos(angle), 0, 15 * Math.sin(angle));

        moon.lookAt(earth.position);
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