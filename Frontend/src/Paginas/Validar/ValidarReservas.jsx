// Paginas/Validar/ValidarReservas.jsx
//
// MODULO EXCLUSIVO DEL ROL COCINA:
//   1. Escaneo de codigos QR mediante la camara para verificar reservas presenciales de
//      Aprendices Externos y Pasantes Externos.
//   2. Al escanear, actualiza el estado de la reserva de 'Generado' a 'Verificado'.
//   3. Permite que el aprendiz habilitado pase al puesto del Supervisor para consumir.
//   4. Incluye alternativa de busqueda manual por documento o ID de reserva en caso de fallas de camara.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, CameraOff, QrCode, Search, CheckCircle, XCircle,
  Loader2, Hash, FileText, AlertTriangle, User, Clock,
  Utensils, Info, RefreshCw, ShieldCheck, Sparkles, CheckCircle2,
  Zap, HelpCircle, ChevronDown, ChevronUp, Coffee
} from 'lucide-react';
import apiAxios from '../../api/axiosConfig';
import { extraerDocumentoDeCodigoBarras } from '../../utils/barcodeUtils';

const ID_CONTENEDOR_CAMARA = 'reader-cocina-qr';

const HORARIOS = [
  { tipo: 'Desayuno', consumo: '06:00 – 07:00', cierre: '07:00', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { tipo: 'Almuerzo', consumo: '11:30 – 13:30', cierre: '13:30', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { tipo: 'Cena',     consumo: '18:00 – 19:00', cierre: '19:00', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
];

const CONFIG_LECTOR = {
  fps: 25,
  qrbox: { width: 260, height: 260 },
  aspectRatio: 1.0,
  disableFlip: false,
  experimentalFeatures: { useBarCodeDetectorIfSupported: true }
};

export default function ValidarReservas() {
  const [pestanaActiva, setPestanaActiva] = useState('camara'); // 'camara' | 'manual'
  
  // ── Estados de la Camara ──
  const [escaneando, setEscaneando] = useState(false);
  const [procesandoQR, setProcesandoQR] = useState(false);
  const [resultadoExitoQR, setResultadoExitoQR] = useState(null);
  const [errorQR, setErrorQR] = useState(null);

  // ── Modo Fila Rapida y Guia de Usuario ──
  const [modoFilaRapida, setModoFilaRapida] = useState(true);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const timerAutoContinuarRef = useRef(null);
  const bufferPistolaRef = useRef("");
  const timerPistolaRef = useRef(null);
  
  // ── Estados de Busqueda Manual ──
  const [tipoBusqueda, setTipoBusqueda] = useState('documento');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [reservaEncontrada, setReservaEncontrada] = useState(null);
  const [buscandoManual, setBuscandoManual] = useState(false);
  const [verificandoManual, setVerificandoManual] = useState(false);
  const [errorManual, setErrorManual] = useState('');
  const [exitoManual, setExitoManual] = useState('');

  const instanciaScannerRef = useRef(null);
  const procesandoRef = useRef(false);

  const hoy = new Date().toISOString().split('T')[0];

  // Feedback auditivo corto mediante Web Audio API
  const reproducirBeep = (tipo = "exito") => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (tipo === "exito") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Ignorar si el navegador bloquea audio
    }
  };

  // ── Detener Camara de forma segura ──
  const detenerScanner = useCallback(async () => {
    if (instanciaScannerRef.current) {
      try {
        if (instanciaScannerRef.current.isScanning) {
          await instanciaScannerRef.current.stop();
        }
        await instanciaScannerRef.current.clear();
      } catch (err) {
        console.warn('Advertencia al detener escaner:', err);
      } finally {
        instanciaScannerRef.current = null;
        setEscaneando(false);
      }
    }
  }, []);

  // ── Limpieza automatica al desmontar o cambiar de pestaña ──
  useEffect(() => {
    return () => {
      if (timerAutoContinuarRef.current) clearTimeout(timerAutoContinuarRef.current);
      detenerScanner();
    };
  }, [detenerScanner, pestanaActiva]);

  // ── Procesar codigo QR leido por la camara ──
  const procesarCodigoQR = useCallback(async (textoLeido) => {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    setProcesandoQR(true);
    setErrorQR(null);

    // Extraer parametro 'data' si el QR tiene formato URL (/ReservaCreada-checkin?data=...)
    let encriptado = textoLeido.trim();
    try {
      const url = new URL(textoLeido);
      const param = url.searchParams.get('data');
      if (param) encriptado = decodeURIComponent(param);
    } catch {
      // Texto encriptado directo
    }

    // Detener camara temporalmente mientras se muestra el resultado
    await detenerScanner();

    try {
      const respuesta = await apiAxios.post('/api/Reservas/verificar/qr-cocina', {
        encriptadoQR: encriptado
      });
      setResultadoExitoQR(respuesta.data);
      reproducirBeep("exito");

      // Si el modo Fila Rapida esta activo, reactivar escaneo automaticamente tras 2.5 segundos
      if (modoFilaRapida) {
        if (timerAutoContinuarRef.current) clearTimeout(timerAutoContinuarRef.current);
        timerAutoContinuarRef.current = setTimeout(() => {
          setResultadoExitoQR(null);
          setErrorQR(null);
          setTimeout(() => {
            iniciarScanner();
          }, 150);
        }, 2500);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al validar el código QR.';
      setErrorQR(msg);
      reproducirBeep("alerta");
    } finally {
      setProcesandoQR(false);
      procesandoRef.current = false;
    }
  }, [detenerScanner, modoFilaRapida]);

  // ── Iniciar Camara ──
  const iniciarScanner = async () => {
    setErrorQR(null);
    setResultadoExitoQR(null);
    procesandoRef.current = false;

    // Asegurar que el elemento contenedor este montado en el DOM
    const contenedor = document.getElementById(ID_CONTENEDOR_CAMARA);
    if (!contenedor) return;

    try {
      const scanner = new Html5Qrcode(ID_CONTENEDOR_CAMARA);
      instanciaScannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        CONFIG_LECTOR,
        (decodedText) => {
          if (!procesandoRef.current) {
            procesarCodigoQR(decodedText);
          }
        },
        () => {
          // Ignorar frames sin codigo QR
        }
      );
      setEscaneando(true);
    } catch (err) {
      console.error('Error al iniciar camara:', err);
      setErrorQR('No se pudo acceder a la cámara. Verifique los permisos en el navegador o utilice la Búsqueda Manual.');
      instanciaScannerRef.current = null;
      setEscaneando(false);
    }
  };

  // ── Siguiente Escaneo QR ──
  const reiniciarEscaneo = () => {
    setResultadoExitoQR(null);
    setErrorQR(null);
    setTimeout(() => {
      iniciarScanner();
    }, 150);
  };

  // ── Verificar directamente por numero de documento (Pistola o Teclado) ──
  const verificarPorDocumentoDirecto = useCallback(async (numDoc) => {
    setProcesandoQR(true);
    setErrorQR(null);
    setResultadoExitoQR(null);
    try {
      const resp = await apiAxios.post('/api/Reservas/verificar/documento-cocina', {
        NumDoc: numDoc
      });
      setResultadoExitoQR(resp.data);
      reproducirBeep("exito");

      if (modoFilaRapida) {
        if (timerAutoContinuarRef.current) clearTimeout(timerAutoContinuarRef.current);
        timerAutoContinuarRef.current = setTimeout(() => {
          setResultadoExitoQR(null);
          setErrorQR(null);
          if (pestanaActiva === 'camara') {
            setTimeout(() => {
              iniciarScanner();
            }, 150);
          }
        }, 2500);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al verificar reserva por documento.';
      setErrorQR(msg);
      reproducirBeep("alerta");
    } finally {
      setProcesandoQR(false);
    }
  }, [modoFilaRapida, pestanaActiva]);

  // ── Listener de Pistola Lectora de Codigos de Barras (USB / Bluetooth) ──
  useEffect(() => {
    const manejarTecla = (e) => {
      const tag = e.target?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        const contenido = bufferPistolaRef.current.trim();
        bufferPistolaRef.current = "";
        clearTimeout(timerPistolaRef.current);
        if (contenido.length >= 6) {
          if (contenido.includes("data=") || contenido.startsWith("ey") || contenido.length > 30) {
            procesarCodigoQR(contenido);
          } else {
            const docExtraido = extraerDocumentoDeCodigoBarras(contenido);
            if (docExtraido) {
              verificarPorDocumentoDirecto(docExtraido);
            }
          }
        }
        return;
      }

      if (e.key.length === 1) {
        bufferPistolaRef.current += e.key;
        clearTimeout(timerPistolaRef.current);
        timerPistolaRef.current = setTimeout(() => {
          bufferPistolaRef.current = "";
        }, 500);
      }
    };

    window.addEventListener("keydown", manejarTecla);
    return () => {
      window.removeEventListener("keydown", manejarTecla);
      clearTimeout(timerPistolaRef.current);
    };
  }, [procesarCodigoQR, verificarPorDocumentoDirecto]);

  // ── Busqueda Manual ──
  const buscarManual = async () => {
    setErrorManual('');
    setExitoManual('');
    setReservaEncontrada(null);

    const raw = valorBusqueda.trim();
    if (!raw) {
      setErrorManual('Por favor ingresa un documento o ID de reserva.');
      return;
    }

    const docExtraido = extraerDocumentoDeCodigoBarras(raw);
    const val = docExtraido || raw;
    const esDoc = tipoBusqueda === 'documento' || (val.length >= 6 && !isNaN(Number(val)));

    setBuscandoManual(true);
    try {
      if (esDoc) {
        const resp = await apiAxios.post('/api/Reservas/verificar/documento-cocina', {
          NumDoc: val
        });
        setResultadoExitoQR(resp.data);
        setExitoManual(`Reserva verificada con éxito para ${resp.data.Aprendiz || 'el aprendiz'}.`);
        reproducirBeep("exito");
      } else {
        const resp = await apiAxios.patch(`/api/Reservas/verificar/${val}/cocina`);
        setResultadoExitoQR(resp.data);
        setExitoManual(`Reserva verificada con éxito en Cocina.`);
        reproducirBeep("exito");
      }
      setValorBusqueda('');
    } catch (err) {
      setErrorManual(err?.response?.data?.message || 'Error al validar la reserva en cocina.');
      reproducirBeep("alerta");
    } finally {
      setBuscandoManual(false);
    }
  };

  const verificarManual = async (idReserva) => {
    setErrorManual('');
    setExitoManual('');
    setVerificandoManual(true);

    try {
      const resp = await apiAxios.patch(`/api/Reservas/verificar/${idReserva}/cocina`);
      setExitoManual('Reserva verificada correctamente en Cocina. El aprendiz ya puede consumir con el Supervisor.');
      setResultadoExitoQR(resp.data);
      setReservaEncontrada(prev => prev ? { ...prev, Est_Reserva: 'Verificado' } : prev);
      reproducirBeep("exito");
    } catch (err) {
      setErrorManual(err?.response?.data?.message || 'No se pudo verificar la reserva.');
      reproducirBeep("alerta");
    } finally {
      setVerificandoManual(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      {/* Encabezado */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 text-white">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">
              Validación de Reservas en Cocina
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Escanea el código QR del aprendiz para confirmar su presencia y habilitar el consumo con el supervisor.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Selector de Pestañas: Cámara vs Manual */}
        <div className="flex p-1.5 bg-slate-200/80 rounded-2xl gap-1 shadow-inner">
          <button
            onClick={() => {
              setPestanaActiva('camara');
              detenerScanner();
            }}
            id="tab-camara-cocina"
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
              pestanaActiva === 'camara'
                ? 'bg-white text-orange-600 shadow-md shadow-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            Escanear con Cámara
          </button>
          <button
            onClick={() => {
              setPestanaActiva('manual');
              detenerScanner();
            }}
            id="tab-manual-cocina"
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
              pestanaActiva === 'manual'
                ? 'bg-white text-orange-600 shadow-md shadow-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            Búsqueda Manual
          </button>
        </div>

        {/* Guia de usuario paso a paso */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
          <button
            type="button"
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-orange-600 transition"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              ¿Como funciona la Validacion de Cocina? (Guia paso a paso)
            </span>
            {mostrarGuia ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {mostrarGuia && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <p><strong>Paso 1:</strong> El aprendiz o pasante externo presenta su codigo QR en la camara de Cocina.</p>
              <p><strong>Paso 2:</strong> El sistema valida que sea Externo y cambia el estado de 'Generado' a 'Verificado en Cocina'.</p>
              <p><strong>Paso 3:</strong> En modo 'Fila Rapida', suena un pitido y la pantalla vuelve a escanear a los 2.5 segundos.</p>
              <p><strong>Paso 4:</strong> El aprendiz pasa a la fila del Supervisor, quien confirma la entrega cambiando el estado a 'Consumido'.</p>
            </div>
          )}
        </div>

        {/* ── SECCION 1: ESCANER CON CAMARA ── */}
        {pestanaActiva === 'camara' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-700">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-sm">Escáner QR en Vivo</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  Cocina
                </span>
              </div>

              {/* Interruptor Modo Fila Rapida */}
              <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200 rounded-xl px-2.5 py-1">
                <Zap className={`w-3.5 h-3.5 ${modoFilaRapida ? "text-amber-600 fill-amber-600" : "text-gray-400"}`} />
                <span className="text-xs font-semibold text-amber-900">Modo Fila Rápida</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modoFilaRapida}
                    onChange={(e) => setModoFilaRapida(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>

            {/* Area de la Camara */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
              <div id={ID_CONTENEDOR_CAMARA} className="w-full h-full min-h-[300px]" />

              {/* Laser de escaneo cuando la camara esta activa */}
              {escaneando && !procesandoQR && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-64 h-64 border-2 border-dashed border-orange-400 rounded-3xl relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 animate-pulse shadow-lg shadow-orange-400" />
                  </div>
                  <p className="text-white text-xs font-semibold mt-4 drop-shadow bg-slate-900/70 px-3 py-1 rounded-full">
                    Apunta la cámara al código QR del aprendiz
                  </p>
                </div>
              )}

              {/* Overlay cuando no está escaneando ni mostrando resultado */}
              {!escaneando && !resultadoExitoQR && !procesandoQR && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/95 p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Cámara Inactiva</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Presiona el botón para encender la cámara y escanear el QR del aprendiz o pasante externo.
                    </p>
                  </div>
                  <button
                    onClick={iniciarScanner}
                    id="btn-iniciar-camara-cocina"
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs md:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/25 transition-all transform active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Encender Cámara
                  </button>
                </div>
              )}

              {/* Overlay de procesamiento */}
              {procesandoQR && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-20">
                  <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
                  <p className="text-sm font-bold tracking-wide">Verificando reserva en Cocina...</p>
                </div>
              )}
            </div>

            {/* Controles de la camara */}
            {escaneando && (
              <div className="flex justify-center">
                <button
                  onClick={detenerScanner}
                  id="btn-detener-camara-cocina"
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  <CameraOff className="w-4 h-4" />
                  Apagar Cámara
                </button>
              </div>
            )}

            {/* ── TARJETA DE RESULTADO EXITOSO QR ── */}
            {resultadoExitoQR && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl p-5 space-y-4 shadow-md shadow-emerald-500/10 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Paso 1: Verificado en Cocina
                      </span>
                      <h3 className="text-base font-black text-slate-800 mt-1">
                        {resultadoExitoQR.Aprendiz || 'Aprendiz'}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        Doc: {resultadoExitoQR.NumDoc || 'Sin documento'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                    VERIFICADO
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white/80 p-3 rounded-2xl border border-emerald-200/60">
                  <div>
                    <span className="text-slate-400 block font-medium">Comida:</span>
                    <span className="font-bold text-slate-700">{resultadoExitoQR.Tipo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Plato a Servir:</span>
                    <span className="font-bold text-emerald-800">{resultadoExitoQR.Plato}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Bebida a Servir:</span>
                    <span className="font-bold text-emerald-800">{resultadoExitoQR.Bebida || "Sin bebida"}</span>
                  </div>
                </div>

                <div className="bg-emerald-100/70 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    ¡Reserva verificada con éxito! El aprendiz ya puede acercarse a la taquilla del <strong>Supervisor</strong> para escanear su consumo final.
                  </span>
                </div>

                <button
                  onClick={reiniciarEscaneo}
                  id="btn-siguiente-qr-cocina"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 px-6 rounded-2xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Escanear Siguiente Aprendiz
                </button>
              </div>
            )}

            {/* Error en escaneo */}
            {errorQR && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-5 space-y-3">
                <div className="flex items-start gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">No se pudo verificar la reserva</p>
                    <p className="text-xs text-red-600 mt-0.5">{errorQR}</p>
                  </div>
                </div>
                <button
                  onClick={reiniciarEscaneo}
                  id="btn-reintentar-qr-cocina"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Reintentar Escaneo
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SECCION 2: BUSQUEDA MANUAL ── */}
        {pestanaActiva === 'manual' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Modo de búsqueda manual
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setTipoBusqueda('documento')}
                  id="btn-manual-doc"
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all ${
                    tipoBusqueda === 'documento'
                      ? 'bg-orange-500 text-white border-transparent shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Por Documento
                </button>
                <button
                  onClick={() => setTipoBusqueda('id')}
                  id="btn-manual-id"
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all ${
                    tipoBusqueda === 'id'
                      ? 'bg-orange-500 text-white border-transparent shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  Por ID Reserva
                </button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-manual-cocina"
                    type="text"
                    inputMode="numeric"
                    placeholder={
                      tipoBusqueda === 'documento'
                        ? 'Número de documento del aprendiz...'
                        : 'ID de reserva (ej: 42)'
                    }
                    value={valorBusqueda}
                    onChange={(e) => setValorBusqueda(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') buscarManual(); }}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-slate-50 font-medium"
                  />
                </div>
                <button
                  onClick={buscarManual}
                  disabled={buscandoManual}
                  id="btn-ejecutar-busqueda-manual"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm shrink-0 shadow-sm"
                >
                  {buscandoManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {buscandoManual ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {errorManual && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorManual}</span>
              </div>
            )}

            {exitoManual && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-emerald-800 text-sm font-medium">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                <span>{exitoManual}</span>
              </div>
            )}

            {/* Resultado de busqueda manual */}
            {reservaEncontrada && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {`${reservaEncontrada.usuario?.Nom_Usuario ?? ''} ${reservaEncontrada.usuario?.Ape_Usuario ?? ''}`.trim() || 'Sin nombre'}
                      </h4>
                      <p className="text-xs text-slate-500">Doc: {reservaEncontrada.usuario?.NumDoc_Usuario}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                    reservaEncontrada.Est_Reserva === 'Verificado'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {reservaEncontrada.Est_Reserva}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400">Tipo de Comida:</span>
                    <p className="font-bold text-slate-700">{reservaEncontrada.Tip_Reserva}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Plato:</span>
                    <p className="font-bold text-slate-700">{reservaEncontrada.plato?.Nom_Plato || 'Sin plato'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Bebida:</span>
                    <p className="font-bold text-slate-700">{reservaEncontrada.bebida?.Nom_Plato || 'Sin bebida'}</p>
                  </div>
                </div>

                {reservaEncontrada.Est_Reserva === 'Generado' ? (
                  <button
                    onClick={() => verificarManual(reservaEncontrada.Id_Reserva)}
                    disabled={verificandoManual}
                    id={`btn-verificar-manual-${reservaEncontrada.Id_Reserva}`}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm shadow-sm"
                  >
                    {verificandoManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {verificandoManual ? 'Verificando...' : 'Verificar Presencia (Cambiar a Verificado)'}
                  </button>
                ) : reservaEncontrada.Est_Reserva === 'Verificado' ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Reserva ya verificada — El aprendiz puede pasar a consumir con el Supervisor.
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-xs py-2">
                    <XCircle className="w-4 h-4" />
                    No se puede verificar — estado: {reservaEncontrada.Est_Reserva}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Panel de Horarios Informativos */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Horarios de Consumo y Cierre de Turnos
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {HORARIOS.map((h) => (
              <div
                key={h.tipo}
                style={{ background: h.bg, borderColor: h.border }}
                className="rounded-2xl border p-2.5 text-center"
              >
                <p style={{ color: h.color }} className="font-black text-xs md:text-sm">{h.tipo}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{h.consumo}</p>
                <p className="text-[10px] text-slate-400">Cierre: {h.cierre}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Flujo oficial: <strong>Generado</strong> → [Verificación QR en Cocina] → <strong>Verificado</strong> → [Escaneo Supervisor] → <strong>Consumido</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}