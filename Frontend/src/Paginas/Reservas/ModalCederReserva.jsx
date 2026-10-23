// Frontend/src/Paginas/Reservas/ModalCederReserva.jsx
// Modal para ceder reservas solidarias o liberar a la bolsa solidaria de Bienestar
// Protegido por Ley 1581 de Habeas Data (datos sensibles enmascarados en servidor)
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import { useState, useEffect } from "react";
import {
  X, UserCheck, HeartHandshake, Search, AlertCircle,
  Clock, CheckCircle2, Shield, Info, Loader2, ArrowRight
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";

const ModalCederReserva = ({ reserva, usuario, onCerrar, onExito }) => {
  const [modalidad, setModalidad] = useState("companero"); // 'companero' o 'bolsa'
  const [busqueda, setBusqueda] = useState("");
  const [candidatos, setCandidatos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCerrar]);

  // Busqueda de companeros con debounce
  useEffect(() => {
    if (modalidad !== "companero") return;

    const termino = busqueda.trim();
    if (termino.length < 3) {
      setCandidatos([]);
      setErrorBusqueda("");
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda("");
      try {
        const respuesta = await apiAxios.get("/api/Reservas/ceder/buscar-companero", {
          params: {
            q: termino,
            busqueda: termino,
            tipoComida: reserva.Tip_Reserva,
            tipReserva: reserva.Tip_Reserva,
            fecha: reserva.Fec_Reserva,
            fecReserva: reserva.Fec_Reserva
          }
        });
        const lista = respuesta.data?.candidatos || (Array.isArray(respuesta.data) ? respuesta.data : []);
        setCandidatos(lista);
        if (lista.length === 0) {
          setErrorBusqueda("No se encontraron aprendices o pasantes que coincidan con la busqueda.");
        }
      } catch (err) {
        console.error("Error al buscar companero:", err.message);
        setErrorBusqueda(err.response?.data?.mensaje || err.response?.data?.message || "Error al consultar aprendices");
        setCandidatos([]);
      } finally {
        setBuscando(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [busqueda, modalidad, reserva.Tip_Reserva, reserva.Fec_Reserva]);

  // Confirmar cesion directa a companero
  const handleTransferirCompanero = async () => {
    if (!seleccionado) {
      toast.error("Por favor selecciona un companero de la lista");
      return;
    }

    setProcesando(true);
    try {
      const respuesta = await apiAxios.post("/api/Reservas/ceder/transferir", {
        Id_Reserva: reserva.Id_Reserva,
        idReserva: reserva.Id_Reserva,
        Id_Usuario_Receptor: seleccionado.Id_Usuario,
        idUsuarioReceptor: seleccionado.Id_Usuario,
        motivo: motivo.trim() || "Cesion voluntaria solidaria"
      });

      toast.success(respuesta.data?.mensaje || respuesta.data?.message || "Reserva cedida exitosamente");
      if (onExito) onExito(respuesta.data);
      onCerrar();
    } catch (err) {
      console.error("Error al transferir reserva:", err.message);
      toast.error(err.response?.data?.mensaje || err.response?.data?.message || "No se pudo transferir la reserva");
    } finally {
      setProcesando(false);
    }
  };

  // Confirmar liberacion a bolsa solidaria de Bienestar
  const handleLiberarBolsa = async () => {
    setProcesando(true);
    try {
      const respuesta = await apiAxios.post("/api/Reservas/ceder/liberar-bolsa", {
        Id_Reserva: reserva.Id_Reserva,
        idReserva: reserva.Id_Reserva,
        motivo: motivo.trim() || "Liberada a bolsa solidaria de Bienestar"
      });

      toast.success(respuesta.data?.mensaje || respuesta.data?.message || "Cupo liberado para la bolsa solidaria");
      if (onExito) onExito(respuesta.data);
      onCerrar();
    } catch (err) {
      console.error("Error al liberar a bolsa solidaria:", err.message);
      toast.error(err.response?.data?.mensaje || err.response?.data?.message || "No se pudo liberar el cupo");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">

        {/* Encabezado con degradado institucional */}
        <div className="bg-gradient-to-r from-[#0f3f80] to-[#1e5bb0] p-6 text-white relative">
          <button
            onClick={onCerrar}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <HeartHandshake className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Ceder Reserva Solidaria
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Centro Agropecuario La Granja · {reserva.Tip_Reserva} del {reserva.Fec_Reserva}
              </p>
            </div>
          </div>

          {/* Tarjeta resumen del plato a ceder */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">
                Plato reservado
              </p>
              <p className="text-sm font-bold text-white truncate">
                {reserva.plato?.Nom_Plato || "Plato del dia"}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Reserva #{reserva.Id_Reserva}
            </span>
          </div>
        </div>

        {/* Selector de Modalidad (Tabs) */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
          <button
            type="button"
            onClick={() => { setModalidad("companero"); setSeleccionado(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              modalidad === "companero"
                ? "bg-white text-[#0f3f80] shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <UserCheck size={15} />
            Ceder a un Companero
          </button>
          <button
            type="button"
            onClick={() => { setModalidad("bolsa"); setSeleccionado(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              modalidad === "bolsa"
                ? "bg-white text-[#0f3f80] shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <HeartHandshake size={15} />
            Bolsa Solidaria Bienestar
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* Advertencia de horario y proteccion de datos */}
          <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Horario limite de cesion:</span> hasta 2 horas antes del turno (Desayuno: 4:00 AM, Almuerzo: 9:30 AM, Cena: 4:00 PM). Una reserva cedida no se puede volver a ceder.
            </div>
          </div>

          {modalidad === "companero" ? (
            <>
              {/* Buscador de companero protegido */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Buscar Aprendiz o Pasante Receptor</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                    <Shield size={11} className="text-emerald-600" />
                    Habeas Data protegido
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Escribe al menos 3 letras del nombre o cedula..."
                    className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3f80] focus:border-transparent transition-all"
                  />
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  {buscando && (
                    <Loader2 size={15} className="absolute right-3 top-3 text-[#0f3f80] animate-spin" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Por seguridad, solo se mostraran iniciales de apellidos y terminacion del documento.
                </p>
              </div>

              {/* Mensajes de error o aviso */}
              {errorBusqueda && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <AlertCircle size={15} className="text-slate-400 shrink-0" />
                  <span>{errorBusqueda}</span>
                </div>
              )}

              {/* Lista de candidatos encontrados */}
              {candidatos.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {candidatos.map((cand) => {
                    const isSelected = seleccionado?.Id_Usuario === cand.Id_Usuario;
                    const canSelect = cand.disponible;

                    return (
                      <div
                        key={cand.Id_Usuario}
                        onClick={() => {
                          if (canSelect) {
                            setSeleccionado(cand);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-3 ${
                          !canSelect
                            ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-50/80 border-[#0f3f80] ring-1 ring-[#0f3f80] cursor-pointer"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">
                            {cand.nombreEnmascarado}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>Doc: {cand.documentoEnmascarado}</span>
                            <span>•</span>
                            <span className="font-medium text-[#0f3f80]">{cand.ficha}</span>
                          </div>
                          {!canSelect && cand.motivoRestriccion && (
                            <p className="text-[10px] text-amber-700 mt-1 font-medium">
                              {cand.motivoRestriccion}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {canSelect ? (
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? "bg-[#0f3f80] border-[#0f3f80] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <CheckCircle2 size={13} />}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              No elegible
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Informacion del receptor seleccionado */}
              {seleccionado && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div className="leading-tight">
                    <p className="font-bold">Receptor seleccionado: {seleccionado.nombreEnmascarado}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Al confirmar, tu codigo QR se anulara y se generara uno nuevo para tu companero.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Modalidad Bolsa Solidaria */
            <div className="space-y-3">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0f3f80]">
                  <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0" />
                  Bolsa Solidaria de Bienestar al Aprendiz
                </div>
                <p className="leading-relaxed text-slate-700">
                  Si no puedes asistir a tu alimentacion y no conoces a quien cederla, puedes liberar tu cupo.
                  Bienestar al Aprendiz reasignara esta racion a un aprendiz o pasante en lista de espera que se encuentre presente en el Centro Agropecuario La Granja.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2 text-[11px] text-slate-600">
                  <Info size={14} className="text-[#0f3f80] shrink-0" />
                  <span>Tu generosidad evita el desperdicio de comida y apoya a tus companeros.</span>
                </div>
              </div>
            </div>
          )}

          {/* Campo opcional de motivo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo o Mensaje Solidario (Opcional)
            </label>
            <input
              type="text"
              maxLength={150}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Tengo practica de campo en porcinos y no alcanzo a llegar"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3f80] focus:border-transparent transition-all"
            />
          </div>

        </div>

        {/* Pie de modal con botones de accion */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          {modalidad === "companero" ? (
            <button
              type="button"
              onClick={handleTransferirCompanero}
              disabled={!seleccionado || procesando}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0f3f80] hover:bg-[#144f9e] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {procesando ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Transfiriendo...
                </>
              ) : (
                <>
                  <UserCheck size={14} />
                  Confirmar Cesion
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLiberarBolsa}
              disabled={procesando}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Liberando Cupo...
                </>
              ) : (
                <>
                  <HeartHandshake size={14} />
                  Liberar a Bolsa Solidaria
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ModalCederReserva;
