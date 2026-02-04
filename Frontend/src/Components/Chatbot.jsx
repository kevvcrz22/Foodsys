import { useState } from "react";
import "./Chatbot.css";
import avatar from "./Img/avatar.png"; // pon aquí la imagen

const Chatbot = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="chatbot-container">
      {/* VENTANA DE CHAT */}
      {open && (
        <div className="chatbot-box">
          <div className="chatbot-header">
            <span>Asistente Foodsys</span>
            <button onClick={() => setOpen(false)}>✖</button>
          </div>

          <div className="chatbot-messages">
            <p>👋 Hola, soy tu asistente virtual.</p>
            <p>¿En qué te ayudo hoy?</p>
          </div>

          <input
            className="chatbot-input"
            placeholder="Escribe tu mensaje..."
          />
        </div>
      )}

      {/* BOTÓN FLOTANTE */}
      <button className="chatbot-button" onClick={() => setOpen(!open)}>
        <img src={avatar} alt="Chatbot" />
      </button>
    </div>
  );
};

export default Chatbot;
