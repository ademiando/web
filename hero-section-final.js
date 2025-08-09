(function(){
  const { useEffect, useRef, useState } = React;

  function HeroSection() {
    // Semua ref dan state
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const scrollProgressRef = useRef(null);
    const menuRef = useRef(null);

    const smoothCameraPos = useRef({ x: 0, y: 30, z: 100 });
    const [scrollProgress, setScrollProgress] = useState(0);
    const [currentSection, setCurrentSection] = useState(1);
    const [isReady, setIsReady] = useState(false);
    const totalSections = 2;
    const threeRefs = useRef({
      scene: null,
      camera: null,
      renderer: null,
      stars: [],
      nebula: null,
      mountains: [],
      animationId: null
    });

    // === THREE.JS ===
    useEffect(() => {
      const THREE = window.THREE;
      const { current: refs } = threeRefs;
      // Scene setup
      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
      // Camera
      refs.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      refs.camera.position.z = 100;
      refs.camera.position.y = 20;
      // Renderer
      refs.renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true
      });
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.5;

      // === Stars ===
      const createStarField = () => {
        const starCount = 5000;
        for (let i = 0; i < 3; i++) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(starCount * 3);
          const colors = new Float32Array(starCount * 3);
          const sizes = new Float32Array(starCount);
          for (let j = 0; j < starCount; j++) {
            const radius = 200 + Math.random() * 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[j * 3 + 2] = radius * Math.cos(phi);
            const color = new THREE.Color();
            const colorChoice = Math.random();
            if (colorChoice < 0.7) color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
            else if (colorChoice < 0.9) color.setHSL(0.08, 0.5, 0.8);
            else color.setHSL(0.6, 0.5, 0.8);
            colors[j * 3] = color.r;
            colors[j * 3 + 1] = color.g;
            colors[j * 3 + 2] = color.b;
            sizes[j] = Math.random() * 2 + 0.5;
          }
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
          const material = new THREE.PointsMaterial({
            vertexColors: true,
            size: 1 + i,
            transparent: true,
            opacity: 0.6 - i*0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          const stars = new THREE.Points(geometry, material);
          refs.scene.add(stars);
          refs.stars.push(stars);
        }
      };
      createStarField();

      // === Nebula ===
      const createNebula = () => {
        const geometry = new THREE.PlaneGeometry(8000, 4000, 100, 100);
        const material = new THREE.MeshBasicMaterial({
          color: 0x3355ff,
          opacity: 0.15,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const nebula = new THREE.Mesh(geometry, material);
        nebula.position.z = -1050;
        nebula.rotation.x = 0;
        refs.scene.add(nebula);
        refs.nebula = nebula;
      };
      createNebula();

      // === Mountains ===
      const createMountains = () => {
        const layers = [
          { distance: -50, height: 60, color: 0x1a1a2e, opacity: 1 },
          { distance: -100, height: 80, color: 0x16213e, opacity: 0.8 },
          { distance: -150, height: 100, color: 0x0f3460, opacity: 0.6 },
          { distance: -200, height: 120, color: 0x0a4668, opacity: 0.4 }
        ];
        layers.forEach((layer, index) => {
          const points = [];
          const segments = 50;
          for (let i = 0; i <= segments; i++) {
            const x = (i / segments - 0.5) * 1000;
            const y = Math.sin(i * 0.1) * layer.height +
              Math.sin(i * 0.05) * layer.height * 0.5 +
              Math.random() * layer.height * 0.2 - 100;
            points.push(new THREE.Vector2(x, y));
          }
          points.push(new THREE.Vector2(5000, -300));
          points.push(new THREE.Vector2(-5000, -300));
          const shape = new THREE.Shape(points);
          const geometry = new THREE.ShapeGeometry(shape);
          const material = new THREE.MeshBasicMaterial({
            color: layer.color,
            transparent: true,
            opacity: layer.opacity,
            side: THREE.DoubleSide
          });
          const mountain = new THREE.Mesh(geometry, material);
          mountain.position.z = layer.distance;
          mountain.position.y = layer.distance;
          mountain.userData = { baseZ: layer.distance, index };
          refs.scene.add(mountain);
          refs.mountains.push(mountain);
        });
      };
      createMountains();

      // === Animate Loop ===
      function animate() {
        refs.animationId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        refs.stars.forEach((starField,i)=>{
          starField.rotation.y = time * 0.05 * (1.0 - i * 0.3);
        });
        if (refs.nebula) refs.nebula.material.opacity = 0.15 + Math.sin(time*0.5)*0.03;
        if (refs.camera && refs.targetCameraX !== undefined) {
          const s = 0.07;
          smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * s;
          smoothCameraPos.current.y += (refs.targetCameraY - smoothCameraPos.current.y) * s;
          smoothCameraPos.current.z += (refs.targetCameraZ - smoothCameraPos.current.z) * s;
          const floatX = Math.sin(time * 0.1) * 2;
          const floatY = Math.cos(time * 0.15) * 1;
          refs.camera.position.x = smoothCameraPos.current.x + floatX;
          refs.camera.position.y = smoothCameraPos.current.y + floatY;
          refs.camera.position.z = smoothCameraPos.current.z;
          refs.camera.lookAt(0, 10, -600);
        }
        refs.mountains.forEach((mountain, i) => {
          const parallaxFactor = 1 + i * 0.5;
          mountain.position.x = Math.sin(time * 0.1) * 2 * parallaxFactor;
          mountain.position.y = 50 + (Math.cos(time * 0.15) * 1 * parallaxFactor);
        });
        refs.renderer.render(refs.scene, refs.camera);
      }
      animate();

      // === Resize ===
      const handleResize = () => {
        const { camera, renderer } = refs;
        if (camera && renderer) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', handleResize);

      // === Cleanup ===
      return () => {
        if (refs.animationId) cancelAnimationFrame(refs.animationId);
        window.removeEventListener('resize', handleResize);
        refs.stars.forEach(starField => {
          starField.geometry.dispose();
          starField.material.dispose();
        });
        refs.mountains.forEach(mountain => {
          mountain.geometry.dispose();
          mountain.material.dispose();
        });
        if (refs.nebula) {
          refs.nebula.geometry.dispose();
          refs.nebula.material.dispose();
        }
        if (refs.renderer) refs.renderer.dispose();
      };
    }, []);

    // === SCROLL LOGIC ===
    useEffect(() => {
      function handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const maxScroll = documentHeight - windowHeight;
        const progress = Math.min(scrollY / maxScroll, 1);
        setScrollProgress(progress);
        const newSection = Math.floor(progress * totalSections);
        setCurrentSection(newSection);
        const { current: refs } = threeRefs;
        const totalProgress = progress * totalSections;
        const sectionProgress = totalProgress % 1;
        const cameraPositions = [
          { x: 0, y: 30, z: 300 },
          { x: 0, y: 40, z: -50 },
          { x: 0, y: 50, z: -700 }
        ];
        const currentPos = cameraPositions[newSection] || cameraPositions[0];
        const nextPos = cameraPositions[newSection + 1] || currentPos;
        refs.targetCameraX = currentPos.x + (nextPos.x - currentPos.x) * sectionProgress;
        refs.targetCameraY = currentPos.y + (nextPos.y - currentPos.y) * sectionProgress;
        refs.targetCameraZ = currentPos.z + (nextPos.z - currentPos.z) * sectionProgress;
      }
      window.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // === GSAP ===
    useEffect(() => {
      setIsReady(true);
    }, []);

    // === RENDER ===
    const splitTitle = text => text.split('').map((char, i) =>
      React.createElement("span", { key: i, className: "title-char" }, char)
    );

    return React.createElement("div", { ref: containerRef, className: "hero-container cosmos-style" }, [
      React.createElement("canvas", { ref: canvasRef, className: "hero-canvas", key: "canvas" }),
      React.createElement("div", { className: "hero-content cosmos-content", key: "content" }, [
        React.createElement("h1", { ref: titleRef, className: "hero-title", key: "title" }, splitTitle(
          ["HORIZON", "COSMOS", "INFINITY"][currentSection] || "HORIZON"
        )),
        React.createElement("div", { ref: subtitleRef, className: "hero-subtitle cosmos-subtitle", key: "subtitle" }, [
          React.createElement("p", { className: "subtitle-line", key: 1 },
            [
              "Where vision meets reality,",
              "Beyond the boundaries of imagination,",
              "In the space between thought and creation,"
            ][currentSection]
          ),
          React.createElement("p", { className: "subtitle-line", key: 2 },
            [
              "we shape the future of tomorrow",
              "lies the universe of possibilities",
              "we find the essence of true innovation"
            ][currentSection]
          )
        ])
      ])
    ]);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    React.createElement(HeroSection)
  );
})();
