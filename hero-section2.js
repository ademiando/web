(function() {
  const { useRef, useEffect, useState } = React;

  // Helper: create glow sprite texture for particles
  function createGlowTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(
      size/2, size/2, 0,
      size/2, size/2, size/2
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(80,180,255,0.7)");
    gradient.addColorStop(0.7, "rgba(0,40,140,0.22)");
    gradient.addColorStop(1, "rgba(0,0,40,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,size,size);
    const tex = new window.THREE.Texture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function HeroSection() {
    const canvasRef = useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [currentSection, setCurrentSection] = useState(0);
    const totalSections = 4; // lebih panjang scrollnya!
    const smoothCamera = useRef({ x: 0, y: 30, z: 300 });

    useEffect(() => {
      const THREE = window.THREE;
      const texGlow = createGlowTexture();

      // SCENE
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050517, 0.00014);

      // CAMERA
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 4000);
      camera.position.set(0, 35, 600);

      // RENDERER
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // PARTICLE STARS (pakai sprite bulat glow)
      const starLayers = [];
      for (let l = 0; l < 3; l++) {
        const starCount = [1700, 1000, 700][l];
        const geom = new THREE.BufferGeometry();
        const arr = new Float32Array(starCount * 3);
        for (let i=0;i<starCount;i++) {
          const r = 350 + Math.random()*1800 * (1+l*0.25);
          const theta = Math.random()*Math.PI*2;
          const phi = Math.acos(Math.random()*2-1);
          arr[i*3] = r*Math.sin(phi)*Math.cos(theta);
          arr[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
          arr[i*3+2] = r*Math.cos(phi);
        }
        geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        const mat = new THREE.PointsMaterial({
          size: [7, 11, 16][l],
          color: [0xffffff, 0x7fdfff, 0xffeaea][l],
          map: texGlow,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: [0.74,0.45,0.20][l],
          depthWrite: false
        });
        const mesh = new THREE.Points(geom, mat);
        mesh.renderOrder = 2;
        scene.add(mesh);
        starLayers.push(mesh);
      }

      // NEBULA layer (soft glowing gradien)
      const nebulaGeo = new THREE.PlaneGeometry(8000, 4000, 30, 30);
      const nebulaMat = new THREE.MeshBasicMaterial({
        color: 0x2244ee,
        opacity: 0.17, transparent: true,
        side: THREE.DoubleSide, depthWrite: false
      });
      const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
      nebula.position.z = -1200;
      scene.add(nebula);

      // ATMOSPHERE GLOW (sphere gradient)
      const atmGeo = new THREE.SphereGeometry(900, 32, 32);
      const atmMat = new THREE.MeshBasicMaterial({
        color: 0x2856ed, transparent: true, opacity: 0.11,
        side: THREE.BackSide, depthWrite: false
      });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.position.set(0, -110, -1200);
      scene.add(atm);

      // MOUNTAINS PARALLAX LAYER
      const mountainLayers = [];
      [
        { z: -80, color: 0x16213e, opacity: 1, h: 90 },
        { z: -180, color: 0x1a1a2e, opacity: 0.77, h: 130 },
        { z: -300, color: 0x0f3460, opacity: 0.5, h: 210 },
        { z: -500, color: 0x0a4668, opacity: 0.22, h: 340 }
      ].forEach((layer, idx) => {
        const points = [];
        const seg = 60;
        for (let i=0; i<=seg; i++) {
          const x = (i/seg-0.5)*1800;
          let y = Math.sin(i*0.12+idx*0.22)*layer.h + Math.sin(i*0.07+idx*0.31)*layer.h*0.5 + Math.random()*layer.h*0.19-210+idx*34;
          // Biar siluetnya lebih dramatis
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
        scene.add(mesh); mountainLayers.push(mesh);
      });

      // Animate
      let animId;
      function animate() {
        animId = requestAnimationFrame(animate);
        const t = Date.now()*0.00035;

        // stars parallax rotation
        starLayers[0].rotation.y = t*0.8;
        starLayers[1].rotation.y = t*0.45;
        starLayers[2].rotation.y = t*0.24;

        // Nebula anim
        nebula.material.opacity = 0.19 + Math.sin(t*1.6)*0.03;

        // Mountain wave
        mountainLayers.forEach((m, i) => {
          m.position.x = Math.sin(t*1.2+i)*12*(i+1);
          m.position.y = m.position.z*0.22 + Math.cos(t*1.4+i)*3*(i+1);
        });

        // Camera parallax
        const docH = document.documentElement.scrollHeight;
        const winH = window.innerHeight;
        const scY = window.scrollY;
        const frac = Math.min(scY/(docH-winH), 1);
        // Camera moves through 4 sections (lebih panjang!)
        const camPath = [
          {x:0, y:30, z:600},
          {x:0, y:50, z:120},
          {x:0, y:95, z:-600},
          {x:0, y:220, z:-1700}
        ];
        const idx = Math.floor(frac*(camPath.length-1));
        const next = Math.min(idx+1, camPath.length-1);
        const f = (frac*(camPath.length-1))%1;
        const cp = camPath[idx], np = camPath[next];
        smoothCamera.current.x += (cp.x+(np.x-cp.x)*f - smoothCamera.current.x)*0.07;
        smoothCamera.current.y += (cp.y+(np.y-cp.y)*f - smoothCamera.current.y)*0.07;
        smoothCamera.current.z += (cp.z+(np.z-cp.z)*f - smoothCamera.current.z)*0.07;
        camera.position.set(
          smoothCamera.current.x,
          smoothCamera.current.y,
          smoothCamera.current.z
        );
        camera.lookAt(0,30,-900);

        renderer.render(scene,camera);
      }
      animate();

      // Resize
      function onResize() {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener("resize", onResize);

      // Cleanup
      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    }, []);

    // SCROLL LOGIC
    useEffect(() => {
      function onScroll() {
        const winH = window.innerHeight;
        const docH = document.documentElement.scrollHeight;
        const maxScroll = docH-winH;
        const progress = Math.min(window.scrollY/maxScroll,1);
        setScrollProgress(progress);
        setCurrentSection(Math.floor(progress*totalSections));
      }
      window.addEventListener("scroll", onScroll);
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // UI
    const sectionTexts = [
      {
        title: "HORIZON",
        subtitle: "Where vision meets reality,<br>we shape the future of tomorrow"
      },
      {
        title: "COSMOS",
        subtitle: "Beyond the boundaries of imagination,<br>lies the universe of possibilities"
      },
      {
        title: "INFINITY",
        subtitle: "In the space between thought and creation,<br>we find the essence of true innovation"
      },
      {
        title: "BEYOND",
        subtitle: "Let's build something extraordinary,<br>together, beyond the stars"
      }
    ];

    return React.createElement("div", { className: "hero-container" }, [
      React.createElement("canvas", { ref: canvasRef, className: "hero-canvas", key: "canvas" }),
      React.createElement("div", { className: "hero-content", key: "content" }, [
        React.createElement("h1", { className: "hero-title", key: "title" }, sectionTexts[currentSection]?.title || "HORIZON"),
        React.createElement("div", { className: "hero-subtitle", key: "subtitle", dangerouslySetInnerHTML: { __html: sectionTexts[currentSection]?.subtitle || "" } }),
        React.createElement("div", { className: "hero-desc", key: "desc" },
          "Passionate about building beautiful & interactive web experiences.\nTech: React, Three.js, Next.js, GSAP, UI Design\nLocation: Indonesia · Open for collaboration."
        ),
        React.createElement("div", { className: "social-links", key: "links" }, [
          React.createElement("a", { className: "social-link", href: "https://github.com/ademiando", target: "_blank", rel: "noopener", "aria-label": "GitHub", key: 1 }, "🐙"),
          React.createElement("a", { className: "social-link", href: "https://linkedin.com/in/ademiando", target: "_blank", rel: "noopener", "aria-label": "LinkedIn", key: 2 }, "in"),
          React.createElement("a", { className: "social-link", href: "mailto:hi@ademiando.com", "aria-label": "Email", key: 3 }, "✉️"),
          React.createElement("a", { className: "social-link", href: "https://twitter.com/ademiando", target: "_blank", rel: "noopener", "aria-label": "X", key: 4 }, "𝕏")
        ])
      ]),
      React.createElement("div", { className: "scroll-progress", style: { position: "fixed", right: 32, bottom: 36, zIndex: 10, background: "#182444cc", borderRadius: 16, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 120 }, key: "scroll" }, [
        React.createElement("div", { className: "scroll-text", key: 1 }, "SCROLL"),
        React.createElement("div", { className: "progress-track", key: 2, style: { width: 70, height: 6, background: "#223355", borderRadius: 6, marginBottom: 6, overflow: "hidden" } },
          React.createElement("div", { className: "progress-fill", style: { height: "100%", background: "#7fdfff", width: `${scrollProgress*100}%`, transition: "width 0.2s" } })
        ),
        React.createElement("div", { className: "section-counter", key: 3 }, `${String(currentSection+1).padStart(2,"0")} / ${String(totalSections+1).padStart(2,"0")}`)
      ])
    ]);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    React.createElement(HeroSection)
  );
})();
