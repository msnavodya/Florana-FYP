import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { useTranslation } from "../language/LanguageContext";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import logo from "../Assets/floranalogo.jpg";
import "./help.css";

export default function Help() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="help-wrapper">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LanguageSelector />
      <div className="help-container">
        <div className="help-topbar">
          <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>

          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={18} />
          </button>
        </div>

        <img src={logo} alt="Florana Logo" className="help-logo" />

        <h2 className="help-title">{t("help_support")}</h2>

        <div className="card help-card">
          <h3>🔧 {t("app_not_working")}</h3>
          <p>{t("app_restart_hint")}</p>
        </div>

        <div className="card help-card">
          <h3>📩 {t("contact_support_card")}</h3>
          <p>Email: support@florana.com</p>
        </div>

        <div className="card help-card">
          <h3>📘 {t("faq_center")}</h3>
          <p>{t("share_your_thoughts")}</p>
        </div>
      </div>
    </div>
  );
}
