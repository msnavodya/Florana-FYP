import React from "react";
import { Menu } from "lucide-react";
import "./topbar.css";

export default function TopBar({ onMenuClick }) {
  return (
    <div className="top-bar">
      <button className="menu-btn" aria-label="Open menu" onClick={onMenuClick}>
        <Menu size={18} />
      </button>
    </div>
  );
}
