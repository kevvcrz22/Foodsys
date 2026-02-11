import { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";

export default function Registrar() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [documentoManual, setDocumentoManual] = useState("");

  const nombresAleatorios = [
    "María González",
    "Carlos Ramírez",
    "Ana Martínez",
    "Juan Pérez",
    "Laura Torres",
    "Andrés López",
    "Sofía Herrera",
  ];

  const [registros, setRegistros] = useState([
    { nombre: "María González", doc: "1001234567", hora: "12:15" },
    { nombre: "Carlos Ramírez", doc: "1002345678", hora: "12:18" },
    { nombre: "Ana Martínez", doc: "1003456789", hora: "12:22" },
  ]);

  const activarCamara = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCamaraActiva(true);
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

        const qr = jsQR(
          imageData.data,
          imageData.width,
          imageData.height
        );

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
  };

  const agregarRegistro = (doc) => {
    const hora = new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nombre =
      nombresAleatorios[Math.floor(Math.random() * nombresAleatorios.length)];

    setRegistros((prev) => [...prev, { nombre, doc, hora }]);
  };

  const registrarManual = () => {
    if (!documentoManual.trim()) return;
    agregarRegistro(documentoManual);
    setDocumentoManual("");
  };

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Registrar Aprendices
          </h2>
          <p className="text-sm text-gray-500">
            Registra la asistencia mediante código QR o ingreso manual
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Registro Manual */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <i className="bi bi-person-plus-fill text-green-500 text-xl"></i>
            <h3 className="font-semibold text-gray-800">Registro Manual</h3>
          </div>

          <label className="text-sm font-medium text-gray-700">
            Número de referencia del QR
          </label>

          <input
            type="text"
            value={documentoManual}
            onChange={(e) => setDocumentoManual(e.target.value)}
            placeholder="1234567890"
            className="w-full mt-2 mb-4 px-4 py-2 rounded-lg border border-gray-300"
          />

          <button
            onClick={registrarManual}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
          >
            <i className="bi bi-plus-circle"></i>
            Registrar
          </button>
        </div>

        {/* Escaneo QR */}
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <i className="bi bi-qr-code-scan text-green-400 text-xl"></i>
            <h3 className="font-semibold text-gray-800">Escanear QR</h3>
          </div>

          <div className="flex items-center justify-center h-64 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 mb-4 overflow-hidden">
            {!camaraActiva ? (
              <div className="text-center">
                <i className="bi bi-camera text-4xl mb-2"></i>
                <p className="text-sm">Presiona para activar</p>
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

          <button
            onClick={activarCamara}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
          >
            <i className="bi bi-camera-fill"></i>
            Iniciar Escaneo
          </button>
        </div>

        {/* Registros */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <i className="bi bi-check-circle-fill text-green-500 text-xl"></i>
              <h3 className="font-semibold text-gray-800">Registros</h3>
            </div>
            <span className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded-full">
              {registros.length}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Aprendices registrados hoy
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {registros.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-blue-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-gray-500">
                    <i className="bi bi-credit-card mr-1"></i>
                    {item.doc}
                  </p>
                </div>
                <span className="text-xs bg-white border px-2 py-1 rounded-full">
                  <i className="bi bi-clock mr-1"></i>
                  {item.hora}
                </span>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
