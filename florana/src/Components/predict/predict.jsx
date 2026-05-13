// Render the legacy web component for Predict.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { predictImage } from "../../api";
import { buildDiagnosisResult } from "../../utils/diseaseCare";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import "./predict.css";

export default function Predict() {
  // Use client-side navigation to move between legacy web pages from this component.
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await predictImage(file);
      const result = buildDiagnosisResult({
        prediction: response.data.prediction,
        confidence: response.data.confidence,
        topPredictions: response.data.top_predictions,
      });
      setMessage(result);
    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.response?.data?.detail || "Backend not reachable"}`);
    } finally {
      setLoading(false);
    }
  };

  // Render the legacy web predict interface and its interactive controls.
  return (
    <div className="predict-container">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LanguageSelector />

      <div className="predict-topbar">
        <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <MenuIcon size={18} />
        </button>
      </div>

      <div className="predict-card">
        <h2>Plant Disease Prediction</h2>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />

        {preview ? <img src={preview} alt="preview" className="image-preview" /> : null}

        <button onClick={handleUpload} disabled={loading} className="upload-btn">
          {loading ? "Processing..." : "Predict Disease"}
        </button>

        {typeof message === "string" && message ? <p className="status-message">{message}</p> : null}
        {message && typeof message !== "string" ? (
          <div className="status-message">
            <p>
              {message.status} ({message.prediction}) - {message.confidenceText}
            </p>
            {message.careInfo ? <p>Protection: {message.careInfo.protection}</p> : null}
            {message.careInfo ? <p>Working time: {message.careInfo.workingTime}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
