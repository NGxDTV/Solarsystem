function createSun() {
    const sunTexture = new THREE.TextureLoader().load("images/Sun/2k_sun.jpg");
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 32), sunMaterial);

    sun.userData = { type: { type: "Sun" }, name: "☀️ Sol", mass: 2e30, planets: [] };

    const sunGlowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            c: { value: 0.5 },
            p: { value: 4.0 },
            glowColor: { value: new THREE.Color(0xffaa00) },
            viewVector: { value: camera.position }
        },

        vertexShader: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(c - dot(vNormal, vNormel), p);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,

        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
            `,

        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 32), sunGlowMaterial);

    sunGlow.scale.multiplyScalar(1.2);
    sun.add(sunGlow);

    return sun;
}

function createEarth(sun) {
    const earthGeometry = new THREE.SphereGeometry(10, 32, 32);
    const earthTexture = new THREE.TextureLoader().load("images/Earth/2k_earth_daymap.jpg");
    const earthNightTexture = new THREE.TextureLoader().load("images/Earth/2k_earth_nightmap.jpg");
    const cloudTexture = new THREE.TextureLoader().load("images/Earth/2k_earth_clouds.jpg");

    const earthMaterial = new THREE.MeshStandardMaterial({
        map: earthTexture,
        roughness: 1,
        metalness: 0
    });

    const earthNightMaterial = new THREE.MeshStandardMaterial({
        map: earthNightTexture,
        roughness: 1,
        metalness: 0,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    const earthNight = new THREE.Mesh(earthGeometry, earthNightMaterial);

    const cloudMaterial = new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.4
    });

    const cloudMesh = new THREE.Mesh(earthGeometry, cloudMaterial);
    cloudMesh.scale.multiplyScalar(1.02);

    earth.add(earthNight);
    earth.add(cloudMesh);

    earth.userData = { type: { type: "Planet" }, name: "🌍 Earth", mass: 5.972e24, parent: sun, planets: [] };

    const earthAtmosMaterial = new THREE.ShaderMaterial({
        uniforms: {},

        vertexShader: `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,

        fragmentShader: `
    varying vec3 vNormal;
    void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
`,

        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });

    const earthAtmosphere = new THREE.Mesh(earthGeometry, earthAtmosMaterial);
    earthAtmosphere.scale.multiplyScalar(1.1);

    earth.add(earthAtmosphere);
    earth.position.set(100, 0, 0);

    return earth;
}

function createMoon(earth) {
    const moonTexture = new THREE.TextureLoader().load("images/Moon/2k_moon.jpg");
    const moonMaterial = new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 1,
        metalness: 0
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), moonMaterial);
    moon.userData = { type: { type: "Moon" }, name: "🌖 Moon", mass: 7.342e22, parent: earth };
    earth.userData.planets.push(moon);
    moon.position.set(15, 0, 0);
    return moon;
}

function createMercury(sun) {
    const geometry = new THREE.SphereGeometry(2.4, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("images/Mercury/2k_mercury.jpg"),
        roughness: 1,
        metalness: 0.5
    });
    const mercury = new THREE.Mesh(geometry, material);
    mercury.userData = { type: { type: "Planet" }, name: "Mercury", mass: 3.3e23, parent: sun, planets: [] };
    mercury.position.set(40, 0, 0);
    return mercury;
}

function createVenus(sun) {
    const geometry = new THREE.SphereGeometry(6, 32, 32);
    const surfaceTexture = new THREE.TextureLoader().load("images/Venus/2k_venus_surface.jpg");
    const atmosphereTexture = new THREE.TextureLoader().load("images/Venus/2k_venus_atmosphere.jpg");
    const surfaceMaterial = new THREE.MeshStandardMaterial({
        map: surfaceTexture,
        roughness: 1,
        metalness: 0.3
    });
    const venusSurface = new THREE.Mesh(geometry, surfaceMaterial);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        map: atmosphereTexture,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
    });
    const venusAtmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
    venusAtmosphere.scale.multiplyScalar(1.05);
    const venus = new THREE.Group();
    venus.add(venusSurface);
    venus.add(venusAtmosphere);
    venus.userData = { type: { type: "Planet" }, name: "Venus", mass: 4.87e24, parent: sun, planets: [] };
    venus.position.set(70, 0, 0);
    return venus;
}

function createMars(sun) {
    const geometry = new THREE.SphereGeometry(3.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("images/Mars/2k_mars.jpg"),
        roughness: 1,
        metalness: 0.2
    });
    const mars = new THREE.Mesh(geometry, material);
    mars.userData = { type: { type: "Planet" }, name: "Mars", mass: 6.42e23, parent: sun, planets: [] };
    mars.position.set(140, 0, 0);
    return mars;
}

function createJupiter(sun) {
    const geometry = new THREE.SphereGeometry(14, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("images/Jupiter/2k_jupiter.jpg"),
        roughness: 1,
        metalness: 0.2
    });
    const jupiter = new THREE.Mesh(geometry, material);
    jupiter.userData = { type: { type: "Planet" }, name: "Jupiter", mass: 1.9e27, parent: sun, planets: [] };
    jupiter.position.set(250, 0, 0);
    return jupiter;
}

function createSaturn(sun) {
    const geometry = new THREE.SphereGeometry(12, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("images/Saturn/2k_saturn.jpg"),
        roughness: 1,
        metalness: 0.2
    });
    const saturn = new THREE.Mesh(geometry, material);
    saturn.userData = { type: { type: "Planet" }, name: "Saturn", mass: 5.68e26, parent: sun, planets: [] };
    saturn.position.set(300, 0, 0);

    const inner = 15, outer = 20;
    const ringGeometry = new THREE.RingGeometry(inner, outer, 64);
    const posAttr = ringGeometry.attributes.position;
    const uvAttr = ringGeometry.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const r = Math.sqrt(x * x + y * y);
        let angle = Math.atan2(y, x);
        if (angle < 0) angle += Math.PI * 2;
        const u = angle / (Math.PI * 2);
        const v = (r - inner) / (outer - inner);
        uvAttr.setXY(i, u, v);
    }
    uvAttr.needsUpdate = true;

    const ringTexture = new THREE.TextureLoader().load("images/Saturn/2k_saturn_ring.png");
    ringTexture.wrapS = THREE.RepeatWrapping;
    ringTexture.wrapT = THREE.RepeatWrapping;
    ringTexture.center.set(0.5, 0.5);
    ringTexture.rotation = Math.PI / 2;

    const ringMaterial = new THREE.MeshBasicMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    saturn.rotation.z = THREE.MathUtils.degToRad(26.7);
    
    ring.rotation.x = Math.PI / 2;
    ring.rotation.x = THREE.MathUtils.degToRad(90 - 26.7);

    saturn.add(ring);

    return saturn;
}

function createUranus(sun) {
    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("images/Uranus/2k_uranus.jpg"),
        roughness: 1,
        metalness: 0.2
    });
    const uranus = new THREE.Mesh(geometry, material);
    uranus.userData = { type: { type: "Planet" }, name: "Uranus", mass: 8.68e25, parent: sun, planets: [] };
    uranus.position.set(350, 0, 0);
    return uranus;
}

function createNeptune(sun) {
    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("images/Neptune/2k_neptune.jpg"),
        roughness: 1,
        metalness: 0.2
    });
    const neptune = new THREE.Mesh(geometry, material);
    neptune.userData = { type: { type: "Planet" }, name: "Neptune", mass: 1.02e26, parent: sun, planets: [] };
    neptune.position.set(40, 0, 0);
    return neptune;
}

function createSolarSystem() {
    const solarSystem = new THREE.Group();
    const sun = createSun();
    const mercury = createMercury(sun);
    const venus = createVenus(sun);
    const earth = createEarth(sun);
    const mars = createMars(sun);
    const jupiter = createJupiter(sun);
    const saturn = createSaturn(sun);
    const uranus = createUranus(sun);
    const neptune = createNeptune(sun);
    const moon = createMoon(earth);
    sun.userData.planets.push(mercury, venus, earth, mars, jupiter, saturn, uranus, neptune);
    solarSystem.add(sun);
    solarSystem.add(mercury);
    solarSystem.add(venus);
    solarSystem.add(earth);
    solarSystem.add(mars);
    solarSystem.add(jupiter);
    solarSystem.add(saturn);
    solarSystem.add(uranus);
    solarSystem.add(neptune);
    earth.add(moon);
    return solarSystem;
}