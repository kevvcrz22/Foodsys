import { useState, useEffect, useRef } from "react";
import avatar from "./Img/avatar.png";

const preguntasFrecuentes = [
  { id: 1, text: "¿Qué es Foodsys?", icon: "🏢" },
  { id: 2, text: "¿Cómo inicio sesión?", icon: "🔑" },
  { id: 3, text: "Horarios de reserva", icon: "⏰" },
  { id: 4, text: "Cancelar reserva", icon: "❌" },
  { id: 5, text: "Tipos de comida", icon: "🍽️" },
  { id: 6, text: "Contactar soporte", icon: "📞" }
];

const preguntasEspecificas = {
  "¿Qué es Foodsys?": [
    { id: 11, text: "¿Es gratuito?", icon: "💰" },
    { id: 12, text: "¿Quién puede usarlo?", icon: "👥" },
    { id: 13, text: "¿Dónde accedo?", icon: "🌐" }
  ],
  "¿Cómo inicio sesión?": [
    { id: 21, text: "¿Olvidé contraseña?", icon: "🔓" },
    { id: 22, text: "Error al ingresar", icon: "⚠️" },
    { id: 23, text: "Primer acceso", icon: "🆕" }
  ],
  "Horarios de reserva": [
    { id: 31, text: "¿Por qué hasta 6 PM?", icon: "🌙" },
    { id: 32, text: "Horarios de comida", icon: "🕐" }
  ]
};

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [preguntasActuales, setPreguntasActuales] = useState(preguntasFrecuentes);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState(new Set());
  const [historialNavegacion, setHistorialNavegacion] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            text: "¡Hola! Soy Konnan, tu asistente de Foodsys. 👋",
            sender: "bot",
            id: Date.now()
          }
        ]);
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, preguntasActuales]);

  const getRespuesta = (pregunta) => {
    const respuestas = {
      "¿Qué es Foodsys?":
        "Foodsys es el sistema de gestión alimentaria del SENA que permite reservar comidas con anticipación para optimizar recursos y reducir desperdicios. 🏫",

      "¿Cómo inicio sesión?":
        "Ingresa con tu documento y contraseña en la página de Foodsys. Si es tu primer acceso, ingresa tu numero de documento como contraseña. 🔐",

      "Horarios de reserva":
        "Puedes reservar hasta las 6:00 PM para el día siguiente. Después de esta hora, el sistema se cierra para procesamiento. ⏰",

      "Cancelar reserva":
        "Sí, puedes cancelar antes de las 6:00 PM del día anterior sin penalización. Ve a 'Mis Reservas' para gestionar. ✅",

      "Tipos de comida":
        "Disponemos de: Desayuno (6-7 AM), Almuerzo (12-01:30 PM), Cena (6-7 PM). Cada comida incluye opciones balanceadas. 🍽️",

      "Contactar soporte":
        "📧 soporte.foodsys@sena.edu.co\n📞 (601) 546 1500 Ext. 123\n🏢 Oficina de Sistemas - Centro SENA",

      "¿Es gratuito?":
        "Sí, completamente gratuito para todos los aprendices y funcionarios del SENA. 💰",

      "¿Olvidé contraseña?":
        "Haz clic en '¿Olvidaste tu contraseña?' o contacta al administrador. 🔓",

      "¿Por qué hasta 6 PM?":
        "Para procesar reservas, planificar ingredientes y optimizar recursos de cocina. 🔧",

      "Error al ingresar":
        "1) Verifica tu conexión 2) Confirma tus datos 3) Intenta en otro navegador 4) Contacta soporte. 🔄",

      "¿Quién puede usarlo?":
        "Lo pueden usar los aprendices, personal del casino y administradores cada usuario tiene permisos especifics segun su rol",

      "¿Dónde accedo?":
        "En la pagina de foodsys con tu usuario",

      "¿Primer acceso?":
        "Accede con documento y contraseña temporal(N°.Documento) cambia contraseña en primer ingreso",

      "Horarios de comida":
        "🕐 Horarios exactos de servicio: DESAYUNO Servicio: 6:00 AM - 7:00 AM ALMUERZO Servicio 12:00 PM - 1:30 PM CENA Servicio: 6:00 PM - 7:00 PM ⏱️ Puntualidad asegura calidad del servicio"
    };

    return (
      respuestas[pregunta] ||
      "Entiendo tu pregunta. Te recomiendo seleccionar una de las opciones disponibles para una respuesta más precisa. 🤔"
    );
  };

  const handlePreguntaClick = (pregunta) => {
    // Agregar pregunta al historial
    setHistorialNavegacion(prev => [...prev, pregunta.text]);
    
    // Marcar pregunta como seleccionada
    setPreguntasSeleccionadas(prev => new Set(prev).add(pregunta.text));
    
    setMessages((prev) => [
      ...prev,
      { text: pregunta.text, sender: "user", id: Date.now() }
    ]);

    setShowWelcome(false);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: getRespuesta(pregunta.text),
          sender: "bot",
          id: Date.now()
        }
      ]);

      setIsTyping(false);

      if (preguntasEspecificas[pregunta.text]) {
        // Mostrar preguntas específicas de esta categoría
        setPreguntasActuales(preguntasEspecificas[pregunta.text]);
      } else {
        // Filtrar preguntas ya seleccionadas de las preguntas frecuentes
        const preguntasDisponibles = preguntasFrecuentes.filter(p => 
          !preguntasSeleccionadas.has(p.text) && p.text !== pregunta.text
        );
        
        // Si hay preguntas específicas para esta pregunta, mostrarlas
        // sino, mostrar las preguntas frecuentes restantes
        if (preguntasDisponibles.length > 0) {
          setPreguntasActuales(preguntasDisponibles);
        } else {
          setShowReset(true);
        }
      }
    }, 800);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setMessages((prev) => [
      ...prev,
      { text, sender: "user", id: Date.now() }
    ]);

    setInputText("");
    setIsTyping(true);
    setShowWelcome(false);

    setTimeout(() => {
      let respuesta =
        "Gracias por tu mensaje. Para ayudarte mejor, ¿podrías seleccionar una de las opciones disponibles?";

      if (text.toLowerCase().includes("hola")) {
        respuesta =
          "¡Hola! 👋 ¿En qué puedo ayudarte hoy? Selecciona una opción o escribe tu pregunta.";
      } else if (text.toLowerCase().includes("gracias")) {
        respuesta =
          "¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?";
      }

      setMessages((prev) => [
        ...prev,
        { text: respuesta, sender: "bot", id: Date.now() }
      ]);

      setIsTyping(false);
      setShowReset(true);
    }, 1000);
  };

  const resetChat = () => {
    setMessages([
      {
        text: "¡Hola de nuevo! 👋 He reiniciado la conversación. ¿En qué puedo ayudarte?",
        sender: "bot",
        id: Date.now()
      }
    ]);
    setPreguntasActuales(preguntasFrecuentes);
    setShowWelcome(true);
    setShowReset(false);
    setPreguntasSeleccionadas(new Set());
    setHistorialNavegacion([]);
  };

  const handleVolverAtras = () => {
    if (historialNavegacion.length > 1) {
      // Remover el último elemento
      const nuevoHistorial = [...historialNavegacion];
      nuevoHistorial.pop();
      
      // Obtener la última pregunta seleccionada
      const preguntaAnterior = nuevoHistorial[nuevoHistorial.length - 1];
      
      // Actualizar historial
      setHistorialNavegacion(nuevoHistorial);
      
      // Si la pregunta anterior tiene preguntas específicas, mostrarlas
      if (preguntasEspecificas[preguntaAnterior]) {
        setPreguntasActuales(preguntasEspecificas[preguntaAnterior]);
      } else {
        // Mostrar preguntas frecuentes excepto las ya seleccionadas
        const preguntasDisponibles = preguntasFrecuentes.filter(p => 
          !preguntasSeleccionadas.has(p.text) || p.text === preguntaAnterior
        );
        setPreguntasActuales(preguntasDisponibles);
      }
    } else {
      // Volver al inicio
      setPreguntasActuales(preguntasFrecuentes);
      setPreguntasSeleccionadas(new Set());
      setHistorialNavegacion([]);
    }
  };

  return (
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1055 }}>
      {open && (
        <div className="card shadow-lg border-0 p-2" style={{ 
          width: "320px", 
          height: "340px",
          borderRadius: "10px",
        }}>
          
          {/* Header mejorado */}
          <div className="card-header border-0 py-100" style={{ 
            backgroundColor: "#42b72a",
            background: "linear-gradient(135deg, #42b72a 0%, #36a420 100%)"
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="position-relative">
                  <img src={avatar} width="42" className="rounded-circle border border-0 border-white" alt="K" />
                  <span className="position-absolute bottom-0 end-0 translate-middle p-1 bg-white border border-2 border-success rounded-circle">
                    <span className="visually-hidden">Online</span>
                  </span>
                </div>
                <div>
                  <div className="fw-bold text-white">Konnan</div>
                  <div className="text-white-80 small">Asistente Foodsys</div>
                </div>
              </div>
              <div className="d-flex gap-2">
                {historialNavegacion.length > 0 && (
                  <button
                    className="btn btn-sm btn-outline-light rounded-circle"
                    onClick={handleVolverAtras}
                    style={{ width: "32px", height: "32px" }}
                    title="Volver atrás"
                  >
                    ←
                  </button>
                )}
                <button
                  className="btn btn-sm btn-outline-light rounded-circle"
                  onClick={() => setOpen(false)}
                  style={{ width: "32px", height: "32px" }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Contenido del chat */}
          <div className="card-body p-0" style={{ 
            backgroundColor: "#f8fff8",
            height: "280px",
            overflow: "hidden"
          }}>
            <div className="h-100 overflow-auto p-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-1 ${msg.sender === "user" ? "text-end" : ""}`}
                >
                  <div
                    className={`d-inline-block px-2 py-1 ${msg.sender === "user"
                        ? "text-white"
                        : "bg-white border"
                      }`}
                    style={{ 
                      maxWidth: "80%",
                      fontSize:"13px",
                      lineHeight: "1.3", 
                      borderRadius: msg.sender === "user" 
                        ? "14px 14px 4px 14px" 
                        : "14px 14px 14px 4px",
                      backgroundColor: msg.sender === "user" ? "#42b72a" : "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Mostrar preguntas disponibles */}
              {!showWelcome && preguntasActuales.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3">
                    <span className="badge px-3 py-2" style={{ 
                      backgroundColor: "rgba(66, 183, 42, 0.1)", 
                      color: "#42b72a",
                      fontWeight: "600",
                      fontSize: "0.85rem"
                    }}>
                      📋 Preguntas relacionadas
                    </span>
                  </div>
                  <div className="row g-2">
                    {preguntasActuales.map((p) => (
                      <div key={p.id} className="col-6">
                        <button
                          className="btn btn-sm w-100 d-flex align-items-center gap-2 p-2"
                          onClick={() => handlePreguntaClick(p)}
                          style={{ 
                            borderRadius: "10px",
                            border: "2px solid #42b72a",
                            backgroundColor: "white",
                            color: "#42b72a",
                            transition: "all 0.3s",
                            fontSize: "0.8rem"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#42b72a";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.color = "#42b72a";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <span style={{ fontSize: "1.1rem" }}>{p.icon}</span>
                          <span className="text-start">{p.text}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showWelcome && (
                <div className="mt-3">
                  <div className="mb-3 text-center">
                    <span className="badge px-3 py-2" style={{ 
                      backgroundColor: "rgba(66, 183, 42, 0.1)", 
                      color: "#42b72a",
                      fontWeight: "600",
                      fontSize: "0.85rem"
                    }}>
                      💡 ¿En qué puedo ayudarte?
                    </span>
                  </div>
                  <div className="row g-2">
                    {preguntasFrecuentes.map((p) => (
                      <div key={p.id} className="col-6">
                        <button
                          className="btn btn-sm w-100 d-flex align-items-center gap-2 p-2"
                          onClick={() => handlePreguntaClick(p)}
                          style={{ 
                            borderRadius: "10px",
                            border: "2px solid #42b72a",
                            backgroundColor: "white",
                            color: "#42b72a",
                            transition: "all 0.3s",
                            fontSize: "0.8rem"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#42b72a";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.color = "#42b72a";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <span style={{ fontSize: "1.1rem" }}>{p.icon}</span>
                          <span className="text-start">{p.text}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showReset && (
                <div className="text-center mt-4">
                  
                </div>
              )}

              {isTyping && (
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <div className="d-flex gap-1">
                    <div style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%",
                      backgroundColor: "#42b72a",
                      animation: "bounce 1.4s infinite"
                    }}></div>
                    <div style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%",
                      backgroundColor: "#42b72a",
                      animation: "bounce 1.4s infinite 0.2s"
                    }}></div>
                    <div style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%",
                      backgroundColor: "#42b72a",
                      animation: "bounce 1.4s infinite 0.4s"
                    }}></div>
                  </div>
                  <span>Konnan está escribiendo...</span>
                </div>
                
              )}
              <div className="text-center my-2">

              <button
                className="btn"
                onClick={resetChat}
                style={{ 
                  padding: "4px 10px",        // ⬅️ más pequeño
                  fontSize: "12px",           // ⬅️ clave para reducir tamaño
                  borderRadius: "8px",
                  backgroundColor: "#42b72a",
                  color: "white",
                  border: "none",
                  fontWeight: "400",
                  lineHeight: "1.2",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  transition: "all 0.2s ease",
                  display: "inline-block"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#36a420";
                  e.currentTarget.style.transform = "scale(1.03)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#42b72a";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                🔄 Nueva conversación
              </button>
              </div>

              <div ref={messagesEndRef}></div>
            </div>
          </div>

          {/* Input */}
          
        </div>
      )}

      {/* Botón flotante */}
      {!open && (
        <button
          className="btn rounded-circle shadow-lg d-flex align-items-center justify-content-center"
          style={{ 
            width: "65px", 
            height: "65px",
            backgroundColor: "#42b72a",
            border: "none",
            animation: "pulse 2s infinite"
          }}
          onClick={() => setOpen(true)}
        >
          <img src={avatar} width="65" alt="chat" className="rounded-circle" />
         
        </button>
      )}

      {/* Estilos CSS */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(66, 183, 42, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(66, 183, 42, 0); }
          100% { box-shadow: 0 0 0 0 rgba(66, 183, 42, 0); }
        }
        
        .text-white-80 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .btn:focus {
          box-shadow: 0 0 0 0.25rem rgba(66, 183, 42, 0.25) !important;
        }
        
        .form-control:focus {
          border-color: #42b72a;
          box-shadow: 0 0 0 0.25rem rgba(66, 183, 42, 0.25);
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #42b72a;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #36a420;
        }
      `}</style>
    </div>
  );
};

export default Chatbot;