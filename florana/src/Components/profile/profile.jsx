// Render the legacy web component for Profile.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import "./profile.css";

export default function Profile() {
  // Use client-side navigation to move between legacy web pages from this component.
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser({
        id: "demo-001",
        full_name: "Demo User",
        email: "demo@florana.com",
      });
    }
  }, [navigate]);

  // Render the legacy web profile interface and its interactive controls.
  return (
    <div className="profile-container">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LanguageSelector />

      <div className="profile-topbar">
        <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <MenuIcon size={18} />
        </button>
      </div>

      <h1>Your Profile</h1>

      <div className="profile-card">
        <p><strong>User ID:</strong> {user.id || "00123"}</p>
        <p><strong>Name:</strong> {user.full_name || "Sandy"}</p>
        <p><strong>Email:</strong> {user.email || "sandy@email.com"}</p>
      </div>

      <button className="profile-register-btn" onClick={() => navigate("/register")}>
        Register New Plant
      </button>
    </div>
  );
}
