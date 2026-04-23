import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, ArrowLeft, BellRing, Menu, Plus, Trash2 } from "lucide-react";
import MenuPanel from "../menu/menu";
import LanguageSelector from "../language/LanguageSelector";
import "./carereminder.css";

const defaultOptions = [
  { key: "watering", title: "Watering", info: "Notify when plant needs water" },
  { key: "fertilizing", title: "Fertilizing", info: "Remind when to fertilize" },
  { key: "pruning", title: "Pruning", info: "Alerts for trimming and shaping" },
  { key: "repotting", title: "Repotting", info: "Remind when to repot" },
  { key: "sunlight", title: "Sunlight", info: "Suggest moving plants for better light" },
];

const initialOptions = {
  watering: true,
  fertilizing: false,
  pruning: false,
  repotting: false,
  sunlight: true,
};

const initialNotifications = { push: true, email: false };

export default function CareReminder() {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [options, setOptions] = useState(initialOptions);
  const [customNotes, setCustomNotes] = useState([]);
  const [newCustomNote, setNewCustomNote] = useState("");
  const [summaryMode, setSummaryMode] = useState("daily");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [wateringTime, setWateringTime] = useState("07:00");
  const [inAppMessages, setInAppMessages] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("careReminder") || "null");
    if (saved) {
      setOptions(saved.options ?? initialOptions);
      setCustomNotes(saved.customNotes ?? []);
      setSummaryMode(saved.summaryMode ?? "daily");
      setNotifications(saved.notifications ?? initialNotifications);
      setWateringTime(saved.wateringTime ?? "07:00");
      setInAppMessages(saved.inAppMessages ?? []);
    }

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "careReminder",
      JSON.stringify({
        options,
        customNotes,
        summaryMode,
        notifications,
        wateringTime,
        inAppMessages,
      })
    );
  }, [options, customNotes, summaryMode, notifications, wateringTime, inAppMessages]);

  const showStatus = (message) => {
    setStatus(message);
    window.clearTimeout(window.floranaCareStatusTimer);
    window.floranaCareStatusTimer = window.setTimeout(() => setStatus(""), 2600);
  };

  const sendNotification = () => {
    const messageText = `Time to water your plant (${wateringTime})`;

    if (notifications.push && Notification.permission === "granted") {
      new Notification("Plant Care Reminder", { body: messageText });
    }

    setInAppMessages((previous) => [{ id: Date.now(), text: messageText }, ...previous]);
    showStatus("Test reminder added.");
  };

  const scheduleNotification = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!options.watering) return;

    const now = new Date();
    const [hour, minute] = wateringTime.split(":").map(Number);
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target - now;

    timerRef.current = setTimeout(() => {
      sendNotification();
      scheduleNotification();
    }, delay);
  };

  useEffect(() => {
    scheduleNotification();
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [wateringTime, options.watering, notifications.push]);

  const toggleOption = (key) => {
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }));
    showStatus(`${key} reminder updated.`);
  };

  const toggleNotification = (type) => {
    setNotifications((previous) => ({ ...previous, [type]: !previous[type] }));
    showStatus(`${type} alerts updated.`);
  };

  const addCustomNote = () => {
    const trimmed = newCustomNote.trim();

    if (!trimmed) {
      showStatus("Add a note first.");
      return;
    }

    setCustomNotes((previous) => [trimmed, ...previous]);
    setNewCustomNote("");
    showStatus("Custom reminder added.");
  };

  const removeCustomNote = (index) => {
    setCustomNotes((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    showStatus("Custom reminder removed.");
  };

  const activeTasks = defaultOptions.filter((option) => options[option.key]).length + customNotes.length;

  return (
    <div className="care-page mobile-screen">
      <MenuPanel isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="care-shell mobile-frame">
        <div className="care-scroll mobile-panel">
          <LanguageSelector />

          <div className="care-topbar">
            <button className="back-btn" aria-label="Go back" onClick={() => navigate("/home")}>
              <ArrowLeft size={18} />
            </button>

            <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu size={18} />
            </button>
          </div>

          <div className="care-hero">
            <div className="care-hero-icon">
              <AlarmClock size={22} />
            </div>
            <p className="care-eyebrow">Plant schedule</p>
            <h2>Care Reminder</h2>
            <p className="care-subtitle">
              Keep watering and care tasks organized with a clean mobile planner that saves automatically.
            </p>

            <div className="summary-row">
              <span>Active tasks: {activeTasks}</span>
              <span>Mode: {summaryMode}</span>
            </div>
          </div>

          {status ? <div className="care-status">{status}</div> : null}

          <div className="care-section">
            <p className="section-title">Options</p>
            {defaultOptions.map((option) => (
              <div key={option.key} className="option-row">
                <div>
                  <p>{option.title}</p>
                  <small>{option.info}</small>
                </div>
                <button
                  onClick={() => toggleOption(option.key)}
                  className={`toggle-btn ${options[option.key] ? "on" : "off"}`}
                >
                  {options[option.key] ? "On" : "Off"}
                </button>
              </div>
            ))}
          </div>

          {options.watering ? (
            <div className="care-section">
              <p className="section-title">Watering Time</p>
              <div className="time-picker-row">
                <input type="time" value={wateringTime} onChange={(event) => setWateringTime(event.target.value)} />
              </div>
            </div>
          ) : null}

          <div className="care-section">
            <p className="section-title">Custom Notes</p>
            <div className="custom-input-row">
              <input
                placeholder="Add note"
                value={newCustomNote}
                onChange={(event) => setNewCustomNote(event.target.value)}
              />
              <button onClick={addCustomNote} aria-label="Add custom note">
                <Plus size={16} />
              </button>
            </div>

            {customNotes.map((note, index) => (
              <div key={`${note}-${index}`} className="custom-note-row">
                <span>{note}</span>
                <button onClick={() => removeCustomNote(index)} aria-label="Remove custom note">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="care-section">
            <p className="section-title">Summary</p>
            <div className="summary-buttons">
              <button
                className={`summary-btn ${summaryMode === "daily" ? "active" : ""}`}
                onClick={() => setSummaryMode("daily")}
              >
                Daily
              </button>
              <button
                className={`summary-btn ${summaryMode === "weekly" ? "active" : ""}`}
                onClick={() => setSummaryMode("weekly")}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="care-section">
            <p className="section-title">Notifications</p>
            <div className="option-row">
              <div>
                <p>Push Alerts</p>
                <small>Browser notification reminders.</small>
              </div>
              <button
                onClick={() => toggleNotification("push")}
                className={`toggle-btn ${notifications.push ? "on" : "off"}`}
              >
                {notifications.push ? "On" : "Off"}
              </button>
            </div>

            <div className="option-row">
              <div>
                <p>Email Alerts</p>
                <small>Save your email reminder preference.</small>
              </div>
              <button
                onClick={() => toggleNotification("email")}
                className={`toggle-btn ${notifications.email ? "on" : "off"}`}
              >
                {notifications.email ? "On" : "Off"}
              </button>
            </div>

            <button className="test-btn" onClick={sendNotification}>
              <BellRing size={16} />
              <span>Test Notification</span>
            </button>
          </div>

          {inAppMessages.length > 0 ? (
            <div className="care-section">
              <p className="section-title">Care Reminder Messages</p>
              <div className="in-app-messages">
                {inAppMessages.map((message) => (
                  <div key={message.id} className="message-box">
                    {message.text}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
