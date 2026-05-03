import { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";

export function useCamara({ onQRDetectado, onError }) {
  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const streamRef       = useRef(null);
  const scanIntervalRef = useRef(null);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [escaneando,   setEscaneando]   = useState(false);

  const activarCamara = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCamaraActiva(true);
      setEscaneando(true);
    } catch {
      onError("No se pudo acceder a la cámara");
    }
  };

  const detenerCamara = () => {
    clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCamaraActiva(false);
    setEscaneando(false);
  };

  useEffect(() => {
    if (!camaraActiva) return;
    const video   = videoRef.current;
    const canvas  = canvasRef.current;
    const context = canvas.getContext("2d");

    video.srcObject = streamRef.current;
    video.play();

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imageData.data, imageData.width, imageData.height);
        if (qr) {
          onQRDetectado(qr.data);
          detenerCamara();
        }
      }
    }, 300);

    return () => clearInterval(scanIntervalRef.current);
  }, [camaraActiva, onQRDetectado]);

  return { videoRef, canvasRef, camaraActiva, escaneando, activarCamara, detenerCamara };
}