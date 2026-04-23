import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { useTranslation } from "../language/LanguageContext";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import "./quicktip.css";

const tipOptions = [
  { key: "soil", title: "Soil Tips", tip: "Use well-draining soil.", detail: "Helps prevent root rot and keeps roots healthy." },
  { key: "sunlight", title: "Sunlight Tips", tip: "Place in indirect sunlight.", detail: "Avoid harsh noon sun for most indoor tropical plants." },
  { key: "watering", title: "Watering Tips", tip: "Water deeply once a week.", detail: "Ensure excess water drains to avoid soggy roots." },
  { key: "fertilizer", title: "Fertilizer Tips", tip: "Use organic fertilizer every 2 weeks.", detail: "Supports growth without chemical buildup." },
  { key: "pest", title: "Pest Control Tips", tip: "Check leaves for insects weekly.", detail: "Early detection prevents infestations." },
  { key: "seasonal", title: "Seasonal Care Tips", tip: "Reduce watering during winter.", detail: "Plants often go into rest mode when cooler." },
  { key: "diy", title: "DIY Hacks", tip: "Use coffee grounds for soil enrichment.", detail: "Mix into compost for extra nutrients; don't overdo it." },
  { key: "pairing", title: "Plant Pairing Tips", tip: "Group plants with similar water needs.", detail: "This avoids over and under watering issues for pairs." },
];

export default function QuickTip() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTipKey, setActiveTipKey] = useState("soil");

  const activeTip = tipOptions.find((item) => item.key === activeTipKey) || tipOptions[0];

  return (
    <div className="quick-tip-container">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LanguageSelector />
      <div className="quick-tip-card">
        <div className="page-topbar">
          <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={18} />
          </button>
        </div>

        <h2>{t("quick_tip")}</h2>

        <div className="tips-list">
          {tipOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveTipKey(option.key)}
              className={`tip-chip ${activeTipKey === option.key ? "active" : ""}`}
            >
              {option.title}
            </button>
          ))}
        </div>

        <div className="tip-detail-box">
          <p className="tip-text">{activeTip.tip}</p>
          <p className="tip-details">{activeTip.detail}</p>
        </div>
      </div>
    </div>
  );
}
