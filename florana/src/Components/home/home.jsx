import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu as MenuIcon } from "lucide-react";
import { predictImage } from "../../api";
import { useTranslation } from "../language/LanguageContext";
import logo from "../Assets/floranalogo.jpg";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("User parse error:", error);
        localStorage.removeItem("user");
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("feedbacks") || "[]");
      setFeedbacks(saved);
    } catch {
      setFeedbacks([]);
    }
  }, []);

  useEffect(() => {
    if (feedbacks.length === 0) {
      setCurrentFeedbackIndex(0);
    } else if (currentFeedbackIndex >= feedbacks.length) {
      setCurrentFeedbackIndex(feedbacks.length - 1);
    }
  }, [feedbacks, currentFeedbackIndex]);

  const minSwipeDistance = 50;

  const onTouchStart = (event) => {
    setTouchStart(event.targetTouches[0].clientX);
  };

  const onTouchMove = (event) => {
    setTouchEnd(event.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      return;
    }

    const distance = touchStart - touchEnd;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0 && currentFeedbackIndex < feedbacks.length - 1) {
        setCurrentFeedbackIndex((previous) => previous + 1);
      } else if (distance < 0 && currentFeedbackIndex > 0) {
        setCurrentFeedbackIndex((previous) => previous - 1);
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const nextFeedback = () => {
    setCurrentFeedbackIndex((previous) => (previous < feedbacks.length - 1 ? previous + 1 : 0));
  };

  const prevFeedback = () => {
    setCurrentFeedbackIndex((previous) => (previous > 0 ? previous - 1 : feedbacks.length - 1));
  };

  const handleScan = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setLoading(true);

    try {
      const response = await predictImage(file);
      const { prediction, confidence } = response.data;
      const percent = typeof confidence === "number" ? (confidence * 100).toFixed(2) : confidence;
      const isHealthy = prediction === "Healthy Plant";
      const status = isHealthy ? "Healthy Plant" : "Unhealthy Plant - Disease Detected";
      setDiagnosis(`${status} (${prediction}) - Confidence: ${percent}%`);
    } catch (error) {
      setDiagnosis(`Error: ${error.response?.data?.detail || "Backend not reachable"}`);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="home-container">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="top-header">
        <div className="header-left">
          <img src={logo} alt="Florana Logo" className="header-logo" />
          <h3 className="header-title">
            {user ? t("hello_user", { name: user.full_name }) : t("hello_guest")}
          </h3>
        </div>

        <div className="home-header-actions">
          <LanguageSelector />
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={18} />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleScan}
        accept="image/*"
      />

      <div className="search-box">
        <input type="text" placeholder={t("search_placeholder")} />
        <button className="search-icon">Search</button>
      </div>

      {diagnosis ? (
        <div className="diagnosis-alert">
          <strong>Result: {diagnosis}</strong>
          <button onClick={() => setDiagnosis(null)}>x</button>
        </div>
      ) : null}

      <h2 className="section-title">{t("todays_insights")}</h2>

      <div className="cards-grid">
        <div className="card yellow" onClick={() => fileInputRef.current?.click()}>
          <h4>{t("diagnose")}</h4>
          <p>{loading ? t("analyzing") : t("tap_to_scan_leaf")}</p>
        </div>

        <div className="card purple" onClick={() => navigate("/feedback")}>
          <h4>{t("feedback_card")}</h4>
          <p>{t("reviews", { count: feedbacks.length })}</p>
        </div>

        <div className="card green" onClick={() => navigate("/care")}>
          <h4>{t("care_reminder_card")}</h4>
          <p>Water Monstera.</p>
        </div>

        <div className="card blue" onClick={() => navigate("/quicktip")}>
          <h4>{t("quick_tip_card")}</h4>
          <p>Use well-draining soil.</p>
        </div>
      </div>

      <div className="home-feedback-box">
        <div className="feedback-header">
          <h3>User Feedback</h3>
          {feedbacks.length > 0 ? (
            <span className="feedback-count">
              {currentFeedbackIndex + 1}/{feedbacks.length}
            </span>
          ) : null}
        </div>

        {feedbacks.length === 0 ? (
          <div className="no-feedback-box">
            <p>No feedback yet</p>
          </div>
        ) : (
          <div className="feedback-slideshow">
            <button className="slide-btn prev" onClick={prevFeedback} disabled={feedbacks.length <= 1}>
              {"<"}
            </button>

            <div className="slideshow-container">
              <div
                className="feedback-track"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  transform: `translateX(-${currentFeedbackIndex * 100}%)`,
                  transition: "transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                }}
              >
                {feedbacks.map((entry) => (
                  <div key={entry.id} className="feedback-slide">
                    <div className="feedback-card">
                      <div className="feedback-content">
                        <p className="feedback-msg">{entry.message}</p>
                        {entry.rating ? <div className="feedback-stars">{"*".repeat(entry.rating)}</div> : null}
                      </div>
                      <small className="feedback-date">{entry.timestamp || "Just now"}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="slide-btn next" onClick={nextFeedback} disabled={feedbacks.length <= 1}>
              {">"}
            </button>

            {feedbacks.length > 1 ? (
              <div className="feedback-dots">
                {feedbacks.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentFeedbackIndex ? "active" : ""}`}
                    onClick={() => setCurrentFeedbackIndex(index)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
