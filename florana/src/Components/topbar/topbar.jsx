// Render the legacy web component for Topbar.
import React from "react";
import { Menu } from "lucide-react";
import "./topbar.css";

export default function TopBar({ onMenuClick }) {
  // Render the legacy web topbar interface and its interactive controls.
  return (
    <div className="top-bar">
      <button className="menu-btn" aria-label="Open menu" onClick={onMenuClick}>
        <Menu size={18} />
      </button>
    </div>
  );
}
