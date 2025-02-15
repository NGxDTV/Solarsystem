function handleKeyDown(e) {
    if (e.key === "c") { document.body.style.background = "#" + Math.floor(Math.random() * 16777215).toString(16); }
    if (e.key === "b") { bulletTime = !bulletTime; simulationSpeed = bulletTime ? 0.2 : 1; }
    if (e.key === "y") { wireframeToggle = !wireframeToggle; instMesh.material.wireframe = wireframeToggle; }
    if (e.key === "i") { let p = document.getElementById("infoPanel"); p.style.display = p.style.display === "block" ? "none" : "block"; }
    if (e.key === "m") { let m2 = document.getElementById("bgMusic2"); bgMusic2Playing = !bgMusic2Playing; if (bgMusic2Playing) m2.play(); else m2.pause(); }
    if (e.key === "n") { neon = !neon; highlightMesh.material = new THREE.MeshBasicMaterial({ color: neon ? 0xff00ff : 0xffffff, wireframe: true }); }
    if (e.key === "k") { autoRotate = !autoRotate; controls.autoRotate = autoRotate; controls.autoRotateSpeed = 1; }
    if (e.key === "l") { if (!envMap) { let loader = new THREE.CubeTextureLoader(); loader.setPath("https://threejs.org/examples/textures/cube/Bridge2/"); envMap = loader.load(["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"]); } scene.environment = scene.environment ? null : envMap; }
    if (e.key === "g") { gridVisible = !gridVisible; scene.traverse(o => { if (o === gridMesh) o.visible = gridVisible; }); }
}