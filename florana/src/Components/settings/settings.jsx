import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Menu, Settings as SettingsIcon } from "lucide-react";
import { logoutUser } from "../../api";
import LanguageSelector from "../language/LanguageSelector";
import MenuPanel from "../menu/menu";
import { useTranslation } from "../language/LanguageContext";
import "./settings.css";

const defaultSettings = {
  fontSize: "Medium",
  language: "English",
  wateringReminders: true,
  diseaseAlerts: false,
  weeklySummary: false,
};

const fontSizes = ["Small", "Medium", "Large"];
const languages = ["English", "Sinhala", "Tamil"];

export default function Settings() {
  const navigate = useNavigate();
  const { t, setLanguage } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem("florana_settings") || "null");
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const nextSettings = savedSettings ? { ...defaultSettings, ...savedSettings } : defaultSettings;

      setSettings(nextSettings);
      setUser(storedUser);
      applyFont(nextSettings.fontSize);
      setLanguage(nextSettings.language);
    } catch (error) {
      console.error("Failed to load settings:", error);
      setSettings(defaultSettings);
      applyFont(defaultSettings.fontSize);
      setLanguage(defaultSettings.language);
    }
  }, [setLanguage]);

  const applyFont = (size) => {
    let value = "16px";

    if (size === "Small") {
      value = "14px";
    }

    if (size === "Large") {
      value = "18px";
    }

    document.documentElement.style.fontSize = value;
  };

  const saveSettings = (updatedSettings) => {
    setSettings((previous) => {
      const nextSettings = { ...previous, ...updatedSettings };
      localStorage.setItem("florana_settings", JSON.stringify(nextSettings));
      return nextSettings;
    });
  };

  const showStatus = (message) => {
    setStatus(message);
    window.clearTimeout(window.floranaSettingsStatusTimer);
    window.floranaSettingsStatusTimer = window.setTimeout(() => setStatus(""), 2600);
  };

  const handleFontChange = (event) => {
    const value = event.target.value;
    applyFont(value);
    saveSettings({ fontSize: value });
    showStatus(`Font size set to ${value}.`);
  };

  const handleLanguageChange = (event) => {
    const value = event.target.value;
    setLanguage(value);
    saveSettings({ language: value });
    showStatus(`Language changed to ${value}.`);
  };

  const requestBrowserNotifications = async () => {
    if (!("Notification" in window) || Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const handleToggle = async (key) => {
    const nextValue = !settings[key];

    if (nextValue) {
      const granted = await requestBrowserNotifications();
      if (!granted && key !== "weeklySummary") {
        showStatus("Browser notifications are blocked. In-app reminders can still stay on.");
      }
    }

    saveSettings({ [key]: nextValue });
    showStatus(`${nextValue ? "Enabled" : "Disabled"} ${labelFromKey(key)}.`);
  };

  const labelFromKey = (key) => {
    const labels = {
      wateringReminders: "watering reminders",
      diseaseAlerts: "disease alerts",
      weeklySummary: "weekly summary",
    };

    return labels[key] || key;
  };

  const handleClearKey = (storageKey, successMessage) => {
    localStorage.removeItem(storageKey);
    showStatus(successMessage);
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: JSON.parse(localStorage.getItem("user") || "null"),
      settings: JSON.parse(localStorage.getItem("florana_settings") || "null"),
      careReminder: JSON.parse(localStorage.getItem("careReminder") || "null"),
      cart: JSON.parse(localStorage.getItem("cart") || "[]"),
      feedbacks: JSON.parse(localStorage.getItem("feedbacks") || "[]"),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "florana-data-export.json";
    link.click();
    URL.revokeObjectURL(url);
    showStatus("Exported your app data.");
  };

  const handleResetPreferences = () => {
    if (!window.confirm("Reset settings back to the Florana defaults?")) {
      return;
    }

    localStorage.removeItem("florana_settings");
    localStorage.removeItem("app_language");
    setSettings(defaultSettings);
    applyFont(defaultSettings.fontSize);
    setLanguage(defaultSettings.language);
    showStatus("Preferences reset to default.");
  };

  const handleLogout = () => {
    if (!window.confirm("Sign out from Florana on this device?")) {
      return;
    }

    logoutUser();
    navigate("/");
  };

  return (
    <div className="settings-page mobile-screen">
      <MenuPanel isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="settings-shell mobile-frame">
        <div className="settings-scroll mobile-panel">
          <LanguageSelector />

          <div className="settings-topbar">
            <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>

            <div className="settings-topbar-actions">
              <button className="settings-home-btn" onClick={() => navigate("/home")}>
                <Home size={16} />
                <span>Home</span>
              </button>

              <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                <Menu size={18} />
              </button>
            </div>
          </div>

          <div className="settings-hero">
            <div className="settings-hero-icon">
              <SettingsIcon size={22} />
            </div>
            <p className="settings-eyebrow">Florana Workspace</p>
            <h1 className="settings-title">{t("settings")}</h1>
            <p className="settings-subtitle">
              Adjust your app experience, keep reminders organized, and manage your device data in one place.
            </p>

            <div className="settings-profile-card">
              <div>
                <p className="profile-label">Signed in as</p>
                <h2>{user?.full_name || "Guest Gardener"}</h2>
                <p>{user?.email || "No account email found on this device."}</p>
              </div>

              <button className="settings-ghost-btn" onClick={() => navigate("/profile")}>
                View Profile
              </button>
            </div>
          </div>

          {status ? <div className="settings-status">{status}</div> : null}

          <div className="settings-grid">
            <section className="settings-panel">
              <div className="panel-heading">
                <p className="panel-eyebrow">{t("display")}</p>
                <h3>Look and language</h3>
              </div>

              <label className="setting-row">
                <span>{t("font_size")}</span>
                <select value={settings.fontSize} onChange={handleFontChange}>
                  {fontSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <label className="setting-row">
                <span>{t("language")}</span>
                <select value={settings.language} onChange={handleLanguageChange}>
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="settings-panel">
              <div className="panel-heading">
                <p className="panel-eyebrow">{t("notifications")}</p>
                <h3>Reminder controls</h3>
              </div>

              <button className="toggle-row" onClick={() => handleToggle("wateringReminders")}>
                <div>
                  <strong>{t("watering_reminders")}</strong>
                  <p>Save this preference for plant care reminders.</p>
                </div>
                <span className={`toggle-pill ${settings.wateringReminders ? "active" : ""}`}>
                  {settings.wateringReminders ? "On" : "Off"}
                </span>
              </button>

              <button className="toggle-row" onClick={() => handleToggle("diseaseAlerts")}>
                <div>
                  <strong>{t("disease_alerts")}</strong>
                  <p>Keep disease warning messages available in the app.</p>
                </div>
                <span className={`toggle-pill ${settings.diseaseAlerts ? "active" : ""}`}>
                  {settings.diseaseAlerts ? "On" : "Off"}
                </span>
              </button>

              <button className="toggle-row" onClick={() => handleToggle("weeklySummary")}>
                <div>
                  <strong>{t("weekly_summary")}</strong>
                  <p>Store your summary preference for future activity updates.</p>
                </div>
                <span className={`toggle-pill ${settings.weeklySummary ? "active" : ""}`}>
                  {settings.weeklySummary ? "On" : "Off"}
                </span>
              </button>
            </section>

            <section className="settings-panel">
              <div className="panel-heading">
                <p className="panel-eyebrow">Shortcuts</p>
                <h3>Open real app screens</h3>
              </div>

              <div className="action-list">
                <button className="action-btn" onClick={() => navigate("/register")}>
                  Register new plant
                </button>
                <button className="action-btn" onClick={() => navigate("/care")}>
                  Open care reminder
                </button>
                <button className="action-btn" onClick={() => navigate("/feedback")}>
                  Send feedback
                </button>
                <button className="action-btn" onClick={() => navigate("/help")}>
                  Help center
                </button>
                <button
                  className="action-btn"
                  onClick={() => {
                    window.location.href = "mailto:support@florana.com?subject=Florana%20Support";
                  }}
                >
                  Contact support
                </button>
              </div>
            </section>

            <section className="settings-panel">
              <div className="panel-heading">
                <p className="panel-eyebrow">{t("privacy_security")}</p>
                <h3>Stored data</h3>
              </div>

              <div className="action-list">
                <button className="action-btn" onClick={handleExportData}>
                  Export my data
                </button>
                <button className="action-btn" onClick={() => handleClearKey("cart", "Cart cleared from this device.")}>
                  Clear cart
                </button>
                <button className="action-btn" onClick={() => handleClearKey("feedbacks", "Saved feedback history removed.")}>
                  Clear feedback history
                </button>
                <button className="action-btn" onClick={() => handleClearKey("florana_search_history", "Search history cleared.")}>
                  {t("clear_search_history")}
                </button>
              </div>
            </section>

            <section className="settings-panel settings-panel-danger">
              <div className="panel-heading">
                <p className="panel-eyebrow">Account</p>
                <h3>Reset or sign out</h3>
              </div>

              <div className="action-list danger-actions">
                <button className="action-btn subtle" onClick={handleResetPreferences}>
                  Reset preferences
                </button>
                <button className="action-btn danger" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
