// Components/TurnoSupervisorCard.jsx
// Panel interactivo de control de turnos para el Supervisor con actualización en tiempo real
import React, { useState, useEffect } from "react";
import { Play, Square, Clock, Users, ShieldCheck, AlertCircle, FileText } from "lucide-react";
import apiNode from "../api/axiosConfig";
import { useSocketListener } from "../api/socket";
import toast from "react-hot-toast";

export default function TurnoSupervisorCard({ usuario }) {
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalIniciar, setModalIniciar] = useState(false);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const consultarTurnoActivo = async () => {
    try {
      setCargando(true);
      const res = await apiNode.get("/api/Turnos/activo");
      setTurnoActivo(res.data?.turno || null);
    } catch (err) {
      console.warn("No se pudo consultar turno activo:", err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarTurnoActivo();
  }, []);

  // Escuchar eventos en tiempo real
  useSocketListener("turno:iniciado", (turno) => {
    setTurnoActivo(turno);
  });

  useSocketListener("turno:finalizado", () => {
    setTurnoActivo(null);
  });

  useSocketListener("reservas:actualizadas", () => {
    // Si hay un turno activo, refrescar el conteo
    consultarTurnoActivo();
  });

  const manejarIniciarTurno = async () => {
    try {
      setEnviando(true);
      const res = await apiNode.post("/api/Turnos/iniciar", { observaciones });
      toast.success(res.data?.mensaje || "Turno iniciado correctamente");
      setTurnoActivo(res.data?.turno);
      setModalIniciar(false);
      setObservaciones("");
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "Error al iniciar turno");
    } finally {
      setEnviando(false);
    }
  };

  const manejarFinalizarTurno = async () => {
    try {
      setEnviando(true);
      const res = await apiNode.post("/api/Turnos/finalizar", { observaciones });
      toast.success(res.data?.mensaje || "Turno finalizado exitosamente");
      setTurnoActivo(null);
      setModalFinalizar(false);
      setObservaciones("");
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "Error al finalizar turno");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 animate-pulse flex items-center justify-between">
        <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const esMiTurno = turnoActivo && turnoActivo.Id_Usuario === usuario?.Id_Usuario;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-md border border-slate-200/80 mb-6 transition-all">
      {/* Indicador de fondo suave */}
      <div
        className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
          turnoActivo ? "bg-emerald-500/10" : "bg-blue-500/10"
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Info del turno */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                turnoActivo
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-100 text-slate-600 border border-slate-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  turnoActivo ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                }`}
              />
              {turnoActivo ? "Turno Activo en Comedor" : "Sin Turno Activo"}
            </span>

            {turnoActivo && (
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Iniciado:{" "}
                {new Date(turnoActivo.Fecha_Inicio).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-800">
            {turnoActivo
              ? esMiTurno
                ? "Estás en turno de supervisión"
                : `Turno a cargo de ${turnoActivo.supervisor?.Nom_Usuario || "Supervisor"}`
              : "Control de Turno de Supervisión"}
          </h2>

          <p className="text-xs text-slate-500 max-w-xl">
            {turnoActivo
              ? "Cada plato consumido registrado por QR o documento se asocia automáticamente a este turno y se reporta en tiempo real."
              : "Inicia tu turno antes de escanear los códigos QR de los aprendices para llevar la trazabilidad exacta de los consumos del día."}
          </p>
        </div>

        {/* Acciones y métricas */}
        <div className="flex flex-wrap items-center gap-4">
          {turnoActivo && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="p-2 rounded-xl bg-blue-100 text-[#2E5792]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Consumos</p>
                <p className="text-lg font-black text-slate-800">
                  {turnoActivo.Total_Consumos_Registrados || 0}
                </p>
              </div>
            </div>
          )}

          {!turnoActivo ? (
            <button
              type="button"
              onClick={() => setModalIniciar(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2E5792] text-white font-bold text-sm shadow-md hover:bg-[#234574] transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Iniciar Turno
            </button>
          ) : esMiTurno ? (
            <button
              type="button"
              onClick={() => setModalFinalizar(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-md hover:bg-red-700 transition-all cursor-pointer active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
              Finalizar Turno
            </button>
          ) : (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl font-bold">
              Turno bloqueado por otro supervisor
            </span>
          )}
        </div>
      </div>

      {/* Modal Iniciar Turno */}
      {modalIniciar && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-800 mb-2">Iniciar Turno de Comedor</h3>
            <p className="text-xs text-slate-500 mb-4">
              Se enviará una notificación al correo institucional y a la aplicación alertando sobre tu inicio de turno.
            </p>

            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones iniciales (opcional)
            </label>
            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Turno de almuerzo iniciado sin novedades..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-2 focus:ring-[#2E5792] outline-none"
            />

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setModalIniciar(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={manejarIniciarTurno}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2E5792] text-white hover:bg-[#234574] disabled:opacity-50"
              >
                {enviando ? "Iniciando..." : "Confirmar e Iniciar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Finalizar Turno */}
      {modalFinalizar && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-800 mb-2">Finalizar Turno Actual</h3>
            <p className="text-xs text-slate-500 mb-4">
              ¿Estás seguro de cerrar tu turno? Se registrará el balance final de consumos ({turnoActivo?.Total_Consumos_Registrados || 0}) y se enviará el informe por correo.
            </p>

            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones finales o novedades del turno
            </label>
            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Servicio completado con normalidad..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-2 focus:ring-red-500 outline-none"
            />

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setModalFinalizar(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={manejarFinalizarTurno}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {enviando ? "Finalizando..." : "Confirmar Cierre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
