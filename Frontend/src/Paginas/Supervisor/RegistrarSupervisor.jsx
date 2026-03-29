import { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";
import apiAxios from "../../api/axiosConfig";
import { 
  UserPlus, 
  QrCode, 
  CheckCircle2, 
  Camera, 
  CameraOff,
  Clock,
  Users,
  CreditCard,
  Scan,
  XCircle
} from "lucide-react";

export default function Registrar() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [documentoManual, setDocumentoManual] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);

  // ── Contador de reservas canceladas (tiempo real) ──
  const [reservasCanceladas, setReservasCanceladas] = useState(0);
  const [cancelFlash, setCancelFlash] = useState(false);
  const prevCanceladasRef = useRef(0);

  const nombresAleatorios = [
    "María Gómez",
    "Carlos Ramírez",
    "Ana Martínez",
    "Juan Pérez",
    "Laura Torres",
    "Andrés López",
    "Sofía Herrera",
  ];

  const [registros, setRegistros] = useState([
    { nombre: "Kevin Steven Cruz Fierro", doc: "1107543987", hora: "12:15" },
    { nombre: "Diana Carolina Peña Rodriguez", doc: "1104701931", hora: "12:18" },
    { nombre: "Santiago Grijalba Cardenas", doc: "1109291696", hora: "12:22" },
  ]);

  // ── Polling: consulta /api/Reservas/canceladas/count cada 10 seg ──
  const fetchCanceladas = async () => {
    try {
      const { data } = await apiAxios.get("/api/Reservas/canceladas/count");
      const nuevo = data.total ?? 0;

      if (nuevo > prevCanceladasRef.current) {
        setCancelFlash(true);
        setTimeout(() => setCancelFlash(false), 800);
      }

      prevCanceladasRef.current = nuevo;
      setReservasCanceladas(nuevo);
    } catch (error) {
      console.error("Error obteniendo canceladas:", error);
    }
  };

  useEffect(() => {
    fetchCanceladas(); // carga inicial

    const intervalo = setInterval(fetchCanceladas, 10_000); // polling cada 10s
    return () => clearInterval(intervalo);
  }, []);

  // ── Cámara QR ──
  const activarCamara = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCamaraActiva(true);
      setEscaneando(true);
    } catch {
      alert("No se pudo acceder a la cámara");
    }
  };

  useEffect(() => {
    if (!camaraActiva) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    video.srcObject = streamRef.current;
    video.play();

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imageData.data, imageData.width, imageData.height);

        if (qr) {
          agregarRegistro(qr.data);
          detenerCamara();
        }
      }
    }, 300);

    return () => clearInterval(scanIntervalRef.current);
  }, [camaraActiva]);

  const detenerCamara = () => {
    clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCamaraActiva(false);
    setEscaneando(false);
  };

  const agregarRegistro = (doc) => {
    const hora = new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const nombre = nombresAleatorios[Math.floor(Math.random() * nombresAleatorios.length)];
    const nuevoRegistro = { nombre, doc, hora };
    setRegistros((prev) => [nuevoRegistro, ...prev]);
    setUltimoRegistro(nuevoRegistro);
    setTimeout(() => setUltimoRegistro(null), 3000);
  };

  const registrarManual = () => {
    if (!documentoManual.trim()) return;
    agregarRegistro(documentoManual);
    setDocumentoManual("");
  };

  return (
    <div className="min-h-screen lg:pl-64">
      <div className="w-full px-4 py-6">
        <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              *{font-family:'Inter',system-ui,-apple-system,sans-serif}
              @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
              @keyframes fadeIn{from{opacity:0}to{opacity:1}}
              @keyframes scan-line{0%,100%{transform:translateY(-100%)}50%{transform:translateY(100%)}}
              @keyframes cancelPulse{0%{background-color:#fef2f2}50%{background-color:#fee2e2}100%{background-color:#fef2f2}}
              @keyframes countUp{0%{transform:scale(1.3);color:#ef4444}100%{transform:scale(1);color:#111827}}
              .animate-slide-down{animation:slideDown .3s ease-out}
              .animate-fade-in{animation:fadeIn .4s ease-out}
              .scan-line{animation:scan-line 2s ease-in-out infinite}
              .cancel-flash{animation:cancelPulse .8s ease-in-out}
              .count-up{animation:countUp .5s ease-out}
              .custom-scrollbar::-webkit-scrollbar{width:5px}
              .custom-scrollbar::-webkit-scrollbar-track{background:#f3f4f6;border-radius:10px}
              .custom-scrollbar::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:10px}
              .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#9ca3af}
        `}</style>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-7 -mt-5">
            <h1 className="text-3xl font-bold text-gray-900 mb-1 text-center">
              Asistencia
            </h1>
          </div>

          {/* Main Cards Grid */}
          <div className="grid grid-cols-1 -mb-3 lg:grid-cols-3 gap-6">
            {/* Manual Registration Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg">
                  <UserPlus className="w-5 h-5 text-green-700" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Registro Manual</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Identificación
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-700" />
                    <input
                      type="text"
                      value={documentoManual}
                      onChange={(e) => setDocumentoManual(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && registrarManual()}
                      placeholder="1234567890"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={registrarManual}
                  className="w-full bg-[#22c55e] hover:bg-[#08A645] text-white py-[10px] rounded-[10px] font-medium transition-colors flex items-center justify-center gap-[10px]">
                  <UserPlus className="w-4 h-4" />
                  Registrar Aprendiz
                </button>
              </div>
            </div>

            {/* QR Scanner Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <QrCode className="w-5 h-5 text-green-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Escáner QR</h2>
                </div>
                {escaneando && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-600">Activo</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-square">
                  {!camaraActiva ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-12 h-12 mb-3" />
                      <p className="text-sm font-medium">Cámara desactivada</p>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-8 border-2 border-green-500 rounded-lg"></div>
                        <div className="absolute inset-8 overflow-hidden rounded-lg">
                          <div className="scan-line absolute inset-x-0 h-px bg-blue-400 opacity-75"></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!camaraActiva ? (
                  <button
                    onClick={activarCamara}
                    className="w-full bg-[#22c55e] hover:bg-[#08A645] text-white py-[10px] rounded-[10px] font-medium transition-colors flex items-center justify-center gap-[10px]">
                    <Scan className="w-4 h-4" />
                    Activar Escáner
                  </button>
                ) : (
                  <button
                    onClick={detenerCamara}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <CameraOff className="w-4 h-4 text-red-500" />
                    Detener Cámara
                  </button>
                )}
              </div>
            </div>

            {/* Registry List Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg hover:shadow-2xl transition-shadow flex flex-col h-full max-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Registros</h2>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Aprendices registrados hoy
              </p>

              <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {registros.map((item, index) => (
                  <div
                    key={index}
                    className="bg-green-50 rounded-lg p-3 border border-green-400 hover:border-green-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.nombre}</p>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-green-700" />
                          {item.doc}
                        </p>
                      </div>
                      <div className="flex-shrink-0 px-2.5 py-1 bg-blue-50 rounded border border-blue-200">
                        <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-green-700" />
                          {item.hora}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Stats — 4 columnas */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 🔴 Reservas Canceladas — contador real desde BD */}
            <div className={`bg-white rounded-lg border border-red-200 p-4 shadow-lg hover:shadow-2xl transition-shadow ${cancelFlash ? "cancel-flash" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p key={reservasCanceladas} className="text-2xl font-bold text-gray-900 count-up">
                    {reservasCanceladas}
                  </p>
                  <p className="text-xs text-gray-500">Reservas Canceladas</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-400 font-medium">En tiempo real</span>
              </div>
            </div>

            {/* Total Registrados */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
                  <p className="text-xs text-gray-500">Total Registrados</p>
                </div>
              </div>
            </div>

            {/* Tasa de Éxito */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-xs text-gray-500">Tasa de Éxito</p>
                </div>
              </div>
            </div>

            {/* Hora Actual */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500">Hora Actual</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success notification */}
        {ultimoRegistro && (
          <div className="mt-4 px-4 animate-slide-down">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Registro exitoso</p>
                  <p className="text-sm text-green-700">
                    {ultimoRegistro.nombre} • {ultimoRegistro.doc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}