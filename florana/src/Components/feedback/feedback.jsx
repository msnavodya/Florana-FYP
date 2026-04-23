import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { useTranslation } from "../language/LanguageContext";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import logo from "../Assets/floranalogo.jpg";
import "./feedback.css";

export default function Feedback() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (!feedback.trim()) return;

    const newEntry = {
      id: Date.now(),
      rating,
      message: feedback.trim(),
      createdAt: new Date().toISOString(),
    };

    const saved = JSON.parse(localStorage.getItem("feedbacks") || "[]");
    saved.unshift(newEntry);
    localStorage.setItem("feedbacks", JSON.stringify(saved));

    alert(`${t("submit_feedback")} 👍`);
    setFeedback("");
    setRating(0);
  };

  return (
    <div className="feedback-wrapper">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LanguageSelector />
      <div className="feedback-container">
        <div className="page-topbar">
          <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={18} />
          </button>
        </div>

        <img src={logo} alt="App Logo" className="feedback-logo" />
        <h2 className="feedback-title">{t("feedback_card")}</h2>

        <div className="card support-card">
          <h3>{t("contact_support_card")}</h3>
          <div className="support-item"><span>📧</span> {t("email_support")}</div>
          <div className="support-item"><span>❓</span> {t("faq_center")}</div>
          <div className="support-item"><span>📞</span> {t("call_us")}</div>
        </div>

        <div className="card thoughts-card">
          <h3>{t("share_your_thoughts")}</h3>
          <p>{t("rate_app")}</p>

          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= rating ? "star filled" : "star"}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>

          <button className="review-btn">Leave an App Store Review</button>

          <textarea
            className="feedback-input"
            placeholder={t("type_feedback")}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button className="submit-btn" onClick={handleSubmit}>
            {t("submit_feedback")}
          </button>
        </div>
      </div>
    </div>
  );
}
