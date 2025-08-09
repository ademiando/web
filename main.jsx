import React from "react";
import { createRoot } from "react-dom/client";
import HeroSection from "./HeroSection.jsx";

function PortfolioSection() {
  return (
    <section className="section" id="portfolio">
      <h2 className="section-title">Portfolio</h2>
      <div className="portfolio-list">
        <div className="portfolio-card">
          <h3>ademiando.com</h3>
          <p>Personal website and interactive portfolio, built with React, Three.js, and GSAP for motion & cosmic vibes.</p>
          <a href="https://ademiando.com" target="_blank" rel="noopener">Live Site</a>
        </div>
        <div className="portfolio-card">
          <h3>Mystic UI</h3>
          <p>Design system and UI kit for fast modern web-apps. Used on several SaaS products and open source projects.</p>
          <a href="https://github.com/ademiando/mystic-ui" target="_blank" rel="noopener">GitHub</a>
        </div>
        <div className="portfolio-card">
          <h3>Cosmic Blog</h3>
          <p>Minimal static blog system with Markdown & Next.js, used for technical writing and sharing ideas.</p>
          <a href="https://github.com/ademiando/cosmic-blog" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="section" id="about">
      <h2 className="section-title">About Me</h2>
      <p>
        <b>Ademiando</b> is a software engineer, UI/UX enthusiast, and creative coder.<br />
        Passionate about crafting beautiful web experiences with code, design, and a touch of cosmic magic.<br />
        Loves React, Three.js, Next.js, and building tools for the web.<br /><br />
        <b>Location:</b> Indonesia · Open for collaboration.
      </p>
    </section>
  );
}

function App() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <PortfolioSection />
      <footer className="section" style={{fontSize:'0.98rem',color:'#789',paddingBottom:32}}>
        &copy; {new Date().getFullYear()} Ademiando. Built with React &amp; Three.js.
      </footer>
    </>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
