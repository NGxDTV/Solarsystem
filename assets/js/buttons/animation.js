function startAnimation() {
    if (!simulationStartDate) {
        simulationStartDate = new Date();
    }
    isAnimating = true;
}

function pauseAnimation() { isAnimating = false; }

function resetSimulation() {
    for (let i = 0; i < TOTAL_PLANETS; i++) {
        particleData[i].position.copy(particleData[i].initialPosition);

        velocities[i * 3] = particleData[i].initialVelocity.x;
        velocities[i * 3 + 1] = particleData[i].initialVelocity.y;
        velocities[i * 3 + 2] = particleData[i].initialVelocity.z;

        dummy.position.copy(particleData[i].position);
        dummy.scale.set(sizes[i] * globalSizeMultiplier, sizes[i] * globalSizeMultiplier, sizes[i] * globalSizeMultiplier);
        dummy.updateMatrix();

        instMesh.setMatrixAt(i, dummy.matrix);
    }

    instMesh.instanceMatrix.needsUpdate = true;
    time = 0;

    camera.position.set(0, 300, 500);

    controls.target.set(0, 0, 0);
    controls.update();
}