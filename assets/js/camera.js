function tweenCamera(targetPos) {
    let camOff = new THREE.Vector3().subVectors(camera.position, targetPos).normalize().multiplyScalar(100);
    let newCamPos = targetPos.clone().add(camOff);

    currentTween = new TWEEN.Tween({ x: camera.position.x, y: camera.position.y, z: camera.position.z, tx: controls.target.x, ty: controls.target.y, tz: controls.target.z })
        .to({ x: newCamPos.x, y: newCamPos.y, z: newCamPos.z, tx: targetPos.x, ty: targetPos.y, tz: targetPos.z }, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function (o) { camera.position.set(o.x, o.y, o.z); controls.target.set(o.tx, o.ty, o.tz); controls.update(); }).start();
}

document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    followTarget = null;
}, false);