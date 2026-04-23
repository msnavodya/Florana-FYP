import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import floranaLogo from "../Assets/floranalogo.jpg";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import "./aboutus.css";

export default function AboutUs() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="about-wrapper">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LanguageSelector />
      <div className="about-container">
        <div className="page-topbar">
          <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={18} />
          </button>
        </div>

        <h2 className="about-title">About Us</h2>

        <div className="about-logo-box">
          <img src={floranaLogo} alt="Florana Logo" className="about-logo" />
        </div>

        <p className="about-description">
          Florana is your personal digital plant companion designed to help you monitor,
          maintain, and grow your plants with ease. Our mission is to create a simple,
          beautiful, and smart solution for plant care whether you're a beginner or an
          experienced plant lover.
        </p>

        <div className="about-info-card">
          <h3>Our Vision</h3>
          <p>
            To make plant care effortless, enjoyable, and accessible to everyone. We
            aim to blend smart technology with nature to help your plants grow healthier.
          </p>
        </div>

        <div className="about-footer">
          <h3>Developed By</h3>
          <p className="team-text">Florana Development Team</p>
          <p className="about-version">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
