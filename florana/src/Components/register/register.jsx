import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import Menu from "../menu/menu";
import LanguageSelector from "../language/LanguageSelector";
import { createPlant } from "../../api";
import "./register.css";

export default function Register() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    species: "",
    flowerId: "",
    flowerCatalog: "",
    location: "",
    specificLocation: "",
    climate: "",
    sunlight: "Partial Sun",
    soilType: "",
    wateringFrequency: "",
    fertilizerSchedule: "",
    lastWatered: "",
    initialSize: "",
    tracking: true,
    image: null,
    imagePreview: null,
  });

  const [nextId, setNextId] = useState(1);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: checked }));
  };

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setForm((previous) => ({
        ...previous,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSunlightChange = (option) => {
    setForm((previous) => ({ ...previous, sunlight: option }));
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert("Please enter a Plant Name!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("species", form.species);
      formData.append("flowerId", form.flowerId || `F-${nextId}`);
      formData.append("flowerCatalog", form.flowerCatalog);
      formData.append("location", form.location);
      formData.append("specificLocation", form.specificLocation);
      formData.append("climate", form.climate);
      formData.append("sunlight", form.sunlight);
      formData.append("soilType", form.soilType);
      formData.append("wateringFrequency", form.wateringFrequency);
      formData.append("fertilizerSchedule", form.fertilizerSchedule);
      formData.append("lastWatered", form.lastWatered);
      formData.append("initialSize", form.initialSize);
      formData.append("tracking", form.tracking ? "true" : "false");

      if (form.image) {
        formData.append("image", form.image);
      }

      const response = await createPlant(formData);
      setNextId((previous) => previous + 1);
      const plantName = response.data?.name || form.name;
      navigate(`/flower/${encodeURIComponent(plantName)}`);
    } catch (error) {
      console.error("FULL ERROR:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Failed to register plant");
    }
  };

  const sunlightOptions = ["Full Sun", "Partial Sun", "Shade"];
  const flowerCatalogOptions = ["Spring", "Summer", "Autumn", "Winter"];
  const soilTypeOptions = ["Loamy", "Sandy", "Clay", "Peaty", "Chalky"];
  const environmentOptions = ["Indoor", "Outdoor", "Greenhouse"];
  const climateOptions = ["Tropical", "Temperate", "Arid", "Subtropical"];

  return (
    <div className="register-wrapper">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="register-container">
        <LanguageSelector />

        <div className="mobile-header">
          <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="page-title">Register Plant</h1>
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={18} />
          </button>
        </div>

        <div className="image-row">
          <label className="image-box">
            {form.imagePreview ? (
              <img src={form.imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <span className="plus">+</span>
            )}
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>
          <span className="image-text">
            {form.image ? form.image.name : "Choose Image"}
          </span>
        </div>

        <h3 className="section-title">Basic Info</h3>
        <input className="input" placeholder="Plant Name" name="name" value={form.name} onChange={handleChange} />
        <input className="input" placeholder="Plant Species" name="species" value={form.species} onChange={handleChange} />

        <select className="input" name="flowerCatalog" value={form.flowerCatalog} onChange={handleChange}>
          <option value="">Flower Catalog</option>
          {flowerCatalogOptions.map((option) => <option key={option}>{option}</option>)}
        </select>

        <input className="input" placeholder={`Flower ID (Auto: F-${nextId})`} name="flowerId" value={form.flowerId} onChange={handleChange} />

        <h3 className="section-title">Environment</h3>
        <input className="input" placeholder="Location" name="location" value={form.location} onChange={handleChange} />

        <select className="input" name="specificLocation" value={form.specificLocation} onChange={handleChange}>
          <option value="">Specific Location</option>
          {environmentOptions.map((option) => <option key={option}>{option}</option>)}
        </select>

        <select className="input" name="climate" value={form.climate} onChange={handleChange}>
          <option value="">Climate</option>
          {climateOptions.map((option) => <option key={option}>{option}</option>)}
        </select>

        <h3 className="section-title">Sunlight</h3>
        <div className="option-row">
          {sunlightOptions.map((option) => (
            <label key={option} className={`check ${form.sunlight === option ? "active" : ""}`}>
              <input type="radio" checked={form.sunlight === option} onChange={() => handleSunlightChange(option)} />
              {option}
            </label>
          ))}
        </div>

        <h3 className="section-title">Care</h3>
        <select className="input" name="soilType" value={form.soilType} onChange={handleChange}>
          <option value="">Soil Type</option>
          {soilTypeOptions.map((option) => <option key={option}>{option}</option>)}
        </select>

        <input className="input" placeholder="Watering Frequency" name="wateringFrequency" value={form.wateringFrequency} onChange={handleChange} />
        <input className="input" placeholder="Fertilizer Schedule" name="fertilizerSchedule" value={form.fertilizerSchedule} onChange={handleChange} />

        <h3 className="section-title">Tracking</h3>
        <label>
          <input type="checkbox" checked={form.tracking} onChange={handleCheckboxChange} name="tracking" />
          {form.tracking ? " Enabled" : " Disabled"}
        </label>

        <button className="submit-btn" onClick={handleSubmit}>
          Register Plant
        </button>
      </div>
    </div>
  );
}
