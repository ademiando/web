(function() {
  const { useRef, useEffect } = React;

  // Optional: Scene config via JSON (bisa modif tanpa ngoding ulang)
  const sceneConfig = {
    cameraPath: [
      { x: 0, y: 30, z: 500, lookY: 0 },
      { x: 0, y: 60, z: 80, lookY: 20 },
      { x: 0, y: 95, z: -700, lookY: 60 },
      { x: 0, y: 220, z: -1700, lookY: 170 }
    ],
    mountain: [
      { z: -80, color: 0x16213e, opacity: 1, h: 90 },
      { z: -180, color: 0x1a1a2e, opacity: 0.77, h: 130 },
      { z: -300, color: 0x0f3460, opacity: 0.5, h: 210 },
      { z: -500, color: 0x0a4668, opacity: 0.22, h: 340 }
    ],
    nebula: { color: 0x2244ee, opacity: 0.13 }
  };

  function lerp(a, b, t) { return a + (b - a) * t; }

  function HeroScrollBG() {
    const canvasRef = useRef();

    useEffect(() => {
      const THREE = window.THREE;

      // ---- SCENE
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050517, 0.00014);

      // ---- CAMERA
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 4000);
      camera.position.set(0, 30, 300);

      // ---- RENDERER
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // ---- PARTICLE TEXTURE
      function createGlowTexture() {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d");
        const g = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
        g.addColorStop(0,"#fff");
        g.addColorStop(0.3,"#5fd8ffcc");
        g.addColorStop(0.7,"#2244cc44");
        g.addColorStop(1,"#0000");
        ctx.fillStyle=g;ctx.fillRect(0,0,size,size);
        const tex = new window.THREE.Texture(canvas);
        tex.needsUpdate = true;
        return tex;
      }
      const glowTex = createGlowTexture();

      // ---- STARFIELD (3 layers, smooth glow)
      const stars = [];
      for(let l=0;l<3;l++) {
        const starCount = [1400, 900, 600][l];
        const geom = new THREE.BufferGeometry();
        const arr = new Float32Array(starCount*3);
        for(let i=0;i<starCount;i++) {
          const r = 350 + Math.random()*1800*(1+l*0.25);
          const theta = Math.random()*Math.PI*2;
          const phi = Math.acos(Math.random()*2-1);
          arr[i*3]   = r*Math.sin(phi)*Math.cos(theta);
          arr[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
          arr[i*3+2] = r*Math.cos(phi);
        }
        geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        const mat = new THREE.PointsMaterial({
          size: [7, 11, 16][l],
          color: [0xffffff, 0x7fdfff, 0xffeaea][l],
          map: glowTex,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: [0.74,0.45,0.20][l],
          depthWrite: false
        });
        const mesh = new THREE.Points(geom, mat);
        mesh.renderOrder = 2;
        scene.add(mesh);
        stars.push(mesh);
      }

      // ---- NEBULA LAYER
      const nebulaGeo = new THREE.PlaneGeometry(8000, 4000, 30, 30);
      const nebulaMat = new THREE.MeshBasicMaterial({
        color: sceneConfig.nebula.color,
        opacity: sceneConfig.nebula.opacity,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
      nebula.position.z = -1200;
      scene.add(nebula);

      // ---- MOUNTAINS (parallax layers)
      const mountains = [];
      (sceneConfig.mountain).forEach((layer, idx) => {
        const points = [];
        const seg = 60;
        for(let i=0;i<=seg;i++) {
          const x = (i/seg-0.5)*1800;
          let y = Math.sin(i*0.12+idx*0.22)*layer.h + Math.sin(i*0.07+idx*0.31)*layer.h*0.5 + Math.random()*layer.h*0.19-210+idx*34;
          if(i===0||i===seg) y-=100+idx*30;
          points.push(new THREE.Vector2(x,y));
        }
        points.push(new THREE.Vector2(3000,-600)); points.push(new THREE.Vector2(-3000,-600));
        const shape = new THREE.Shape(points);
        const geo = new THREE.ShapeGeometry(shape);
        const mat = new THREE.MeshBasicMaterial({
          color: layer.color, opacity: layer.opacity,
          transparent: true, side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = layer.z; mesh.position.y = layer.z*0.22;
        mesh.userData = { baseZ: layer.z };
        scene.add(mesh); mountains.push(mesh);
      });

      // ---- ATMOSPHERE GLOW (sphere gradient)
      const atmGeo = new THREE.SphereGeometry(900, 32, 32);
      const atmMat = new THREE.MeshBasicMaterial({
        color: 0x2856ed, transparent: true, opacity: 0.11,
        side: THREE.BackSide, depthWrite: false
      });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.position.set(0, -110, -1200);
      scene.add(atm);

      // ---- SCROLL ANIMATION
      function getScrollFrac() {
        const winH = window.innerHeight;
        const docH = document.documentElement.scrollHeight;
        const maxScroll = Math.max(1, docH - winH - 1);
        return Math.min(1, window.scrollY / maxScroll);
      }

      // ---- MAIN ANIMATE
      let animId;
      function animate() {
        animId = requestAnimationFrame(animate);

        const frac = getScrollFrac();

        // Camera path (multi-stage, dari sceneConfig)
        const seg = sceneConfig.cameraPath.length-1;
        const f = Math.min(1, frac*seg);
        const idx = Math.floor(f);
        const t = f-idx;
        const cp0 = sceneConfig.cameraPath[idx];
        const cp1 = sceneConfig.cameraPath[Math.min(idx+1, seg)];
        const camX = lerp(cp0.x, cp1.x, t);
        const camY = lerp(cp0.y, cp1.y, t);
        const camZ = lerp(cp0.z, cp1.z, t);
        const lookY = lerp(cp0.lookY, cp1.lookY, t);

        camera.position.set(camX, camY, camZ);
        camera.lookAt(0, lookY, -900 + frac*1000);

        // Bintang: parallax, swirl, opacity
        stars[0].rotation.y = frac*0.7;
        stars[1].rotation.y = frac*0.4;
        stars[2].rotation.y = frac*0.2;
        stars.forEach((s,i)=>s.material.opacity = [0.74,0.45,0.20][i] * (1-frac*0.5));

        // Nebula: opacity, position
        nebula.material.opacity = sceneConfig.nebula.opacity + Math.sin(frac*10)*0.03;
        nebula.position.y = -180 + frac*210;

        // Mountains: parallax depth, x+opacity
        mountains.forEach((m,i)=>{
          const parallax = (1+i*0.5)*frac*120;
          m.position.x = Math.sin(frac*3+i)*10*(i+1);
          m.position.z = m.userData.baseZ + parallax;
          m.material.opacity = sceneConfig.mountain[i].opacity * (1-frac*0.16*i);
        });

        // Atmosphere: subtle glow
        atm.material.opacity = 0.11 + Math.sin(frac*7)*0.07;

        renderer.render(scene, camera);
      }
      animate();

      // ---- RESIZE
      function onResize() {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    }, []);

    // UI di atas canvas
    return React.createElement("div", { className: "hero-container" }, [
      React.createElement("canvas", { ref: canvasRef, className: "hero-canvas", key: "canvas" }),
      React.createElement("div", { className: "hero-content", key: "content" }, [
        React.createElement("h1", { className: "hero-title", key: "title" }, "Ademiando"),
        React.createElement("div", { className: "hero-subtitle", key: "subtitle" }, "Scroll for Cinematic 3D Background"),
        React.createElement("div", { className: "hero-desc", key: "desc" },
          "Parallax 3D scene. Kamera, bintang, gunung, kabut, dan nebula bergerak dinamis mengikuti scroll."
        ),
        React.createElement("div", { className: "social-links", key: "links" }, [
          React.createElement("a", { className: "social-link", href: "https://github.com/ademiando", target: "_blank", rel: "noopener", "aria-label": "GitHub", key: 1 }, "🐙"),
          React.createElement("a", { className: "social-link", href: "https://linkedin.com/in/ademiando", target: "_blank", rel: "noopener", "aria-label": "LinkedIn", key: 2 }, "in"),
          React.createElement("a", { className: "social-link", href: "mailto:hi@ademiando.com", "aria-label": "Email", key: 3 }, "✉️"),
          React.createElement("a", { className: "social-link", href: "https://twitter.com/ademiando", target: "_blank", rel: "noopener", "aria-label": "X", key: 4 }, "𝕏")
        ])
      ])
    ]);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    React.createElement(HeroScrollBG)
  );
})();
