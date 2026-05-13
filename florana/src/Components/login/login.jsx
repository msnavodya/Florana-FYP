// Render the legacy web component for Login.
import React from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

import floranaLogo from "../Assets/floranalogo.jpg";
import welcomeImg from "../Assets/welcome.jpg";

export default function Welcome() {
  // Use client-side navigation to move between legacy web pages from this component.
  const navigate = useNavigate();

  // Render the legacy web login interface and its interactive controls.
  return (
    <div className="welcome-wrapper">
      <div className="welcome-card">

        {/* Logo */}
        <img src={floranaLogo} alt="Florana Logo" className="logo-img" />

        {/* Flower Image */}
        <div className="flower-frame">
          <img src={welcomeImg} alt="Welcome" className="flower-img" />
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          <button
            className="start-btn"
            onClick={() => navigate("/signin")}
          >
            GET STARTED
          </button>

          <div className="swipe-bar"></div>
        </div>

      </div>
    </div>
  );
}
