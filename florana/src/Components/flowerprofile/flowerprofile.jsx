import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { addGrowth, buildApiUrl, getGrowth, getPlantByName } from "../../api";
import daisyImg from "../Assets/autumnflower.jpg";
import peonyImg from "../Assets/peonyflower.jpg";
import roseImg from "../Assets/summerflower.jpg";
import tulipsImg from "../Assets/springflower.jpg";
import Menu from "../menu/menu";
import "./flowerprofile.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

export default function FlowerProfile() {
  const { plantName } = useParams();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [plant, setPlant] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHeight, setNewHeight] = useState("");
  const [newHealth, setNewHealth] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getPlantByName(decodeURIComponent(plantName));
        const plantData = result.data || result;
        setPlant(plantData);

        const growthResult = await getGrowth(plantData._id);
        setGrowthData(growthResult.data?.data || []);
      } catch (error) {
        console.error(error);
        setPlant({
          _id: null,
          name: plantName,
          species: "Unknown",
          sunlight: "N/A",
          wateringFrequency: "N/A",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [plantName]);

  const handleAddGrowth = async (event) => {
    event.preventDefault();
    if (!newHeight || !plant?._id) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("plant_id", plant._id);
      formData.append("height", newHeight);
      formData.append("health", newHealth || "Good");
      formData.append("notes", newNotes);

      await addGrowth(formData);

      const growthResult = await getGrowth(plant._id);
      setGrowthData(growthResult.data?.data || []);
      setNewHeight("");
      setNewHealth("");
      setNewNotes("");
      alert("Growth record added successfully!");
    } catch (error) {
      console.error("Error adding growth:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const plantImages = {
    Peony: peonyImg,
    Daisy: daisyImg,
    Rose: roseImg,
    Tulips: tulipsImg,
  };

  const plantImage = plant?.image_path ? buildApiUrl(plant.image_path) : plantImages[plant?.name] || peonyImg;
  const sortedGrowth = [...growthData].sort((a, b) => new Date(a.date) - new Date(b.date));

  const chartData = {
    labels: sortedGrowth.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: "Height (cm)",
        data: sortedGrowth.map((entry) => Number(entry.height)),
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        borderColor: "#4caf50",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true } },
  };

  const getHealthColor = (health) => {
    if (!health) {
      return "#777";
    }
    if (health.toLowerCase().includes("good")) {
      return "green";
    }
    if (health.toLowerCase().includes("bad")) {
      return "red";
    }
    return "orange";
  };

  return (
    <div className="flower-wrapper">
      <div className="flower-container">
        <div className="mobile-header">
          <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <h2 className="page-title">{plant?.name}</h2>
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon size={18} />
          </button>
        </div>

        <div className="flower-image-box">
          <img src={plantImage} alt={plant?.name} />
        </div>

        <div className="flower-card">
          <div className="quick-info">
            <div>Sun: {plant?.sunlight || "N/A"}</div>
            <div>Water: {plant?.wateringFrequency || "N/A"}</div>
            <div>Type: {plant?.species || "N/A"}</div>
          </div>

          <div className="details-card">
            <h4>Plant Details</h4>
            <p><strong>Soil:</strong> {plant?.soilType || "N/A"}</p>
            <p><strong>Climate:</strong> {plant?.climate || "N/A"}</p>
            <p><strong>Location:</strong> {plant?.location || "N/A"}</p>
            <p><strong>Last Watered:</strong> {plant?.lastWatered || "N/A"}</p>
          </div>

          <div className="growth-card">
            <h4>Growth Tracker</h4>
            {sortedGrowth.length > 0 ? (
              <div className="chart-wrapper">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <p className="empty-text">No growth data yet</p>
            )}
          </div>

          <div className="history-card">
            <h4>Growth History</h4>

            {sortedGrowth.length === 0 ? <p className="empty-text">No records available</p> : null}

            {sortedGrowth.map((growth, index) => (
              <div key={index} className="history-item">
                <div>Date: {new Date(growth.date).toLocaleDateString()}</div>
                <div>Height: {growth.height} cm</div>
                <div style={{ color: getHealthColor(growth.health) }}>Health: {growth.health}</div>
                {growth.notes ? <div>Notes: {growth.notes}</div> : null}
              </div>
            ))}
          </div>

          <div className="growth-card">
            <h4>Add Growth Record</h4>
            <form onSubmit={handleAddGrowth}>
              <input
                type="number"
                placeholder="Height (cm)"
                value={newHeight}
                onChange={(event) => setNewHeight(event.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Health (e.g., Good, Bad)"
                value={newHealth}
                onChange={(event) => setNewHealth(event.target.value)}
              />
              <textarea
                placeholder="Notes (optional)"
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
                rows="3"
              />
              <button type="submit" disabled={!plant?._id}>Add Record</button>
            </form>
          </div>
        </div>
      </div>
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
