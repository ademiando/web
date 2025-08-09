// ========== Hero Parallax Section with Three.js, GSAP, React ==========
// All dependencies loaded via CDN in index.html

const { useRef, useEffect, useState } = React;

function HeroParallax() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [section, setSection] = useState(0);
  const sections = [
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
    }
  ];

  // Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const THREE = window.THREE;

    // --- Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050517, 0.00024);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 30, 300);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- Stars
    const stars = [];
    for (let l = 0; l < 3; l++) {
      const geom = new THREE.BufferGeometry();
      const starCount = 1600;
      const pos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 200 + Math.random() * 1200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
      }
      geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: l==0?0xffffff:l==1?0x9fdcff:0xffe6fc,
        size: 1.5 + l*0.9, sizeAttenuation: true,
        opacity: 0.7 - l*0.2, transparent: true
      });
      const points = new THREE.Points(geom, mat);
      scene.add(points);
      stars.push(points);
    }

    // --- Nebula
    const nebulaGeom = new THREE.PlaneGeometry(4000, 2000, 22, 22);
    const nebulaMat = new THREE.MeshBasicMaterial({ color: 0x3344aa, transparent: true, opacity: 0.16 });
    const nebula = new THREE.Mesh(nebulaGeom, nebulaMat);
    nebula.position.z = -1050;
    scene.add(nebula);

    // --- Mountains (parallax layers)
    const mountains = [];
    [
      { depth: -40, color: 0x14213d, opacity: 1, height: 60 },
      { depth: -90, color: 0x163060, opacity: 0.7, height: 90 },
      { depth: -160, color: 0x0a1c35, opacity: 0.5, height: 120 },
      { depth: -230, color: 0x0e1733, opacity: 0.27, height: 170 }
    ].forEach((layer, idx) => {
      const points = [];
      const seg = 46;
      for (let i = 0; i <= seg; i++) {
        const x = (i / seg - 0.5) * 1400;
        const y = Math.sin(i * 0.18 + idx*0.2) * layer.height + Math.random() * 10 - 150 + idx*30;
        points.push(new THREE.Vector2(x, y));
      }
      points.push(new THREE.Vector2(5000, -500));
      points.push(new THREE.Vector2(-5000, -500));
      const shape = new THREE.Shape(points);
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = layer.depth;
      mesh.position.y = layer.depth*0.2;
      scene.add(mesh);
      mountains.push(mesh);
    });

    // --- Animate
    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.0003;

      // Star rotation
      stars[0].rotation.y = t * 0.7;
      stars[1].rotation.y = t * 0.5;
      stars[2].rotation.y = t * 0.35;

      // Parallax camera
      const scrollY = window.scrollY;
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const maxScroll = docH - windowH;
      const progress = Math.min(scrollY / maxScroll, 1);
      // Camera moves through 3 sections
      const camPos = [
        { x: 0, y: 30, z: 300 },
        { x: 0, y: 40, z: -50 },
        { x: 0, y: 55, z: -700 }
      ];
      const idx = Math.floor(progress*2.99);
      const frac = (progress*2.99)%1;
      const cp = camPos[idx]||camPos[0];
      const np = camPos[idx+1]||cp;
      camera.position.x = cp.x + (np.x-cp.x)*frac;
      camera.position.y = cp.y + (np.y-cp.y)*frac;
      camera.position.z = cp.z + (np.z-cp.z)*frac;
      camera.lookAt(0, 10, -600);

      // Mountains parallax
      mountains.forEach((mountain, i) => {
        const factor = 1 + i*0.7;
        mountain.position.x = Math.sin(t * 1.1 + i) * (i+1)*6;
        mountain.position.y = mountain.position.z*0.2 + Math.cos(t * 1.3 + i) * (i+1)*2;
      });

      renderer.render(scene, camera);
    }
    animate();

    // --- Responsive
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", handleResize);

    // --- Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Scroll sync
  useEffect(() => {
    function onScroll() {
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const maxScroll = docH - windowH;
      const progress = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(progress);
      setSection(Math.floor(progress * 2.99));
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- UI Content
  return React.createElement("div", { ref: containerRef, className: "hero-container" },
    React.createElement("canvas", { ref: canvasRef, className: "hero-canvas" }),
    React.createElement("div", { className: "hero-content" },
      React.createElement("img", { src: "https://avatars.githubusercontent.com/u/19248306?v=4", className: "profile-img", alt: "Ademiando" }),
      React.createElement("h1", { className: "hero-title" }, "Ademiando"),
      React.createElement("div", { className: "hero-subtitle", dangerouslySetInnerHTML: { __html: sections[section].title } }),
      React.createElement("div", { className: "hero-desc", dangerouslySetInnerHTML: { __html: sections[section].subtitle } }),
      React.createElement("div", { className: "social-links" },
        React.createElement("a", { className: "social-link", href: "https://github.com/ademiando", target: "_blank", rel: "noopener", "aria-label": "GitHub" }, "🐙"),
        React.createElement("a", { className: "social-link", href: "https://linkedin.com/in/ademiando", target: "_blank", rel: "noopener", "aria-label": "LinkedIn" }, "in"),
        React.createElement("a", { className: "social-link", href: "mailto:hi@ademiando.com", "aria-label": "Email" }, "✉️"),
        React.createElement("a", { className: "social-link", href: "https://twitter.com/ademiando", target: "_blank", rel: "noopener", "aria-label": "X" }, "𝕏")
      )
    )
  );
}

// Render
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(HeroParallax)
);
