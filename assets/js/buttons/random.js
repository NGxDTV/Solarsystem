function takeScreenshot() {
    renderer.render(scene, camera);

    let dataURL = renderer.domElement.toDataURL("image/png");
    let link = document.createElement("a");

    link.href = dataURL; link.download = "screenshot.png";
    link.click();
}

function toggleMusic() { let music = document.getElementById("bgMusic"); if (music.paused) music.play(); else music.pause(); }
function toggleFog() { fogEnabled = !fogEnabled; scene.fog = fogEnabled ? new THREE.FogExp2(0x0a0a1a, 0.0005) : null; }
function toggleStarfield() { starfieldEnabled = !starfieldEnabled; stars.visible = starfieldEnabled; }

function reinitParticles() {
    for (let i = 0; i < TOTAL_PLANETS; i++) {
        let pos;
        do {
            pos = new THREE.Vector3((rand() - 0.5) * 2000, (rand() - 0.5) * 2000, (rand() - 0.5) * 2000);
        } while (pos.length() < 500);
        particleData[i].position = pos.clone();
        dummy.position.copy(particleData[i].position);
        dummy.scale.set(sizes[i] * globalSizeMultiplier, sizes[i] * globalSizeMultiplier, sizes[i] * globalSizeMultiplier);
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
    }
    instMesh.instanceMatrix.needsUpdate = true;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); }
    else { if (document.exitFullscreen) { document.exitFullscreen(); } }
}

function randomizeSim() {
    simulationSpeed = 0.1 + rand() * 1.9;
    globalSizeMultiplier = 0.5 + rand() * 2.5;
    for (let i = 0; i < TOTAL_PLANETS; i++) {
        let f = 0.5 + rand() * 1.5;
        velocities[i * 3] *= f; velocities[i * 3 + 1] *= f; velocities[i * 3 + 2] *= f;
    }
}
