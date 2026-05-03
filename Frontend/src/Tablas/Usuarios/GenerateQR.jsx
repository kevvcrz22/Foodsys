import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import apiAxios from "../../api/axiosConfig";
import CryptoJS from "crypto-js";
import {
  CalendarCheck, Loader2, ChefHat, Check, Clock, AlertCircle, CheckCircle2,
  UtensilsCrossed, CalendarDays, User, CreditCard, Sun, Sunrise, Moon
} from "lucide-react";

// Encriptación
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "clave_por_defecto_cambiar";
const encriptar = (objeto) => CryptoJS.AES.encrypt(JSON.stringify(objeto), ENCRYPTION_KEY).toString();

// Fechas
const getFechaMañana = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatFechaCorta = (fechaStr) => {
  if (!fechaStr) return "–";
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "2-digit"
  });
};

const VENCIMIENTO_HORAS = { Desayuno: 7, Almuerzo: 14, Cena: 19 };
const LABEL_VENCIMIENTO = { Desayuno: "7:00 a.m.", Almuerzo: "2:00 p.m.", Cena: "7:00 p.m." };

const calcularVencimiento = (fechaStr, tipo) => {
  if (!fechaStr || !tipo) return null;
  const hora = VENCIMIENTO_HORAS[tipo];
  if (hora === undefined) return null;
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hora, 0, 0));
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Modal QR unificado (mismo diseño que en ReservaForm) ─────────────────
const QRModal = ({ isOpen, onClose, reserva, usuario }) => {
  if (!isOpen || !reserva) return null;
  const esActiva = reserva.Est_Reserva === "Generada";
  const nombre = usuario?.Nom_Usuario || usuario?.nombre || "";
  const apellido = usuario?.Ape_Usuario || "";
  const nombreCompleto = `${nombre} ${apellido}`.trim();
  const IconoComida = reserva.Tipo === "Desayuno" ? Sunrise : reserva.Tipo === "Almuerzo" ? Sun : Moon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-800">Código QR</h2>
          <p className="text-sm text-gray-400">Reserva #{reserva.Id_Reserva}</p>
        </div>
        <div className="px-6 py-2">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-green-600" />
              <span className="text-base font-semibold text-gray-800">{nombreCompleto}</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{usuario?.NumDoc_Usuario || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <IconoComida className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">{reserva.Tipo}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {formatFechaCorta(reserva.Fec_Reserva)} · Vence {LABEL_VENCIMIENTO[reserva.Tipo]}
              </span>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                esActiva ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              }`}>
                {reserva.Est_Reserva}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-center p-6">
          <div className={`p-3 rounded-2xl border-2 ${esActiva ? "border-green-200 bg-white" : "border-gray-200 bg-gray-50 opacity-60"}`}>
            {reserva.Tex_Qr ? (
              <QRCodeCanvas value={reserva.Tex_Qr} size={200} level="H" fgColor={esActiva ? "#000" : "#6b7280"} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">Sin código QR</div>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Card de plato (similar a ReservaForm) ──────────────────────────────
const PlatoCard = ({ plato, seleccionado, onSeleccionar }) => {
  const imgSrc = plato.Img_Plato ? `${API_URL}/uploads/${plato.Img_Plato}` : null;
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(seleccionado ? null : plato.Id_Plato)}
      className={`relative rounded-2xl overflow-hidden border-2 text-left w-full transition-all ${
        seleccionado ? "border-green-500 shadow-md" : "border-gray-200 hover:border-green-300"
      }`}
    >
      <div className="relative h-28 bg-gray-100">
        {imgSrc ? (
          <img src={imgSrc} alt={plato.Nom_Plato} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-gray-300" /></div>
        )}
        {seleccionado && (
          <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
            <div className="bg-green-500 rounded-full p-1.5"><Check className="w-4 h-4 text-white" /></div>
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Desayuno</span>
      </div>
      <div className={`px-3 py-2.5 ${seleccionado ? "bg-green-50" : "bg-white"}`}>
        <p className={`text-sm font-bold ${seleccionado ? "text-green-700" : "text-gray-800"}`}>{plato.Nom_Plato}</p>
        <p className="text-[11px] text-gray-400 line-clamp-2">{plato.Des_Plato || "Sin descripción"}</p>
      </div>
    </button>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────
const GenerateQR = () => {
  const [usuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem("usuario")) || null; } catch { return null; }
  });

  const rolActivo = (localStorage.getItem("rolActivo") || "").trim();
  const puedeGenerarQR = ["Aprendiz Interno", "Aprendiz Externo", "Pasante"].includes(rolActivo.toLowerCase());
  const userId = usuario?.Id_Usuario || usuario?.id;
  const fechaMañana = getFechaMañana();
  const tipo = "Desayuno"; // Fijo para este componente

  const [platos, setPlatos] = useState([]);
  const [loadingPlatos, setLoadingPlatos] = useState(false);
  const [platoElegido, setPlatoElegido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [yaReservado, setYaReservado] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [reservaParaQR, setReservaParaQR] = useState(null);

  // Cargar platos de desayuno para mañana
  useEffect(() => {
    if (!puedeGenerarQR) return;
    const fetchPlatos = async () => {
      setLoadingPlatos(true);
      setPlatoElegido(null);
      setResultado(null);
      setYaReservado(false);
      try {
        const { data } = await apiAxios.get("/api/Menu");
        const filtrados = data.filter((m) => m.Fec_Menu === fechaMañana && m.Tip_Menu === tipo);
        const platosArr = filtrados.map((m) => m.plato).filter(Boolean);
        const unique = Array.from(new Map(platosArr.map(p => [p.Id_Plato, p])).values());
        setPlatos(unique);
      } catch (err) {
        console.error("Error cargando platos", err);
      } finally {
        setLoadingPlatos(false);
      }
    };
    fetchPlatos();
  }, [fechaMañana, puedeGenerarQR]);

  const platoSeleccionadoObj = platos.find(p => p.Id_Plato === platoElegido);

  const handleGenerarQR = async () => {
    if (!usuario) {
      setResultado({ ok: false, mensaje: "No hay usuario autenticado." });
      return;
    }
    if (!platoElegido) {
      setResultado({ ok: false, mensaje: "Debes seleccionar un plato." });
      return;
    }

    setEnviando(true);
    setResultado(null);

    try {
      // Verificar disponibilidad
      const { data: dispData } = await apiAxios.get("/api/Reservas/disponibilidad", {
        params: { fecha: fechaMañana, tipo, usuario: userId },
      });

      if (!dispData.disponible) {
        setYaReservado(true);
        setResultado({ ok: false, mensaje: `Ya tienes una reserva de ${tipo.toLowerCase()} para mañana.` });
        setEnviando(false);
        return;
      }

      const vencimiento = calcularVencimiento(fechaMañana, tipo);

      // Construir payload completo para el QR
      const qrPayload = {
        Id_Usuario: userId,
        Nom_Usuario: usuario.Nom_Usuario || usuario.nombre || "",
        Ape_Usuario: usuario.Ape_Usuario || "",
        NumDoc: usuario.NumDoc_Usuario || "",
        TipDoc: usuario.TipDoc_Usuario || "",
        RolActivo: rolActivo,
        Tipo: tipo,
        Fec_Reserva: fechaMañana,
        Id_Plato: platoElegido,
        Nom_Plato: platoSeleccionadoObj?.Nom_Plato || "",
        Vencimiento: vencimiento?.toISOString(),
        Timestamp: new Date().toISOString(),
      };

      const qrCifrado = encriptar(qrPayload);

      // Crear la reserva en el backend
      const { data } = await apiAxios.post("/api/Reservas", {
        Id_Usuario: userId,
        Fec_Reserva: fechaMañana,
        Tipo: tipo,
        Est_Reserva: "Generada",
        Vencimiento: vencimiento,
        Tex_Qr: qrCifrado,
        Id_Plato: platoElegido,
      });

      setResultado({ ok: true, mensaje: "¡Reserva creada exitosamente!" });
      setYaReservado(true);

      // Mostrar el QR generado
      setReservaParaQR({
        ...data.reserva,
        Tipo: tipo,
        Fec_Reserva: fechaMañana,
        Tex_Qr: qrCifrado,
        Est_Reserva: "Generada"
      });
      setIsQRModalOpen(true);

    } catch (err) {
      const msg = err.response?.data?.message || "Error al generar la reserva.";
      setResultado({ ok: false, mensaje: msg });
    } finally {
      setEnviando(false);
    }
  };

  if (!puedeGenerarQR) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No tienes permiso para generar QR de beneficio.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Generar QR de Desayuno</h2>
                <p className="text-green-100 text-sm">Para mañana {formatFechaCorta(fechaMañana)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Aviso */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3">
              <span>📌</span>
              <p className="text-blue-800 text-xs">
                Puedes generar tu QR hasta las <strong>6:30 p.m.</strong> del día anterior.
              </p>
            </div>

            {/* Selección de plato */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-green-600" /> Selecciona tu plato de desayuno
              </label>

              {loadingPlatos && (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
                  <p className="text-sm text-gray-400 mt-2">Cargando menú...</p>
                </div>
              )}

              {!loadingPlatos && platos.length === 0 && (
                <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                  <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay menú disponible para mañana</p>
                </div>
              )}

              {!loadingPlatos && platos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {platos.map(p => (
                    <PlatoCard
                      key={p.Id_Plato}
                      plato={p}
                      seleccionado={platoElegido === p.Id_Plato}
                      onSeleccionar={setPlatoElegido}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mensajes de resultado */}
            {resultado && (
              <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 border ${
                resultado.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {resultado.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                <p>{resultado.mensaje}</p>
              </div>
            )}

            {/* Botón de generar */}
            <button
              onClick={handleGenerarQR}
              disabled={enviando || yaReservado || !platoElegido || loadingPlatos}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                enviando || yaReservado || !platoElegido || loadingPlatos
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md active:scale-95"
              }`}
            >
              {enviando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando reserva...
                </>
              ) : yaReservado ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Reserva lista
                </>
              ) : !platoElegido ? (
                "Selecciona un plato"
              ) : (
                "Generar QR para mañana"
              )}
            </button>

            {/* Resumen previo (cuando hay plato seleccionado) */}
            {platoElegido && platoSeleccionadoObj && !yaReservado && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Resumen de tu reserva</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Fecha:</span> {formatFechaCorta(fechaMañana)}</p>
                  <p><span className="font-medium">Tipo:</span> Desayuno</p>
                  <p><span className="font-medium">Plato:</span> {platoSeleccionadoObj.Nom_Plato}</p>
                  <p><span className="font-medium">Aprendiz:</span> {usuario?.Nom_Usuario} {usuario?.Ape_Usuario}</p>
                  <p><span className="font-medium">Vence:</span> mañana a las {LABEL_VENCIMIENTO.Desayuno}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal QR */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        reserva={reservaParaQR}
        usuario={usuario}
      />
    </div>
  );
};

export default GenerateQR;