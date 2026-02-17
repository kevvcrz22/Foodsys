import { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";
import { 
  UserPlus, 
  QrCode, 
  CheckCircle2, 
  Camera, 
  CameraOff,
  Clock,
  Users,
  CreditCard,
  Scan
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
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

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

    const nombre =
      nombresAleatorios[Math.floor(Math.random() * nombresAleatorios.length)];

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
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 xl:px-16 py-10">

    {/* HEADER */}
    <div className="mb-10">
      <h1 className="text-3xl font-bold text-slate-800">
        Centro de Asistencia
      </h1>
      <p className="text-slate-500 mt-1">
        Registro de aprendices en tiempo real
      </p>
    </div>

    {/* STATS */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Users className="w-6 h-6 text-indigo-600" />
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {registros.length}
            </p>
            <p className="text-sm text-slate-500">
              Total registrados hoy
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-slate-800">100%</p>
            <p className="text-sm text-slate-500">
              Lecturas exitosas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Clock className="w-6 h-6 text-amber-600" />
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {new Date().toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm text-slate-500">
              Hora actual
            </p>
          </div>
        </div>
      </div>

    </div>

    {/* MAIN GRID */}
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

      {/* ESCÁNER - ocupa 3 columnas */}
      <div className="xl:col-span-3 bg-white rounded-3xl shadow-lg border border-slate-200 p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Escáner QR
          </h2>

          {escaneando && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Escaneando
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Cámara */}
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-square">

            {!camaraActiva ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-14 h-14 mb-4" />
                <p>Cámara desactivada</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}

          </div>

          {/* Registro Manual */}
          <div className="flex flex-col justify-between space-y-6">

            <div>
              <label className="block text-sm text-slate-500 mb-2">
                Registro Manual
              </label>

              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={documentoManual}
                  onChange={(e) => setDocumentoManual(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && registrarManual()}
                  placeholder="Número de documento"
                  className="w-full pl-10 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={registrarManual}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition"
              >
                Registrar
              </button>
            </div>

            {!camaraActiva ? (
              <button
                onClick={activarCamara}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Scan className="w-4 h-4" />
                Activar Cámara
              </button>
            ) : (
              <button
                onClick={detenerCamara}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl transition"
              >
                Detener Cámara
              </button>
            )}

          </div>

        </div>
      </div>

      {/* PANEL DE REGISTROS */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 flex flex-col max-h-[650px]">

        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Actividad Reciente
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">

          {registros.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200"
            >
              <p className="font-medium text-slate-800 truncate">
                {item.nombre}
              </p>
              <p className="text-sm text-slate-500">
                {item.doc}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {item.hora}
              </p>
            </div>
          ))}

        </div>

      </div>
    </div>

    {/* NOTIFICACIÓN FLOTANTE */}
    {ultimoRegistro && (
      <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-xl animate-fade-in">
        <p className="font-semibold">Registro exitoso</p>
        <p className="text-sm opacity-90">
          {ultimoRegistro.nombre}
        </p>
      </div>
    )}

  </div>
);
}