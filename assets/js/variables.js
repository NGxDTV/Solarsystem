let seed = Date.now() % 233280; function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
const TOTAL_PLANETS = 5000; let scene, camera, renderer, controls, instMesh, atmMesh, dummy, dummyAtm, velocities, colors, sizes, planetTexture, highlightMesh;

let particleData = [], suns = [], numSuns = Math.floor(TOTAL_PLANETS * 0.01);
let simulationSpeed = 0.01, globalSizeMultiplier = 1, raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(), connectionLines = null, selectedObject = null;
let currentTween = null, lastFrameTime = performance.now(), frameCount = 0, fps = 0, time = 0, prevTime = performance.now();
let fogEnabled = true, starfieldEnabled = true, stars;
let bulletTime = false, wireframeToggle = false, autoRotate = false, envMap = null, gridVisible = true, bgMusic2Playing = false, neon = false;
let trailsEnabled = false, attractionEnabled = false, debugEnabled = false, trailOpacity = 1, isAnimating = false;
let minimapRenderer, minimapCamera, gridGeometry, gridMesh, solarSystem, realSun, earth, moon;

let simulationStartDate = null;

const NAME_PARTS = { prefixes: ["Alpha", "Beta", "Gamma", "Andromeda", "Sombrero", "Whirlpool", "Centaurus", "Triangulum", "Virgo", "Cygnus"], suffixes: ["Prime", "Nebula", "Cluster", "Void", "Abyss", "Horizon", "Singularity", "Fornax", "Perseus", "Carina"] };

let followTarget = null;
let followOffset = new THREE.Vector3();
const presetOffset = new THREE.Vector3(0, 20, 20);

let toggledOrbitDisplays = {};