function generateName() { return NAME_PARTS.prefixes[Math.floor(rand() * NAME_PARTS.prefixes.length)] + " " + NAME_PARTS.suffixes[Math.floor(rand() * NAME_PARTS.suffixes.length)] + "-" + Math.floor(1000 + rand() * 9000); }

function getAllObjectsWithUserData() {
    let objects = [];

    scene.traverse(o => {
        if (o.userData && o.userData.type && typeof o.userData.type === "object")
            objects.push(o)
    });

    return objects;
}

function updateRaycasterThreshold() {
    let distance = camera.position.distanceTo(controls.target);
    raycaster.params.InstancedMesh = { threshold: Math.max(20, distance * 0.1) };
}

function getHoveredInstance() {
    updateRaycasterThreshold();
    raycaster.setFromCamera(mouse, camera);
    let objs = getAllObjectsWithUserData();
    let nonInstanced = raycaster.intersectObjects(objs, true);
    if (nonInstanced.length > 0) {
        let obj = nonInstanced[0].object;
        if (!obj.userData.type && obj.parent && obj.parent.userData.type) {
            obj = obj.parent;
        }
        let type = obj.userData.type;
        return { isInstanced: false, type: type ? type.type : "Unknown", object: obj };
    }
    let inst = raycaster.intersectObject(instMesh, true);
    if (inst.length > 0) {
        return { isInstanced: true, type: "planet", index: inst[0].instanceId };
    }
    return null;
}

function onClick(e) {
    let hovered = getHoveredInstance();
    if (hovered) {
        if (hovered.isInstanced) { selectedObject = { type: "planet", index: hovered.index }; }
        else { selectedObject = { type: hovered.type, object: hovered.object }; }
        showInfo(selectedObject);
        updateConnectionLines();
    }
}

function showInfo(sel) {
    let data = sel.type === "planet" ? particleData[sel.index] : sel.object.userData;
    let pos = new THREE.Vector3();

    if (sel.type === "planet") pos.copy(data.position);
    else sel.object.getWorldPosition(pos);

    let dist = pos.distanceTo(camera.position).toFixed(2);
    let h3_text = "<h3>🌟 " + data.name + "</h3>";

    if (
        sel.object &&
        sel.object.userData &&
        sel.object.userData.name &&
        (sel.object.userData.name.includes("Sol") ||
            sel.object.userData.name.includes("Earth") ||
            sel.object.userData.name.includes("Moon"))
    ) {
        h3_text = "<h3>" + data.name + "</h3>";
    }

    let info = h3_text +
        "<p>🚀 Typ: " + (data.type ? data.type.type : "") + "</p>" +
        "<p>⚖️ Mass: " + data.mass.toExponential(2) + " kg</p>" +
        "<p>🛰️ Distance: " + dist + " LY</p>";

    document.getElementById("infoPanel").innerHTML = info;
    document.getElementById("infoPanel").style.display = "block";
}

function onDoubleClick(e) {
    if (currentTween) currentTween.stop();
    let hovered = getHoveredInstance();
    if (hovered) {
        let targetPos = new THREE.Vector3();
        if (hovered.isInstanced) {
            targetPos.copy(particleData[hovered.index].position);
        } else {
            hovered.object.getWorldPosition(targetPos);
        }
        let scaleFactor;
        if (hovered.isInstanced) {
            scaleFactor = sizes[hovered.index];
        } else {
            let geo = hovered.object.geometry;
            if (!geo && hovered.object.children.length > 0) {
                hovered.object.children.forEach(child => {
                    if (child.geometry) geo = child.geometry;
                });
            }
            if (geo) {
                geo.computeBoundingSphere();
                scaleFactor = geo.boundingSphere.radius;
            } else {
                scaleFactor = 1;
            }
        }
        followOffset.copy(presetOffset).multiplyScalar(scaleFactor * 0.2);
        currentTween = new TWEEN.Tween({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            tx: controls.target.x,
            ty: controls.target.y,
            tz: controls.target.z
        })
            .to({
                x: targetPos.x + followOffset.x,
                y: targetPos.y + followOffset.y,
                z: targetPos.z + followOffset.z,
                tx: targetPos.x,
                ty: targetPos.y,
                tz: targetPos.z
            }, 2000)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate(function (o) {
                camera.position.set(o.x, o.y, o.z);
                controls.target.set(o.tx, o.ty, o.tz);
                controls.update();
            })
            .onComplete(function () {
                if (hovered.isInstanced) {
                    followTarget = { type: "planet", index: hovered.index };
                } else {
                    followTarget = { type: hovered.type, object: hovered.object };
                }
                currentTween = null;
            })
            .start();
    }
}

function onMouseMove(e) {
    let rect = renderer.domElement.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -(e.clientY - rect.top) / rect.height * 2 + 1;
    let hovered = getHoveredInstance();
    let t = document.querySelector(".tooltip");
    if (hovered) {
        let data, dist;
        if (hovered.isInstanced) {
            data = particleData[hovered.index];
            dist = data.position.distanceTo(camera.position).toFixed(2);
            highlightMesh.position.copy(data.position);
            let s = sizes[hovered.index] * 1.5; highlightMesh.scale.set(s, s, s);
        } else {
            data = hovered.object.userData;
            let worldPos = new THREE.Vector3(); hovered.object.getWorldPosition(worldPos);
            dist = worldPos.distanceTo(camera.position).toFixed(2);
            highlightMesh.position.copy(worldPos);
            let s = hovered.object.scale.x * 1.5; highlightMesh.scale.set(s, s, s);
        }
        t.textContent = data.name + " (" + dist + " LY)";
        t.style.display = "block";
        t.style.left = (e.clientX + 15) + "px";
        t.style.top = e.clientY + "px";
        highlightMesh.visible = true;
    } else { t.style.display = "none"; highlightMesh.visible = false; }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateParticles() {
    time += 0.01 * simulationSpeed;
    for (let i = 0; i < TOTAL_PLANETS; i++) {
        let i3 = i * 3; let d = particleData[i];
        if (d.parent) {
            d.orbitAngle += d.orbitSpeed * simulationSpeed;
            d.position.x = d.parent.position.x + d.orbitRadius * Math.cos(d.orbitAngle);
            d.position.z = d.parent.position.z + d.orbitRadius * Math.sin(d.orbitAngle);
        } else {
            velocities[i3] *= 0.998;
            velocities[i3 + 1] *= 0.998;
            velocities[i3 + 2] *= 0.998;
            if (attractionEnabled) {
                let pos = d.position; let dir = new THREE.Vector3(-pos.x, -pos.y, -pos.z).normalize();
                velocities[i3] += dir.x * 0.01; velocities[i3 + 1] += dir.y * 0.01; velocities[i3 + 2] += dir.z * 0.01;
            }
            d.position.x += velocities[i3];
            d.position.y += velocities[i3 + 1];
            d.position.z += velocities[i3 + 2];
        }
        let age = d.position.length() / 1000;

        colors[i3] = d.type.color.r * (1 - age * 0.2);
        colors[i3 + 1] = d.type.color.g * (1 - age * 0.2);
        colors[i3 + 2] = d.type.color.b * (1 - age * 0.2);

        let s = d.glow ? d.type.size * (1 + Math.sin(time * 3 + i) * 0.5) * globalSizeMultiplier : d.type.size * globalSizeMultiplier;
        sizes[i] = s;
        dummy.position.copy(d.position);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
        instMesh.instanceColor.setXYZ(i, colors[i3], colors[i3 + 1], colors[i3 + 2]);
    }
    instMesh.instanceMatrix.needsUpdate = true;
    instMesh.instanceColor.needsUpdate = true;
    updateAtmosphere();
}

function updateAtmosphere() {
    for (let i = 0; i < TOTAL_PLANETS; i++) {
        let d = particleData[i];
        dummyAtm.position.copy(d.position);
        let s = sizes[i] * 1.1;
        dummyAtm.scale.set(s, s, s);
        dummyAtm.updateMatrix();
        atmMesh.setMatrixAt(i, dummyAtm.matrix);
        atmMesh.instanceColor.setXYZ(i, colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
    }
    atmMesh.instanceMatrix.needsUpdate = true;
    atmMesh.instanceColor.needsUpdate = true;
}

function updateSimulationDate() {
    if (!simulationStartDate) return;
    const daysPassed = time * (365.25 / 31.42);
    const simDate = new Date(simulationStartDate.getTime() + daysPassed * 24 * 60 * 60 * 1000);
    const hours = simDate.getHours().toString().padStart(2, '0');
    const minutes = simDate.getMinutes().toString().padStart(2, '0');
    const seconds = simDate.getSeconds().toString().padStart(2, '0');
    document.getElementById("timeDisplay").textContent =
        "Date: " +
        simDate.getDate().toString().padStart(2, '0') + "." +
        (simDate.getMonth() + 1).toString().padStart(2, '0') + "." +
        simDate.getFullYear() + " " +
        hours + ":" + minutes + ":" + seconds;
}

// Todo - Keine Ahunung wie das geht
function updateGridDeformation() {
    let positions = gridGeometry.attributes.position.array;
    let count = gridGeometry.attributes.position.count;
    let A = 2.5e-23, B = 1e6;

    for (let i = 0; i < count; i++) {
        let idx = i * 3; let x = positions[idx], z = positions[idx + 2], y = 0;

        suns.forEach(function (sun) {
            let dx = x - sun.position.x; let dz = z - sun.position.z; let d2 = dx * dx + dz * dz;
            y += -A * sun.userData.mass / (d2 + B);
        });

        positions[idx + 1] = y;
    }

    gridGeometry.attributes.position.needsUpdate = true;
}

function formatSimTime(t) {
    // Simulation: one Earth year ≈ 2π/0.2 ≈ 31.42 time units
    const earthYear = 2 * Math.PI / 0.2;
    const years = Math.floor(t / earthYear);
    const remainder = t % earthYear;
    const months = Math.floor((remainder / earthYear) * 12);
    const days = Math.floor((remainder / earthYear) * 365);
    return years + " Years, " + months + " Month, " + days + " Days";
}

function setPlanetenNachDatum(eingabeDatum) {
    const inputDate = new Date(eingabeDatum);

    if (isNaN(inputDate.getTime())) {
        alert("Ungültiges Datum!");
        return;
    }

    const refDate = new Date(1128, 3, 11);
    simulationStartDate = refDate;

    const diffDays = (inputDate - refDate) / (1000 * 60 * 60 * 24);
    const conversion = 31.42 / 365.25;

    time = diffDays * conversion;

    updateSimulationDate();
}