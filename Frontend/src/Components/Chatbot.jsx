import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Key, 
  Clock, 
  XCircle, 
  UtensilsCrossed, 
  Phone, 
  DollarSign, 
  Users, 
  Globe, 
  Unlock, 
  AlertTriangle, 
  UserPlus, 
  Moon, 
  AlarmClock,
  ClipboardCheck,
  Lightbulb,
  RotateCw,
  ArrowLeft,
  X,
  MessageCircle
} from "lucide-react";
import avatar from "./Img/avatar.png";

const preguntasFrecuentes = [
  { id: 1, text: "¿Qué es Foodsys?", Icon: Building2 },
  { id: 2, text: "¿Cómo inicio sesión?", Icon: Key },
  { id: 3, text: "Horarios de reserva", Icon: Clock },
  { id: 4, text: "Cancelar reserva", Icon: XCircle },
  { id: 5, text: "Tipos de comida", Icon: UtensilsCrossed },
  { id: 6, text: "Contactar soporte", Icon: Phone }
];

const preguntasEspecificas = {
  "¿Qué es Foodsys?": [
    { id: 11, text: "¿Es gratuito?", Icon: DollarSign },
    { id: 12, text: "¿Quién puede usarlo?", Icon: Users },
    { id: 13, text: "¿Dónde accedo?", Icon: Globe }
  ],
  "¿Cómo inicio sesión?": [
    { id: 21, text: "¿Olvidé contraseña?", Icon: Unlock },
    { id: 22, text: "Error al ingresar", Icon: AlertTriangle },
    { id: 23, text: "Primer acceso", Icon: UserPlus }
  ],
  "Horarios de reserva": [
    { id: 31, text: "¿Por qué hasta 6 PM?", Icon: Moon },
    { id: 32, text: "Horarios de comida", Icon: AlarmClock }
  ]
};

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [preguntasActuales, setPreguntasActuales] = useState(preguntasFrecuentes);
  const [showWelcome, setShowWelcome] = useState(true);
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState(new Set());
  const [historialNavegacion, setHistorialNavegacion] = useState([]);

  const messagesEndRef = useRef(null);

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
  }, [open, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, preguntasActuales]);

  const getRespuesta = (pregunta) => {
    const respuestas = {
      "¿Qué es Foodsys?":
        "Foodsys es el sistema de gestión alimentaria que permite reservar comidas con anticipación para optimizar recursos y reducir desperdicios. 🏫",

      "¿Cómo inicio sesión?":
        "Ingresa con tu documento y contraseña en la página de Foodsys. Si es tu primer acceso, ingresa tu número de documento como contraseña. 🔐",

      "Horarios de reserva":
        "Puedes reservar hasta las 6:00 PM para el día siguiente. Después de esta hora, el sistema se cierra para procesamiento. ⏰",

      "Cancelar reserva":
        "Sí, puedes cancelar antes de las 6:00 PM del día anterior sin penalización. Ve a 'Mis Reservas' para gestionar. ✅",

      "Tipos de comida":
        "Disponemos de: Desayuno (6-7 AM), Almuerzo (12-01:30 PM), Cena (6-7 PM). Cada comida incluye opciones balanceadas. 🍽️",

      "Contactar soporte":
        "📧 soportefootsies@cena.edu.co\n📞 (601) 546 1500 Ext. 123\n🏢 Oficina de Sistemas",

      "¿Es gratuito?":
        "Sí, completamente gratuito para todos los usuarios registrados. 💰",

      "¿Olvidé contraseña?":
        "Haz clic en '¿Olvidaste tu contraseña?' o contacta al administrador. 🔓",

      "¿Por qué hasta 6 PM?":
        "Para procesar reservas, planificar ingredientes y optimizar recursos de cocina. 🔧",

      "Error al ingresar":
        "1) Verifica tu conexión 2) Confirma tus datos 3) Intenta en otro navegador 4) Contacta soporte. 🔄",

      "¿Quién puede usarlo?":
        "Lo pueden usar los aprendices, personal del comedor y administradores. Cada usuario tiene permisos específicos según su rol.",

      "¿Dónde accedo?":
        "En la página principal de Foodsys con tu usuario.",

      "¿Primer acceso?":
        "Accede con tu documento y contraseña temporal (N°.Documento). Cambia tu contraseña en el primer ingreso.",

      "Horarios de comida":
        "🕐 Horarios exactos de servicio:\nDESAYUNO: 6:00 AM - 7:00 AM\nALMUERZO: 12:00 PM - 1:30 PM\nCENA: 6:00 PM - 7:00 PM\n⏱️ La puntualidad asegura la calidad del servicio."
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
        }
      }
    }, 800);
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]">
      {open && (
        <div className="bg-white/80 backdrop-blur-2xl rounded-[24px] shadow-[0_12px_40px_rgba(30,45,74,0.15)] border border-white/60 w-screen sm:w-[380px] h-screen sm:h-[540px] flex flex-col overflow-hidden fixed sm:relative bottom-0 right-0 sm:bottom-auto sm:right-auto animar-entrada">
          
          {/* ── Header (Liquid Glass) ── */}
          <div className="bg-gradient-to-r from-primario to-primario-oscuro p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img loading="lazy" decoding="async" 
                    src={avatar} 
                    className="w-10 h-10 rounded-full border-2 border-white/80 shadow-md object-cover bg-white" 
                    alt="Konnan" 
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-primario rounded-full"></span>
                </div>
                <div>
                  <div className="font-extrabold text-white text-[0.95rem]">Konnan</div>
                  <div className="text-white/80 text-[11px] font-semibold tracking-wide">Asistente Foodsys</div>
                </div>
              </div>
              <div className="flex gap-2">
                {historialNavegacion.length > 0 && (
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 active:scale-95"
                    onClick={handleVolverAtras}
                    title="Volver atrás"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 active:scale-95"
                  onClick={() => setOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Chat Body ── */}
          <div className="flex-1 bg-gradient-to-b from-fondo to-white/50 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animar-entrada`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 text-[0.8rem] font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-primario to-primario-oscuro text-white rounded-2xl rounded-br-sm shadow-md shadow-primario/20"
                      : "bg-white text-texto-principal rounded-2xl rounded-bl-sm shadow-sm border border-white/60"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Opciones Relacionadas */}
            {!showWelcome && preguntasActuales.length > 0 && (
              <div className="mt-5 space-y-3 animar-entrada">
                <div className="flex justify-center">
                  <span className="px-4 py-1.5 bg-acento/10 text-acento-oscuro rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 border border-acento/20">
                    <ClipboardCheck size={12} />
                    <span>Relacionadas</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {preguntasActuales.map((p) => (
                    <button
                      key={p.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-primario/20 bg-white/60 text-primario hover:bg-primario hover:text-white transition-all duration-300 text-[11px] font-bold shadow-sm"
                      onClick={() => handlePreguntaClick(p)}
                    >
                      <p.Icon size={14} className="flex-shrink-0" />
                      <span className="text-left flex-1 leading-tight">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Opciones de Bienvenida */}
            {showWelcome && (
              <div className="mt-4 space-y-3 animar-entrada">
                <div className="flex justify-center">
                  <span className="px-4 py-1.5 bg-acento/10 text-acento-oscuro rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 border border-acento/20">
                    <Lightbulb size={12} />
                    <span>¿Cómo ayudarte?</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {preguntasFrecuentes.map((p) => (
                    <button
                      key={p.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-primario/20 bg-white/60 text-primario hover:bg-primario hover:text-white transition-all duration-300 text-[11px] font-bold shadow-sm"
                      onClick={() => handlePreguntaClick(p)}
                    >
                      <p.Icon size={14} className="flex-shrink-0" />
                      <span className="text-left flex-1 leading-tight">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Indicador Escribiendo */}
            {isTyping && (
              <div className="flex items-center gap-2 text-texto-secundario text-[11px] font-semibold py-1">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-primario-suave rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primario-suave rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primario-suave rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span>Konnan está escribiendo...</span>
              </div>
            )}

            {/* Botón Reiniciar */}
            <div className="flex justify-center pt-3 pb-2">
              <button
                className="boton-secundario px-4 py-2 text-[10px] uppercase tracking-wider"
                onClick={resetChat}
              >
                <RotateCw size={12} />
                Nueva conversación
              </button>
            </div>

            <div ref={messagesEndRef}></div>
          </div>
        </div>
      )}

      {/* ── Botón Flotante ── */}
      {!open && (
        <button
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-primario to-primario-oscuro hover:shadow-primario/40 hover:-translate-y-1 transition-all duration-300 relative z-50 group border border-white/20"
          onClick={() => setOpen(true)}
        >
          <img src={avatar} loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover p-1 bg-white/10" alt="chat" />
          <div className="absolute -top-1 -right-1 bg-acento text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <MessageCircle size={12} />
          </div>
        </button>
      )}
    </div>
  );
};

export default Chatbot;