function createOrbitPath(orbitRadius, segments = 64) {
    let points = [];
    for (let i = 0; i <= segments; i++) {
        let theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta)));
    }
    let geometry = new THREE.BufferGeometry().setFromPoints(points);
    let material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    return new THREE.LineLoop(geometry, material);
}

function createDirectionArrow(position, direction, length) {
    return new THREE.ArrowHelper(direction, position, length, 0xff0000);
}

function generateCirclePoints(orbitRadius, segments = 64) {
    let points = [];
    for (let i = 0; i <= segments; i++) {
        let theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta)));
    }
    return points;
}

function getOrbitKey(selected) {
    if (selected.type === "planet") return "planet_" + selected.index;
    if (selected.object) return "object_" + selected.object.id;
    return null;
}

function toggleOrbitDisplay(selected) {
    if (!selected) return;
    let key = getOrbitKey(selected);
    if (!key) return;
    if (toggledOrbitDisplays[key]) {
        scene.remove(toggledOrbitDisplays[key].orbitGroup);
        delete toggledOrbitDisplays[key];
    } else {
        let group = new THREE.Group();
        if (selected.type === "planet") {
            let data = particleData[selected.index];
            if (data.parent) {
                let orbitLine = createOrbitPath(data.orbitRadius);
                orbitLine.position.copy(data.parent.position);
                let arrow = createDirectionArrow(data.position, data.velocity.clone().normalize(), data.orbitRadius * 0.2);
                group.add(orbitLine);
                group.add(arrow);
                group.userData = { data: data };
            }
        } else if (selected.object) {
            let selType = selected.object.userData.type.type;
            if (selType === "Sun") {
                if (selected.object.userData.planets && selected.object.userData.planets.length > 0) {
                    selected.object.userData.planets.forEach(p => {
                        let data, planetPos = new THREE.Vector3();
                        if (typeof p === "number") {
                            data = particleData[p];
                            planetPos.copy(data.position);
                        } else {
                            data = p.userData;
                            p.getWorldPosition(planetPos);
                        }
                        let sunPos = new THREE.Vector3();
                        selected.object.getWorldPosition(sunPos);
                        let orbitRadius = (data.orbitRadius !== undefined)
                            ? data.orbitRadius
                            : planetPos.distanceTo(sunPos);
                        let orbitLine = createOrbitPath(orbitRadius);
                        orbitLine.position.copy(sunPos);
                        let dir = new THREE.Vector3().subVectors(planetPos, sunPos).normalize();
                        let arrow = createDirectionArrow(planetPos, dir, orbitRadius * 0.2);
                        let subGroup = new THREE.Group();
                        subGroup.add(orbitLine);
                        subGroup.add(arrow);
                        subGroup.userData = { data: { orbitRadius, position: planetPos.clone(), velocity: data.velocity || dir } };
                        group.add(subGroup);
                    });
                }
            } else {
                let parent = selected.object.userData.parent;
                if (parent) {
                    let worldParent = new THREE.Vector3();
                    parent.getWorldPosition(worldParent);
                    let worldPos = new THREE.Vector3();
                    selected.object.getWorldPosition(worldPos);
                    let orbitRadius = selected.object.userData.orbitRadius || worldPos.distanceTo(worldParent);
                    if (group.children.length < 2) {
                        let orbitLine = createOrbitPath(orbitRadius);
                        orbitLine.position.copy(worldParent);
                        let dir = new THREE.Vector3().subVectors(worldPos, worldParent).normalize();
                        let arrow = createDirectionArrow(worldPos, dir, orbitRadius * 0.2);
                        group.add(orbitLine);
                        group.add(arrow);
                        group.userData = { data: selected.object.userData };
                    }
                }
            }
        }
        if (group.children.length > 0) {
            scene.add(group);
            selected.orbitGroup = group;
            toggledOrbitDisplays[key] = selected;
        }
    }
}

function updateAllOrbitDisplays() {
    for (let key in toggledOrbitDisplays) {
        let selected = toggledOrbitDisplays[key];
        if (selected.type === "planet") {
            let data = particleData[selected.index];
            if (
                data &&
                data.parent &&
                data.position &&
                data.velocity &&
                selected.orbitGroup &&
                selected.orbitGroup.children.length >= 2
            ) {
                let orbitLine = selected.orbitGroup.children[0];
                let arrow = selected.orbitGroup.children[1];
                orbitLine.geometry.setFromPoints(generateCirclePoints(data.orbitRadius));
                orbitLine.position.copy(data.parent.position);
                arrow.position.copy(data.position);
                arrow.setDirection(data.velocity.clone().normalize());
                arrow.setLength(data.orbitRadius * 0.2);
            }
        } else if (selected.object && selected.orbitGroup) {
            let selType = selected.object.userData.type.type;

            if (selType === "Sun") {
                selected.orbitGroup.children.forEach(subGroup => {
                    let data = subGroup.userData.data;

                    if (!data || !data.position) return;

                    let orbitRadius = (data.orbitRadius !== undefined)
                        ? data.orbitRadius
                        : data.position.distanceTo(selected.object.position);

                    let orbitLine = subGroup.children[0];
                    let arrow = subGroup.children[1];

                    orbitLine.geometry.setFromPoints(generateCirclePoints(orbitRadius));
                    orbitLine.position.copy(selected.object.position);

                    arrow.position.copy(data.position);

                    let dir;

                    if (data.velocity && data.velocity.length() > 0) {
                        dir = data.velocity.clone().normalize();
                    } else {
                        dir = new THREE.Vector3().subVectors(data.position, selected.object.position).normalize();
                    }

                    arrow.setDirection(dir);
                    arrow.setLength(orbitRadius * 0.2);
                });
            } else {
                let parent = selected.object.userData.parent;

                if (parent) {
                    let worldParent = new THREE.Vector3();

                    parent.getWorldPosition(worldParent);

                    let worldPos = new THREE.Vector3();

                    selected.object.getWorldPosition(worldPos);

                    let orbitRadius = selected.object.userData.orbitRadius || worldPos.distanceTo(worldParent);

                    if (selected.orbitGroup.children.length >= 2) {
                        let orbitLine = selected.orbitGroup.children[0];
                        let arrow = selected.orbitGroup.children[1];

                        orbitLine.geometry.setFromPoints(generateCirclePoints(orbitRadius));
                        orbitLine.position.copy(worldParent);

                        arrow.position.copy(worldPos);

                        let dir = new THREE.Vector3().subVectors(worldPos, worldParent).normalize();

                        arrow.setDirection(dir);
                        arrow.setLength(orbitRadius * 0.2);
                    }
                }
            }
        }
    }
}

function clearAllOrbitDisplays() {
    for (let key in toggledOrbitDisplays) {
        let selected = toggledOrbitDisplays[key];

        if (selected.orbitGroup) {
            scene.remove(selected.orbitGroup);
            selected.orbitGroup = null;
        }
    }

    toggledOrbitDisplays = {};
}
