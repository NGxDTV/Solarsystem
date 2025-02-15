function updateConnectionLines() {
    let pts = [];

    if (trailsEnabled) {
        suns.forEach(function (sun) {
            if (sun.userData.planets && sun.userData.planets.length > 0) {
                sun.userData.planets.forEach(function (p) {
                    if (typeof p === "number") {
                        let d = particleData[p];

                        pts.push(sun.position.x, sun.position.y, sun.position.z, d.position.x, d.position.y, d.position.z);
                    } else {
                        let posA = new THREE.Vector3(), posB = new THREE.Vector3();

                        sun.getWorldPosition(posA);
                        p.getWorldPosition(posB);

                        pts.push(posA.x, posA.y, posA.z, posB.x, posB.y, posB.z);
                    }
                });
            }
        });
    }
    if (selectedObject) {
        if (selectedObject.type === "planet") {
            let d = particleData[selectedObject.index];

            if (d.parent) {
                let posA = new THREE.Vector3(), posB = new THREE.Vector3();

                d.parent.getWorldPosition(posA);
                d.position.clone().copy(posB);

                pts.push(posA.x, posA.y, posA.z, d.position.x, d.position.y, d.position.z);
            }
        } else if (selectedObject.object && selectedObject.object.userData && selectedObject.object.userData.planets) {
            let origin = new THREE.Vector3();

            selectedObject.object.getWorldPosition(origin);

            selectedObject.object.userData.planets.forEach(function (p) {
                if (typeof p === "number") {
                    let d = particleData[p];
                    pts.push(origin.x, origin.y, origin.z, d.position.x, d.position.y, d.position.z);
                } else {
                    let posB = new THREE.Vector3();
                    p.getWorldPosition(posB);
                    pts.push(origin.x, origin.y, origin.z, posB.x, posB.y, posB.z);
                }
            });
        }
    }

    if (pts.length > 0) {
        if (connectionLines) {
            connectionLines.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
            connectionLines.geometry.attributes.position.needsUpdate = true;
            connectionLines.geometry.computeBoundingSphere();

            connectionLines.material.opacity = trailOpacity;

            connectionLines.visible = true;
        } else {
            let geo = new THREE.BufferGeometry();

            geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
            geo.computeBoundingSphere();

            connectionLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: trailOpacity }));

            scene.add(connectionLines);
        }
    } else if (connectionLines) {
        connectionLines.visible = false;
    }
}