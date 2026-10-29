// Frontend/src/Paginas/Admin/SupervisorContrato.jsx
// Módulo independiente para el rol Supervisor de Contrato (Interventoría y Ejecución Contractual)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiAxios from "../../api/axiosConfig";
import {
  ShieldCheck, Utensils, ClipboardList, MessageSquare,
  BarChart3, ChefHat, CheckCircle2, AlertTriangle,
  Calendar, ArrowRight, RefreshCw
} from "lucide-react";
import GlobalLoader from "../../Components/GlobalLoader";
import toast from "react-hot-toast";

export default function SupervisorContrato() {
  const navigate = useNavigate();
  const hoyBogota = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState({
    totalMenusHoy: 0,
    totalPlatosCatalogo: 0,
    pqrsfAbiertas: 0,
    pqrsfTotal: 0
  });

  const cargarResumenContrato = async () => {
    setCargando(true);
    try {
      const [resMenus, resPlatos, resPqrsf] = await Promise.allSettled([
        apiAxios.get("/api/Menus"),
        apiAxios.get("/api/platos"),
        apiAxios.get("/api/Pqrsf")
      ]);

      const listaMenus = resMenus.status === "fulfilled" && Array.isArray(resMenus.value.data)
        ? resMenus.value.data
        : [];
      const menusHoy = listaMenus.filter((m) => String(m.Fec_Menu || "").slice(0, 10) === hoyBogota);

      const listaPlatos = resPlatos.status === "fulfilled" && Array.isArray(resPlatos.value.data)
        ? resPlatos.value.data
        : [];

      const pqrsfList = resPqrsf.status === "fulfilled"
        ? (resPqrsf.value.data?.pqrsf || resPqrsf.value.data?.pqrsfs || [])
        : [];
      const abiertas = pqrsfList.filter((p) => p.Estado_Pqrsf === "Abierta" || p.Estado_Pqrsf === "En Revision").length;

      setResumen({
        totalMenusHoy: menusHoy.length,
        totalPlatosCatalogo: listaPlatos.length,
        pqrsfAbiertas: abiertas,
        pqrsfTotal: pqrsfList.length
      });
    } catch (error) {
      console.error("Error al cargar métricas de Supervisor de Contrato:", error);
      toast.error("No se pudieron sincronizar algunos indicadores contractuales.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResumenContrato();
  }, []);

  const accesosDirectos = [
    {
      titulo: "Minuta Oficial y Menús (Ciclo 28 Días)",
      descripcion: "Auditar, programar y editar la minuta contractual (opciones decimales 1.1 a 28.2).",
      ruta: "/menus",
      icono: ClipboardList,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      titulo: "Catálogo y Edición de Platos",
      descripcion: "Potestad exclusiva junto a Coordinación para editar nombres, ingredientes e imágenes de platos.",
      ruta: "/platos",
      icono: Utensils,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    {
      titulo: "PQRSF e Interventoría",
      descripcion: "Supervisar hallazgos de calidad, gramaje, higiene y cumplimiento de acuerdos de servicio (SLA).",
      ruta: "/pqrsf-admin",
      icono: MessageSquare,
      color: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      titulo: "Reportes de Facturación y Consumo",
      descripcion: "Consultar y exportar en PDF/Excel el consolidado de raciones consumidas, apartados y no consumidos.",
      ruta: "/supervisor-contrato/Reportes",
      icono: BarChart3,
      color: "bg-sky-50 text-sky-700 border-sky-200"
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabecera Institucional */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Interventoría y Supervisión Contractual
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight m-0">
            Módulo de Supervisor de Contrato
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl m-0 leading-relaxed">
            Panel de vigilancia técnica, financiera y nutricional del contrato de alimentación — SENA Centro Agropecuario "La Granja".
          </p>
        </div>

        <button
          onClick={cargarResumenContrato}
          disabled={cargando}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer self-start md:self-center"
        >
          <RefreshCw size={14} className={cargando ? "animate-spin text-violet-600" : ""} />
          <span>Actualizar Indicadores</span>
        </button>
      </div>

      {cargando ? (
        <div className="py-12 bg-white rounded-3xl border border-slate-100">
          <GlobalLoader mensaje="Cargando indicadores contractuales..." />
        </div>
      ) : (
        <>
          {/* KPIs de Ejecución */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 m-0">Opciones Menú Hoy</p>
                <p className="text-2xl font-black text-slate-900 m-0">{resumen.totalMenusHoy}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Utensils size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 m-0">Platos en Minuta</p>
                <p className="text-2xl font-black text-slate-900 m-0">{resumen.totalPlatosCatalogo}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 m-0">PQRSF Pendientes SLA</p>
                <p className="text-2xl font-black text-slate-900 m-0">{resumen.pqrsfAbiertas}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 m-0">Total Radicados PQRSF</p>
                <p className="text-2xl font-black text-slate-900 m-0">{resumen.pqrsfTotal}</p>
              </div>
            </div>
          </div>

          {/* Tarjetas de Gestión Contractual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accesosDirectos.map((item) => {
              const Icono = item.icono;
              return (
                <button
                  key={item.ruta}
                  onClick={() => navigate(item.ruta)}
                  className="text-left bg-white hover:bg-slate-50/80 p-6 rounded-3xl border border-slate-200 hover:border-violet-300 shadow-xs transition-all group flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icono size={22} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-violet-700 transition-colors m-0">
                        {item.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed m-0">
                        {item.descripcion}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
