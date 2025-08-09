import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

export default function HeroSection() {
  const canvasRef = useRef();

  useEffect(() => {
    // Three.js setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050517, 0.00025);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 40, 200);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8, 0.4, 0.85
      )
    );

    // Stars
    function addStars() {
      const stars = new THREE.Group();
      const count = 1800;
      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(Math.random() * 0.4 + 0.12, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.77 + Math.random()*0.2, transparent: true });
        const mesh = new THREE.Mesh(geo, mat);
        const r = 200 + Math.random() * 1200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        mesh.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        stars.add(mesh);
      }
      scene.add(stars);
      return stars;
    }

    // Nebula
    function addNebula() {
      const geometry = new THREE.PlaneGeometry(4000, 2000, 30, 30);
      const material = new THREE.MeshBasicMaterial({ color: 0x2244dd, opacity: 0.17, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -1050;
      mesh.position.y = 0;
      scene.add(mesh);
      return mesh;
    }

    // Mountains
    function addMountains() {
      const group = new THREE.Group();
      const layers = [
        { depth: -40, color: 0x14213d, opacity: 1, height: 60 },
        { depth: -80, color: 0x163060, opacity: 0.7, height: 90 },
        { depth: -130, color: 0x0a1c35, opacity: 0.5, height: 120 },
        { depth: -180, color: 0x0e1733, opacity: 0.35, height: 160 }
      ];
      layers.forEach((layer, idx) => {
        const points = [];
        const segments = 46;
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1400;
          const y = Math.sin(i * 0.18 + idx*0.2) * layer.height + Math.random() * 8 - 150 + idx*20;
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
        group.add(mesh);
      });
      scene.add(group);
      return group;
    }

    // Light
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Add objects
    const stars = addStars();
    const nebula = addNebula();
    const mountains = addMountains();

    // Animation
    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.0003;
      stars.rotation.y = t * 0.7;
      mountains.children.forEach((mountain, i) => {
        mountain.position.x = Math.sin(t * 1.1 + i) * (i+1)*5;
        mountain.position.y = mountain.position.z*0.2 + Math.cos(t * 1.3 + i) * (i+1)*2;
      });
      composer.render();
    }
    animate();

    // Responsive
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Konten portofolio
  return (
    <div className="hero-container">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-content">
        <img src="https://avatars.githubusercontent.com/u/19248306?v=4" alt="Ademiando" className="profile-img" />
        <h1 className="hero-title">Ademiando</h1>
        <div className="hero-subtitle">
          Crafting Web Experiences<br />
          <span style={{color:'#7fdfff'}}>Developer · Designer · Dreamer</span>
        </div>
        <div className="hero-desc">
          Hi! I build creative digital products with code, design, and a cosmic touch.<br />
          Let’s connect and make something awesome together.<br />
        </div>
        <div className="social-links">
          <a className="social-link" href="https://github.com/ademiando" target="_blank" rel="noopener" aria-label="GitHub"><span>🐙</span></a>
          <a className="social-link" href="https://linkedin.com/in/ademiando" target="_blank" rel="noopener" aria-label="LinkedIn"><span>in</span></a>
          <a className="social-link" href="mailto:hi@ademiando.com" aria-label="Email"><span>✉️</span></a>
          <a className="social-link" href="https://twitter.com/ademiando" target="_blank" rel="noopener" aria-label="X"><span>𝕏</span></a>
        </div>
      </div>
    </div>
  );
}
