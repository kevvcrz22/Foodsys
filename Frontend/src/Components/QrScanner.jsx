// Components/QrScanner.jsx
//
// Componente de escaneo QR para el supervisor en la pantalla de Registro.
//
// FLUJO DE USO:
//   1. El supervisor activa la camara con el boton "Iniciar escaner".
//   2. El aprendiz acerca su QR (generado al reservar) a la camara.
//   3. Este componente lee el QR, extrae el encriptado y llama al backend:
//      POST /api/Reservas/consumir/supervisor  { encriptadoQR }
//   4. El backend valida la reserva, cambia el estado a Consumido y retorna
//      los datos del aprendiz y del plato.
//   5. Se muestra una ventana flotante con esos datos para que el supervisor
//      los pueda comunicar al aprendiz y al personal de cocina.
//   6. El supervisor cierra la ventana con el boton "Cerrar" y la camara
//      se reactiva automaticamente para el siguiente aprendiz.
//
// PROP onConsumo:
//   Callback opcional que recibe el objeto de respuesta del backend cada vez
//   que una reserva se consume correctamente. Registro.jsx lo usa para agregar
//   el registro al historial del turno.
//
// MANEJO DE ERRORES:
//   Si el backend rechaza el QR (vencido, cancelado, ya consumido, etc.)
//   se muestra una tarjeta de error en lugar del modal de exito.
//   El scanner se reactiva inmediatamente para que el supervisor siga trabajando.

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode, Camera, CameraOff, X,
  CheckCircle2, XCircle, Clock, AlertTriangle,
  User, FileText, Utensils, Image as ImageIcon,
  Ban, Shield, CalendarX, ScanLine, Loader2
} from "lucide-react";

// URL base de la API tomada del archivo .env del frontend.
// Si no esta definida, se usa localhost con el puerto por defecto del backend.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Configuracion del lector QR: 30 fps para detectar casi instantaneamente.
// El cuadro de 260x260 px funciona bien en pantallas de movil, tablet y PC.
// useBarCodeDetectorIfSupported usa la API nativa del navegador si existe,
// lo que acelera mucho la lectura comparado con la libreria ZXing en JavaScript puro.
const CONFIG_LECTOR = {
  fps: 30,
  qrbox: { width: 260, height: 260 },
  aspectRatio: 1.0,
  disableFlip: false,
  experimentalFeatures: { useBarCodeDetectorIfSupported: true }
};

// Clasifica el mensaje de error del backend para mostrar el icono y color correctos.
// Recibe un string con el mensaje y retorna un objeto con el tipo de error.
const ClasificarError = (mensaje) => {
  if (!mensaje) return { tipo: "generico" };
  const m = mensaje.toLowerCase();
  if (m.includes("vencido"))                          return { tipo: "vencido"     };
  if (m.includes("cancelado") || m.includes("cancelada")) return { tipo: "cancelado" };
  if (m.includes("consumido") || m.includes("ya fue"))  return { tipo: "consumido"  };
  if (m.includes("cocina")   || m.includes("verificad")) return { tipo: "cocina"     };
  if (m.includes("horario")  || m.includes("habilitado")) return { tipo: "horario"   };
  if (m.includes("sancionado"))                       return { tipo: "sancionado"  };
  if (m.includes("fecha"))                            return { tipo: "fecha"       };
  return { tipo: "generico" };
};

// Tabla de configuracion visual para cada tipo de error.
// Centralizar aqui hace que agregar un nuevo tipo de error solo requiera
// agregar una entrada en este objeto, sin tocar el JSX.
const CONFIG_ERRORES = {
  vencido:    { Icono: Clock,         Titulo: "QR vencido",                 Bg: "bg-slate-50  border-slate-200",  IconoBg: "bg-slate-100",  IconoColor: "text-slate-500",  TituloColor: "text-slate-700",  MsgColor: "text-slate-600"  },
  cancelado:  { Icono: Ban,           Titulo: "Reserva cancelada",           Bg: "bg-orange-50 border-orange-200", IconoBg: "bg-orange-100", IconoColor: "text-orange-500", TituloColor: "text-orange-700", MsgColor: "text-orange-600" },
  consumido:  { Icono: CheckCircle2,  Titulo: "Ya fue consumida",            Bg: "bg-blue-50   border-blue-200",   IconoBg: "bg-blue-100",   IconoColor: "text-blue-500",   TituloColor: "text-blue-700",   MsgColor: "text-blue-600"   },
  cocina:     { Icono: AlertTriangle, Titulo: "Verificacion pendiente",      Bg: "bg-amber-50  border-amber-200",  IconoBg: "bg-amber-100",  IconoColor: "text-amber-600",  TituloColor: "text-amber-800",  MsgColor: "text-amber-700"  },
  horario:    { Icono: Clock,         Titulo: "Fuera del horario de servicio",Bg: "bg-amber-50  border-amber-200",  IconoBg: "bg-amber-100",  IconoColor: "text-amber-600",  TituloColor: "text-amber-800",  MsgColor: "text-amber-700"  },
  sancionado: { Icono: Shield,        Titulo: "Aprendiz sancionado",         Bg: "bg-red-50    border-red-200",    IconoBg: "bg-red-100",    IconoColor: "text-red-500",    TituloColor: "text-red-700",    MsgColor: "text-red-600"    },
  fecha:      { Icono: CalendarX,     Titulo: "Reserva de otra fecha",       Bg: "bg-amber-50  border-amber-200",  IconoBg: "bg-amber-100",  IconoColor: "text-amber-600",  TituloColor: "text-amber-800",  MsgColor: "text-amber-700"  },
  generico:   { Icono: XCircle,       Titulo: "No se pudo procesar",         Bg: "bg-red-50    border-red-200",    IconoBg: "bg-red-100",    IconoColor: "text-red-500",    TituloColor: "text-red-700",    MsgColor: "text-red-600"    }
};

// Colores de badge por tipo de comida.
const COLORES_TIPO = {
  Desayuno: "bg-orange-100 text-orange-700 border border-orange-200",
  Almuerzo: "bg-teal-100   text-teal-700   border border-teal-200",
  Cena:     "bg-indigo-100 text-indigo-700 border border-indigo-200"
};

// ---------------------------------------------------------------------------
// SUBCOMPONENTE: ModalExito
// Ventana flotante que aparece sobre la pantalla cuando el consumo fue exitoso.
// Muestra la info del aprendiz y el plato para que el supervisor la comunique.
// El boton "Cerrar" cierra el modal y reactiva la camara para el siguiente.
// ---------------------------------------------------------------------------
const ModalExito = ({ datos, onCerrar }) => {
  if (!datos) return null;

  // La imagen del plato viene como nombre de archivo; se construye la URL completa.
  // Si no hay imagen, se muestra un icono de placeholder.
  const urlImagen = datos.ImgPlato
    ? `${API_URL}/uploads/${datos.ImgPlato}`
    : null;

  return (
    // Fondo semitransparente que bloquea la interaccion con el resto de la pagina
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      // Al hacer clic fuera del modal se cierra igual que el boton cerrar
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      {/* Tarjeta del modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden animate-[scale-in_0.18s_ease-out]">

        {/* Cabecera verde de exito */}
        <div className="bg-teal-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-base leading-tight">
                Consumo registrado
              </p>
              <p className="text-teal-100 text-xs mt-0.5">
                Estado: Generado &rarr; Consumido
              </p>
            </div>
          </div>
          {/* Badge de flujo (Interno / Especial / Externo) */}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            datos.flujoEspecial
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : datos.flujoInterno
                ? "bg-teal-100 text-teal-700 border-teal-200"
                : "bg-white/20 text-white border-white/30"
          }`}>
            {datos.flujoEspecial ? "ESPECIAL" : datos.flujoInterno ? "INTERNO" : "EXTERNO"}
          </span>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-5 space-y-4">

          {/* Imagen del plato */}
          <div className="flex justify-center">
            {urlImagen ? (
              <img
                src={urlImagen}
                alt={datos.Plato}
                className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl border-2 border-gray-100 shadow-sm"
                // Si la imagen no carga, se muestra el placeholder de abajo
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
            )}
          </div>

          {/* Datos del aprendiz */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">

            {/* Fila: Nombre del aprendiz */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <User className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-none">Aprendiz</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">
                  {datos.Aprendiz}
                </p>
              </div>
            </div>

            {/* Fila: Numero de documento */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-none">Documento</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {datos.NumDoc}
                </p>
              </div>
            </div>

            {/* Fila: Nombre del plato y tipo de comida */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <Utensils className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 leading-none">Plato</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {datos.Plato}
                </p>
                {/* Descripcion del plato: informacion adicional para el personal de cocina */}
                {datos.DescPlato && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {datos.DescPlato}
                  </p>
                )}
              </div>
              {/* Badge del tipo de comida */}
              <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                COLORES_TIPO[datos.Tipo] || "bg-gray-100 text-gray-600"
              }`}>
                {datos.Tipo}
              </span>
            </div>
          </div>

          {/* Boton de cierre: reactiva la camara para registrar al siguiente aprendiz */}
          <button
            id="btn-cerrar-modal-consumo"
            onClick={onCerrar}
            className="w-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cerrar y continuar
          </button>

          {/* Texto de ayuda debajo del boton */}
          <p className="text-center text-xs text-gray-400">
            Al cerrar, la camara se reactiva automaticamente para el siguiente aprendiz.
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SUBCOMPONENTE: TarjetaError
// Muestra el mensaje de error del backend con icono y color segun el tipo.
// El supervisor puede ver rapidamente que salio mal y actuar en consecuencia.
// ---------------------------------------------------------------------------
const TarjetaError = ({ mensaje }) => {
  if (!mensaje) return null;
  const { tipo } = ClasificarError(mensaje);
  const C = CONFIG_ERRORES[tipo] ?? CONFIG_ERRORES.generico;
  const Icono = C.Icono;

  return (
    <div className={`border rounded-2xl p-4 flex items-start gap-3 ${C.Bg}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${C.IconoBg}`}>
        <Icono className={`w-5 h-5 ${C.IconoColor}`} />
      </div>
      <div>
        <p className={`font-bold text-sm ${C.TituloColor}`}>{C.Titulo}</p>
        <p className={`text-sm mt-1 leading-relaxed ${C.MsgColor}`}>{mensaje}</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL: QrScanner
// ---------------------------------------------------------------------------
const QrScanner = ({ onConsumo }) => {

  // Estado de la camara: inactiva, escaneando, procesando
  const [Escaneando, SetEscaneando] = useState(false);
  const [Procesando, SetProcesando] = useState(false);
  const [QRDetectado, SetQRDetectado] = useState(false);

  // Resultado del ultimo escaneo: null cuando no hay resultado aun
  const [DatosExito, SetDatosExito] = useState(null);  // objeto de respuesta del backend
  const [MensajeError, SetMensajeError] = useState(null); // string de error

  // Referencia a la instancia del lector QR para poder detenerla desde afuera
  const InstanciaQR = useRef(null);
  // Bandera para evitar que un mismo QR genere multiples llamadas al API
  const ProcesandoRef = useRef(false);
  // Guarda el ultimo texto QR leido para ignorar lecturas duplicadas en menos de 1 segundo
  const UltimoTexto = useRef('');
  const UltimoTiempo = useRef(0);

  // ID del div donde html5-qrcode montara la vista de la camara.
  // Debe ser unico en la pagina para evitar conflictos si hay dos scanners activos.
  const ID_CONTENEDOR = "qr-scanner-componente";

  // Detiene y limpia la instancia del lector QR de forma segura.
  // Se llama al cerrar el modal, al desmontar el componente y al detener manualmente.
  const DetenerScanner = useCallback(async () => {
    if (InstanciaQR.current) {
      try {
        await InstanciaQR.current.stop();
        InstanciaQR.current.clear();
      } catch {
        // Ignorar errores al detener: puede pasar si la camara ya estaba apagada
      } finally {
        InstanciaQR.current = null;
      }
    }
    SetEscaneando(false);
    SetQRDetectado(false);
    ProcesandoRef.current = false;
  }, []);

  // Limpia la instancia del lector al desmontar el componente para liberar la camara.
  useEffect(() => {
    return () => { DetenerScanner(); };
  }, [DetenerScanner]);

  // Llama al backend con el contenido encriptado del QR.
  // Retorna el objeto de respuesta si el consumo fue exitoso, o lanza un error.
  const LlamarAPIConsumo = async (EncriptadoQR) => {
    const token = localStorage.getItem("token") ?? "";

    const Resp = await fetch(`${API_URL}/api/Reservas/consumir/supervisor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ encriptadoQR: EncriptadoQR })
    });

    const Datos = await Resp.json();

    // Si el servidor responde con un codigo de error, lo lanzamos para que
    // el catch del llamador lo capte y lo muestre como tarjeta de error.
    if (!Resp.ok) {
      throw new Error(Datos.message || "Error al procesar la reserva");
    }

    return Datos;
  };

  // Procesa el texto leido por la camara.
  // Extrae el encriptado del QR (que puede venir como URL o como texto plano),
  // llama al API y muestra el modal de exito o la tarjeta de error.
  const ProcesarTextoQR = useCallback(async (TextoQR) => {
    const Ahora = Date.now();

    // Ignorar si es el mismo QR leido hace menos de 1 segundo (evita doble registro)
    if (TextoQR === UltimoTexto.current && Ahora - UltimoTiempo.current < 1000) return;
    // Ignorar si ya hay una llamada en curso (evita condiciones de carrera)
    if (ProcesandoRef.current) return;

    UltimoTexto.current = TextoQR;
    UltimoTiempo.current = Ahora;
    ProcesandoRef.current = true;

    SetQRDetectado(true);
    SetProcesando(true);
    SetDatosExito(null);
    SetMensajeError(null);

    // Extraer el token encriptado del parametro "data" si el QR contiene una URL.
    // El backend genera QRs con el formato: /ReservaCreada-checkin?data=<encriptado>
    let EncriptadoQR = TextoQR.trim();
    try {
      const Url = new URL(TextoQR);
      const Param = Url.searchParams.get("data");
      if (Param) EncriptadoQR = decodeURIComponent(Param);
    } catch {
      // No es una URL valida: usar el texto completo como encriptado
    }

    // Detener la camara antes de llamar al API para liberar recursos y evitar
    // que sigan entrando nuevos QRs mientras se procesa el actual
    await DetenerScanner();

    try {
      const Resultado = await LlamarAPIConsumo(EncriptadoQR);
      SetDatosExito(Resultado);
      // Notificar al padre (Registro.jsx) para que actualice el historial del turno
      onConsumo?.(Resultado);
    } catch (Err) {
      SetMensajeError(Err.message || "Error desconocido al procesar el QR");
    } finally {
      SetProcesando(false);
      ProcesandoRef.current = false;
    }
  }, [DetenerScanner, onConsumo]);

  // Inicia la camara y comienza a leer QRs continuamente.
  // Si ya hay un resultado de error visible, lo limpia antes de iniciar.
  const IniciarScanner = async () => {
    SetDatosExito(null);
    SetMensajeError(null);
    UltimoTexto.current = '';
    UltimoTiempo.current = 0;
    ProcesandoRef.current = false;

    const Scanner = new Html5Qrcode(ID_CONTENEDOR);
    InstanciaQR.current = Scanner;

    try {
      await Scanner.start(
        { facingMode: "environment" },
        CONFIG_LECTOR,
        (TextoQR) => {
          // Este callback se ejecuta en cada frame donde se detecta un QR.
          // La ref ProcesandoRef evita que multiples frames del mismo QR
          // generen multiples llamadas al API.
          if (!ProcesandoRef.current) {
            ProcesarTextoQR(TextoQR);
          }
        },
        () => {
          // Error de frame (no se detecto QR): se ignora porque es el comportamiento normal
        }
      );
      SetEscaneando(true);
    } catch {
      SetMensajeError("No se pudo acceder a la camara. Verifique que el navegador tenga permiso de acceso.");
      InstanciaQR.current = null;
    }
  };

  // Cierra el modal de exito y reinicia la camara para el siguiente aprendiz.
  // Este es el flujo principal de uso: escanear → ver modal → cerrar → escanear.
  const CerrarModalYReactivar = () => {
    SetDatosExito(null);
    // Peque±o delay para que la animacion de cierre del modal termine antes de abrir la camara
    setTimeout(() => { IniciarScanner(); }, 100);
  };

  // Cierra la tarjeta de error y reinicia la camara para intentar con otro QR
  const LimpiarErrorYReactivar = () => {
    SetMensajeError(null);
    setTimeout(() => { IniciarScanner(); }, 100);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {/* Area de la camara */}
      <div className="w-full relative">

        {/* Contenedor donde html5-qrcode monta el visor de la camara */}
        <div
          id={ID_CONTENEDOR}
          className={`w-full rounded-2xl overflow-hidden border-2 transition-colors ${
            Escaneando
              ? "border-teal-400 shadow-lg shadow-teal-100"
              : "border-gray-200 bg-gray-50"
          }`}
          style={{ minHeight: Escaneando ? "300px" : "0px" }}
        />

        {/* Overlay de procesamiento: aparece cuando se detecto el QR y se esta consultando al API */}
        {Procesando && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(2px)" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-white font-bold text-sm tracking-wide">Procesando reserva...</p>
            <p className="text-white/60 text-xs">Consultando al servidor</p>
          </div>
        )}

        {/* Overlay de QR detectado: aparece un instante antes del overlay de procesamiento */}
        {QRDetectado && !Procesando && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-500/30 border-2 border-teal-400 flex items-center justify-center">
              <ScanLine className="w-8 h-8 text-teal-300" />
            </div>
            <p className="text-teal-300 font-bold text-sm tracking-wide">QR detectado</p>
          </div>
        )}

        {/* Placeholder cuando la camara esta inactiva y no hay resultados */}
        {!Escaneando && !Procesando && !DatosExito && !MensajeError && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <QrCode className="w-14 h-14 mb-3 opacity-25" />
            <p className="text-sm font-medium">Camara inactiva</p>
            <p className="text-xs mt-1 text-gray-400">Presiona "Iniciar escaner" para activar la camara</p>
          </div>
        )}
      </div>

      {/* Tarjeta de error: se muestra si el backend rechazo el QR */}
      {MensajeError && (
        <div className="w-full space-y-3">
          <TarjetaError mensaje={MensajeError} />
          {/* Boton para limpiar el error y reactivar la camara */}
          <button
            id="btn-reintentar-qr"
            onClick={LimpiarErrorYReactivar}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Escanear otro QR
          </button>
        </div>
      )}

      {/* Botones de control de la camara (solo cuando no hay error ni modal de exito) */}
      {!MensajeError && !DatosExito && (
        !Escaneando ? (
          <button
            id="btn-iniciar-scanner-qr"
            onClick={IniciarScanner}
            disabled={Procesando}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
          >
            <Camera className="w-4 h-4" />
            Iniciar escaner
          </button>
        ) : (
          <button
            id="btn-detener-scanner-qr"
            onClick={DetenerScanner}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <CameraOff className="w-4 h-4" />
            Detener escaner
          </button>
        )
      )}

      {/* Texto de ayuda cuando la camara esta activa */}
      {Escaneando && (
        <p className="text-center text-xs text-gray-400 leading-relaxed max-w-xs">
          La camara detecta el QR automaticamente. No es necesario presionar ningun boton.
        </p>
      )}

      {/* Modal de exito: ventana flotante con la informacion del aprendiz y el plato */}
      <ModalExito datos={DatosExito} onCerrar={CerrarModalYReactivar} />
    </div>
  );
};

export default QrScanner;