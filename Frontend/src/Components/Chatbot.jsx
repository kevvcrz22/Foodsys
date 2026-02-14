import { useState, useEffect, useRef } from "react";
import avatar from "./Img/avatar.png";
// Importar Bootstrap Icons CSS en tu index.html o App.js:
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

const preguntasFrecuentes = [
  { id: 1, text: "¿Qué es Foodsys?", icon: "bi-building" },
  { id: 2, text: "¿Cómo inicio sesión?", icon: "bi-key-fill" },
  { id: 3, text: "Horarios de reserva", icon: "bi-clock-fill" },
  { id: 4, text: "Cancelar reserva", icon: "bi-x-circle-fill" },
  { id: 5, text: "Tipos de comida", icon: "bi-egg-fried" },
  { id: 6, text: "Contactar soporte", icon: "bi-telephone-fill" }
];

const preguntasEspecificas = {
  "¿Qué es Foodsys?": [
    { id: 11, text: "¿Es gratuito?", icon: "bi-currency-dollar" },
    { id: 12, text: "¿Quién puede usarlo?", icon: "bi-people-fill" },
    { id: 13, text: "¿Dónde accedo?", icon: "bi-globe" }
  ],
  "¿Cómo inicio sesión?": [
    { id: 21, text: "¿Olvidé contraseña?", icon: "bi-unlock-fill" },
    { id: 22, text: "Error al ingresar", icon: "bi-exclamation-triangle-fill" },
    { id: 23, text: "Primer acceso", icon: "bi-person-plus-fill" }
  ],
  "Horarios de reserva": [
    { id: 31, text: "¿Por qué hasta 6 PM?", icon: "bi-moon-stars-fill" },
    { id: 32, text: "Horarios de comida", icon: "bi-alarm-fill" }
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
    setHistorialNavegacion(prev => [...prev, pregunta.text]);
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
        setPreguntasActuales(preguntasEspecificas[pregunta.text]);
      } else {
        const preguntasDisponibles = preguntasFrecuentes.filter(p => 
          !preguntasSeleccionadas.has(p.text) && p.text !== pregunta.text
        );
        
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
      const nuevoHistorial = [...historialNavegacion];
      nuevoHistorial.pop();
      
      const preguntaAnterior = nuevoHistorial[nuevoHistorial.length - 1];
      setHistorialNavegacion(nuevoHistorial);
      
      if (preguntasEspecificas[preguntaAnterior]) {
        setPreguntasActuales(preguntasEspecificas[preguntaAnterior]);
      } else {
        const preguntasDisponibles = preguntasFrecuentes.filter(p => 
          !preguntasSeleccionadas.has(p.text) || p.text === preguntaAnterior
        );
        setPreguntasActuales(preguntasDisponibles);
      }
    } else {
      setPreguntasActuales(preguntasFrecuentes);
      setPreguntasSeleccionadas(new Set());
      setHistorialNavegacion([]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl w-screen sm:w-[360px] h-screen sm:h-[500px] flex flex-col overflow-hidden fixed sm:relative bottom-0 right-0 sm:bottom-auto sm:right-auto">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img 
                    src={avatar} 
                    className="w-9 h-9 rounded-full border-2 border-white shadow-md" 
                    alt="Konnan" 
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white border-2 border-green-500 rounded-full"></span>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Konnan</div>
                  <div className="text-white/90 text-[11px]">Asistente Foodsys</div>
                </div>
              </div>
              <div className="flex gap-1">
                {historialNavegacion.length > 0 && (
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 active:scale-95"
                    onClick={handleVolverAtras}
                    title="Volver atrás"
                  >
                    <i className="bi bi-arrow-left text-xs"></i>
                  </button>
                )}
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 active:scale-95"
                  onClick={() => setOpen(false)}
                >
                  <i className="bi bi-x-lg text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 bg-gradient-to-b from-green-50/30 to-white overflow-y-auto p-3 space-y-2.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-green-500 text-white rounded-2xl rounded-br-sm shadow-sm"
                      : "bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Preguntas relacionadas */}
            {!showWelcome && preguntasActuales.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium inline-flex items-center gap-1">
                    <i className="bi bi-clipboard-check text-xs"></i>
                    <span>Relacionadas</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {preguntasActuales.map((p) => (
                    <button
                      key={p.id}
                      className="flex items-center gap-1.5 p-2 rounded-lg border-2 border-green-500 bg-green-500 text-white hover:bg-green-600 transition-all duration-200 text-[10px] font-medium active:scale-95 shadow-sm"
                      onClick={() => handlePreguntaClick(p)}
                    >
                      <i className={`${p.icon} text-xs flex-shrink-0`}></i>
                      <span className="text-left flex-1 leading-tight">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preguntas de bienvenida */}
            {showWelcome && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium inline-flex items-center gap-1">
                    <i className="bi bi-lightbulb-fill text-xs"></i>
                    <span>¿Cómo ayudarte?</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {preguntasFrecuentes.map((p) => (
                    <button
                      key={p.id}
                      className="flex items-center gap-1.5 p-2 rounded-lg border-2 border-green-500 bg-green-500 text-white hover:bg-green-600 transition-all duration-200 text-[10px] font-medium active:scale-95 shadow-sm"
                      onClick={() => handlePreguntaClick(p)}
                    >
                      <i className={`${p.icon} text-xs flex-shrink-0`}></i>
                      <span className="text-left flex-1 leading-tight">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span>Konnan está escribiendo...</span>
              </div>
            )}

            {/* Botón reset */}
            <div className="flex justify-center pt-2">
              <button
                className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-medium hover:bg-blue-600 transition-all duration-200 active:scale-95 shadow-sm inline-flex items-center gap-1.5"
                onClick={resetChat}
              >
                <i className="bi bi-arrow-clockwise text-xs"></i>
                Nueva conversación
              </button>
            </div>

            <div ref={messagesEndRef}></div>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      {!open && (
        <button
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center bg-green-500 hover:bg-green-600 transition-all duration-300 active:scale-95 animate-pulse-soft relative"
          onClick={() => setOpen(true)}
        >
          <img src={avatar} className="w-full h-full rounded-full" alt="chat" />
          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold animate-bounce">
            <i className="bi bi-chat-dots-fill"></i>
          </div>
        </button>
      )}

      {/* Estilos adicionales */}
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          50% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 5px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
