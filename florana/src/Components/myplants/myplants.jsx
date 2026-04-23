import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { buildApiUrl, deletePlant, getPlants } from "../../api";
import LanguageSelector from "../language/LanguageSelector";
import Menu from "../menu/menu";
import "./myplants.css";

const MyPlants = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await getPlants();
        const allPlants = response.data || [];
        const validPlants = allPlants.filter((plant) => plant && plant.tracking !== false && plant.name?.trim());
        setPlants(validPlants);
      } catch (error) {
        console.error("Error fetching plants:", error);
        setPlants([
          { id: 1, name: "Monstera", type: "Tropical", health: "Healthy", watered: "2 days ago" },
          { id: 2, name: "Pothos", type: "Vine", health: "Healthy", watered: "1 day ago" },
          { id: 3, name: "Snake Plant", type: "Succulent", health: "Good", watered: "5 days ago" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
    const interval = setInterval(fetchPlants, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (plantId) => {
    if (!plantId || !window.confirm("Delete this plant?")) {
      return;
    }

    setDeletingId(plantId);

    try {
      await deletePlant(plantId);
      setPlants((previous) => previous.filter((plant) => (plant.id || plant._id) !== plantId));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed. Check backend.");
    } finally {
      setDeletingId(null);
    }
  };

  const goToProfile = (plantName) => {
    navigate(`/flower/${encodeURIComponent(plantName)}`);
  };

  return (
    <div className="plants-wrapper">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LanguageSelector />
      <div className="plants-container">
        {loading ? (
          <p className="loading-text">Loading plants...</p>
        ) : (
          <>
            <div className="plants-topbar">
              <button className="back-btn" aria-label="Go back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
              </button>

              <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                <MenuIcon size={18} />
              </button>
            </div>

            <div className="plants-header">
              <div className="user-icon">User</div>
              <div>
                <p className="hello-text">Hello Gardener!</p>
                <h2>Your Flower Dashboard</h2>
              </div>
            </div>

            <div className="summary-pill">
              {plants.length} Plants • {plants.filter((plant) => plant.warning).length} Need Attention
            </div>

            {plants.length === 0 ? (
              <div className="no-plants">No plants added</div>
            ) : (
              <div className="plants-grid">
                {plants.map((plant) => {
                  const id = plant.id || plant._id;

                  return (
                    <div
                      key={id}
                      className={`plant-card ${plant.warning ? "warning" : ""}`}
                      onClick={() => goToProfile(plant.name)}
                    >
                      <button
                        className="delete-btn"
                        disabled={deletingId === id}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(id);
                        }}
                      >
                        {deletingId === id ? "..." : "Delete"}
                      </button>

                      <img
                        src={plant.image_path ? buildApiUrl(plant.image_path) : "/defaultPlant.jpg"}
                        alt={plant.name}
                        className="plant-img"
                      />

                      <div className="plant-info">
                        <h4>
                          {plant.name}
                          {plant.warning ? <span className="alert"> !</span> : null}
                        </h4>

                        {plant.info ? <p className={plant.warning ? "danger-text" : ""}>{plant.info}</p> : null}

                        {plant.badges?.length > 0 ? (
                          <div className="badge-row">
                            {plant.badges.map((badge, index) => (
                              <span key={index} className={`badge ${plant.warning ? "red" : "green"}`}>
                                {badge}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <span className="arrow">{">"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyPlants;
