// Render the legacy web component for Menu.
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlarmClock,
  CircleHelp,
  Home,
  Info,
  Leaf,
  Lightbulb,
  LogOut,
  MessageSquareText,
  Settings,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { logoutUser } from "../../api";
import logo from "../Assets/floranalogo.jpg";
import "./menu.css";

const menuItems = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/catalog", label: "Catalog", icon: ShoppingBag },
  { path: "/myplants", label: "My Plants", icon: Leaf },
  { path: "/care", label: "Care Reminder", icon: AlarmClock },
  { path: "/quicktip", label: "Quick Tip", icon: Lightbulb },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/about", label: "About", icon: Info },
  { path: "/help", label: "Help", icon: CircleHelp },
  { path: "/feedback", label: "Feedback", icon: MessageSquareText },
];

export default function Menu({ isOpen, onClose }) {
  // Use client-side navigation to move between legacy web pages from this component.
  const navigate = useNavigate();

  // Close the drawer after navigation so the next screen starts in a clean state.
  const goTo = (path) => {
    navigate(path);
    onClose();
  };

  // Clear auth state before returning to the landing page.
  const handleLogout = () => {
    logoutUser();
    navigate("/");
    onClose();
  };

  // Render the legacy web menu interface and its interactive controls.
  return (
    <div
      className={`menu-overlay ${isOpen ? "show" : ""}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <aside
        className={`menu-container ${isOpen ? "open" : ""}`}
        // Keep clicks inside the panel from bubbling up and closing the overlay.
        onClick={(event) => event.stopPropagation()}
        aria-label="Main navigation"
      >
        <button className="menu-close-btn" aria-label="Close menu" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="menu-header">
          <img src={logo} alt="Florana Logo" className="menu-logo" />
          <div className="menu-heading-text">
            <p>Florana</p>
            <h2 className="menu-title">Navigation</h2>
          </div>
        </div>

        <div className="menu-items">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button key={item.path} className="menu-item" onClick={() => goTo(item.path)}>
                <span className="icon-shell">
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <button onClick={handleLogout} className="menu-item logout">
            <span className="icon-shell">
              <LogOut size={18} strokeWidth={2.2} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
