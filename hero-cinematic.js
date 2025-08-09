(function () {
  const { useRef, useEffect, useState } = React;

  // Helper: Glow texture for particles
  function createGlowTexture() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(100,200,255,0.78)");
    gradient.addColorStop(0.5, "rgba(50,90,160,0.32)");
    gradient.addColorStop(1, "rgba(0,0,32,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new window.THREE.Texture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function HeroCinematic() {
    const canvasRef = useRef();
    const [stage, setStage] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showUI, setShowUI] = useState(false);

    useEffect(() => {
      const THREE = window.THREE;
      const glowTex = createGlowTexture();

      // === SCENE SETUP ===
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0e1539, 0.00012);

      // === CAMERA ===
      const camera = new THREE.PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        0.1,
        6000
      );
      camera.position.set(0, 0, 780);

      // === RENDERER ===
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // === ATOM: PARTICLE SWIRL ===
      const atomGroup = new THREE.Group();
      const atomGeo = new THREE.BufferGeometry();
      const ATOM_COUNT = 1000;
      const atomPos = new Float32Array(ATOM_COUNT * 3);
      for (let i = 0; i < ATOM_COUNT; i++) {
        const t = i / ATOM_COUNT;
        const a = t * Math.PI * 12; // swirl
        const r = 40 + t * 220 + Math.sin(i * 0.19) * 13;
        atomPos[i * 3] = Math.cos(a) * r;
        atomPos[i * 3 + 1] = Math.sin(a) * r;
        atomPos[i * 3 + 2] = (i - ATOM_COUNT / 2) * 3 + Math.sin(i * 0.7) * 8;
      }
      atomGeo.setAttribute("position", new THREE.BufferAttribute(atomPos, 3));
      const atomMat = new THREE.PointsMaterial({
        size: 12,
        color: 0xffffff,
        map: glowTex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.87,
        depthWrite: false,
      });
      const atomField = new THREE.Points(atomGeo, atomMat);
      atomGroup.add(atomField);

      // --- atom nucleus
      const nucleusGeo = new THREE.SphereGeometry(30, 32, 32);
      const nucleusMat = new THREE.MeshPhysicalMaterial({
        color: 0x87eaff,
        roughness: 0.19,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
        transmission: 0.7,
        thickness: 3,
        ior: 1.2,
        emissive: 0x49c4ff,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.95,
      });
      const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
      atomGroup.add(nucleus);

      scene.add(atomGroup);

      // --- Point light for nucleus
      const nLight = new THREE.PointLight(0x9fdfff, 2.0, 1100);
      nLight.position.set(0, 0, 70);
      scene.add(nLight);

      // === ATOM PARTICLE FOG (depth) ===
      const fogGeo = new THREE.BufferGeometry();
      const FOG_COUNT = 2100;
      const fogPos = new Float32Array(FOG_COUNT * 3);
      for (let i = 0; i < FOG_COUNT; i++) {
        const r = 350 + Math.random() * 1300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        fogPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        fogPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        fogPos[i * 3 + 2] = r * Math.cos(phi);
      }
      fogGeo.setAttribute("position", new THREE.BufferAttribute(fogPos, 3));
      const fogMat = new THREE.PointsMaterial({
        size: 22,
        color: 0x7fdfff,
        map: glowTex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      });
      const fogField = new THREE.Points(fogGeo, fogMat);
      atomGroup.add(fogField);

      // === LANDSCAPE SCENE ===
      const worldGroup = new THREE.Group();

      // --- Nebula
      const nebulaGeo = new THREE.PlaneGeometry(9000, 4000, 40, 40);
      const nebulaMat = new THREE.MeshBasicMaterial({
        color: 0x215aff,
        opacity: 0.17,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
      nebula.position.z = -1100;
      nebula.position.y = -80;
      worldGroup.add(nebula);

      // --- Mountains
      [
        { z: -220, color: 0x16213e, opacity: 1, h: 85 },
        { z: -400, color: 0x1a1a2e, opacity: 0.79, h: 130 },
        { z: -650, color: 0x0f3460, opacity: 0.53, h: 210 },
        { z: -1050, color: 0x0a4668, opacity: 0.22, h: 360 },
      ].forEach((layer, idx) => {
        const points = [];
        const seg = 75;
        for (let i = 0; i <= seg; i++) {
          const x = (i / seg - 0.5) * 2600;
          let y =
            Math.sin(i * 0.13 + idx * 0.19) * layer.h +
            Math.sin(i * 0.07 + idx * 0.31) * layer.h * 0.5 +
            Math.random() * layer.h * 0.17 -
            210 +
            idx * 30;
          if (i === 0 || i === seg) y -= 100 + idx * 30;
          points.push(new THREE.Vector2(x, y));
        }
        points.push(new THREE.Vector2(4000, -900));
        points.push(new THREE.Vector2(-4000, -900));
        const shape = new THREE.Shape(points);
        const geo = new THREE.ShapeGeometry(shape);
        const mat = new THREE.MeshBasicMaterial({
          color: layer.color,
          opacity: layer.opacity,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = layer.z;
        mesh.position.y = layer.z * 0.13;
        mesh.userData = { baseZ: layer.z };
        worldGroup.add(mesh);
      });

      // --- Atmospheric fog
      const fogGeo2 = new THREE.PlaneGeometry(6000, 1200, 3, 1);
      const fogMat2 = new THREE.MeshBasicMaterial({
        color: 0xbedaff,
        opacity: 0.18,
        transparent: true,
      });
      const fog2 = new THREE.Mesh(fogGeo2, fogMat2);
      fog2.position.set(0, -270, -400);
      worldGroup.add(fog2);

      // --- Sun disk
      const sunGeo = new THREE.CircleGeometry(140, 38);
      const sunMat = new THREE.MeshBasicMaterial({
        color: 0xffefc2,
        opacity: 0.35,
        transparent: true,
      });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      sun.position.set(80, -80, -1100);
      worldGroup.add(sun);

      // --- Light
      const sunLight = new THREE.PointLight(0xffefc2, 1.4, 2500);
      sunLight.position.set(80, -80, -1000);
      worldGroup.add(sunLight);

      // --- Hide world at first
      worldGroup.visible = false;
      scene.add(worldGroup);

      // === CAMERA MOTION VARS ===
      const camCinematic = [
        // [time, {x,y,z,lookX,lookY,lookZ}]
        [0, { x: 0, y: 0, z: 780, lx: 0, ly: 0, lz: 0 }],
        [1.5, { x: 0, y: 0, z: 390, lx: 0, ly: 0, lz: 0 }],
        [2.7, { x: 0, y: 20, z: 170, lx: 0, ly: 0, lz: 0 }],
        [4.1, { x: 0, y: 55, z: 120, lx: 0, ly: 0, lz: -600 }],
        [7.2, { x: 0, y: 95, z: -600, lx: 0, ly: 40, lz: -900 }],
        [10.5, { x: 0, y: 220, z: -1700, lx: 0, ly: 100, lz: -1700 }],
      ];
      let camTime = 0;
      let camIdx = 0;

      // === MAIN ANIMATION LOOP ===
      let animId = 0,
        atomZoom = 0,
        tStart = null;
      function animate(now) {
        if (!tStart) tStart = now;
        const time = (now - tStart) / 1000;
        camTime = time;

        // === ATOM STAGE ===
        if (stage <= 1) {
          atomGroup.visible = true;
          worldGroup.visible = false;
          atomGroup.rotation.y = time * 0.47;
          atomGroup.rotation.x = Math.sin(time * 0.54) * 0.12 + 0.17;
          atomGroup.position.z = Math.sin(time * 0.47) * 30;
          // Camera cinematic
          let c = { x: 0, y: 0, z: 780, lx: 0, ly: 0, lz: 0 };
          if (time > 0.7 && time < 2.7) {
            atomZoom += 0.018;
            c.z = 780 - atomZoom * 480;
          }
          camera.position.set(c.x, c.y, c.z);
          camera.lookAt(c.lx, c.ly, c.lz);

          // Atom fade out
          if (time > 2.6 && time < 3.3) {
            atomMat.opacity = Math.max(0, 0.87 - (time - 2.6) * 2.1);
            nucleus.material.opacity = Math.max(0, 0.95 - (time - 2.6) * 2.3);
            fogMat.opacity = Math.max(0, 0.13 - (time - 2.6) * 1.7);
          }
        }

        // === TRANSITION TO WORLD ===
        if (stage === 2) {
          atomGroup.visible = false;
          worldGroup.visible = true;
          // Camera cinematic path
          if (camIdx < camCinematic.length - 1) {
            const t0 = camCinematic[camIdx][0],
              t1 = camCinematic[camIdx + 1][0];
            if (camTime > t1) camIdx++;
            const frac =
              Math.max(0, Math.min(1, (camTime - t0) / (t1 - t0)));
            const c0 = camCinematic[camIdx][1],
              c1 = camCinematic[camIdx + 1][1];
            // Camera lerp
            let cx = c0.x + (c1.x - c0.x) * frac;
            let cy = c0.y + (c1.y - c0.y) * frac;
            let cz = c0.z + (c1.z - c0.z) * frac;
            let lx = c0.lx + (c1.lx - c0.lx) * frac;
            let ly = c0.ly + (c1.ly - c0.ly) * frac;
            let lz = c0.lz + (c1.lz - c0.lz) * frac;
            camera.position.set(cx, cy, cz);
            camera.lookAt(lx, ly, lz);
          } else {
            camera.position.set(0, 220, -1700);
            camera.lookAt(0, 100, -1700);
          }
          // Animate mountains and fog
          worldGroup.children.forEach((child, i) => {
            if (child.geometry instanceof THREE.ShapeGeometry) {
              child.position.x =
                Math.sin(time * 0.7 + i) * 14 * (i + 1);
              child.position.y =
                child.userData.baseZ * 0.13 +
                Math.cos(time * 0.9 + i) * 3 * (i + 1);
            }
            // fog
            if (child === fog2) {
              fog2.material.opacity = 0.18 + Math.sin(time * 1.5) * 0.04;
            }
            // nebula
            if (child === nebula) {
              nebula.material.opacity = 0.16 + Math.cos(time * 0.7) * 0.04;
            }
          });
        }

        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);

        // === STAGE CONTROL ===
        // 0: atom swirl, 1: zoom/fade, 2: landscape, 3: show UI
        if (stage === 0 && time > 1.1) setStage(1);
        if (stage === 1 && time > 3.05) setStage(2);
        if (stage === 2 && time > 11.2) setShowUI(true);
      }
      animId = requestAnimationFrame(animate);

      // === RESIZE ===
      function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    }, [stage]);

    // === UI: Fade-in after cinematic
    return React.createElement("div", { className: "hero-container" }, [
      React.createElement("canvas", {
        ref: canvasRef,
        className: "hero-canvas",
        key: "canvas",
      }),
      showUI &&
        React.createElement("div", { className: "hero-content", key: "content" }, [
          React.createElement("h1", { className: "hero-title", key: "title" }, "Ademiando"),
          React.createElement("div", { className: "hero-subtitle", key: "subtitle" }, "Cinematic Portfolio Experience"),
          React.createElement(
            "div",
            { className: "hero-desc", key: "desc" },
            "From the quantum to the horizon.\nLet's build something extraordinary."
          ),
          React.createElement("div", { className: "social-links", key: "links" }, [
            React.createElement(
              "a",
              {
                className: "social-link",
                href: "https://github.com/ademiando",
                target: "_blank",
                rel: "noopener",
                "aria-label": "GitHub",
                key: 1,
              },
              "🐙"
            ),
            React.createElement(
              "a",
              {
                className: "social-link",
                href: "https://linkedin.com/in/ademiando",
                target: "_blank",
                rel: "noopener",
                "aria-label": "LinkedIn",
                key: 2,
              },
              "in"
            ),
            React.createElement(
              "a",
              {
                className: "social-link",
                href: "mailto:hi@ademiando.com",
                "aria-label": "Email",
                key: 3,
              },
              "✉️"
            ),
            React.createElement(
              "a",
              {
                className: "social-link",
                href: "https://twitter.com/ademiando",
                target: "_blank",
                rel: "noopener",
                "aria-label": "X",
                key: 4,
              },
              "𝕏"
            ),
          ]),
        ]),
    ]);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    React.createElement(HeroCinematic)
  );
})();
