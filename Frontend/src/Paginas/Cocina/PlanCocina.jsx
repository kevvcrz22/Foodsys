// Frontend/src/Paginas/Cocina/PlanCocina.jsx
//
// Modulo de planificacion de alimentos para el personal de Cocina y Bienestar al Aprendiz.
//
// CARACTERISTICAS PRINCIPALES:
//   1. Horarios de Preparacion (-5 Horas antes de cada servicio):
//      - Desayuno: servicio 06:00 -> Preparacion inicia 01:00 AM (-5h)
//      - Almuerzo: servicio 11:30 -> Preparacion inicia 06:30 AM (-5h)
//      - Cena: servicio 18:00 -> Preparacion inicia 13:00 / 01:00 PM (-5h)
//   2. Exportacion a PDF y Excel del Plan del Dia con consolidado de platos y firmas.
//   3. Vista exclusiva para Bienestar al Aprendiz:
//      - Al hacer clic encima de cada plato, se despliega un modal con los nombres,
//        documentos y fichas de los aprendices que solicitaron ese plato.
//   4. Guia de usuario paso a paso y diseno 100% responsivo para cualquier dispositivo.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Utensils, BarChart3, Clock, AlertTriangle, RefreshCw,
  CheckCircle, XCircle, ChefHat, Calendar, Bell, Info,
  Sun, Coffee, Moon, TrendingUp, Loader2, FileSpreadsheet,
  FileText, Users, Eye, HelpCircle, ChevronDown, ChevronUp, X
} from 'lucide-react';
import apiAxios from '../../api/axiosConfig';
import { exportarAExcel, exportarAPDF, confirmarExportacion } from '../../utils/exportUtils';

const API_BASE = '/api/Cocina';

// Configuracion visual de los turnos con calculo de preparacion 5 horas antes
const CONFIG_TURNO = {
  Desayuno: {
    icono: Coffee,
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    badge: 'bg-orange-100 text-orange-700',
    consumo: '06:00 – 07:00',
    cierre: '07:00',
    inicioPrep: '01:00 AM (Inicio de Preparación -5h)'
  },
  Almuerzo: {
    icono: Utensils,
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
    badge: 'bg-teal-100 text-teal-700',
    consumo: '11:30 – 13:30',
    cierre: '13:30',
    inicioPrep: '06:30 AM (Inicio de Preparación -5h)'
  },
  Cena: {
    icono: Moon,
    color: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
    badge: 'bg-indigo-100 text-indigo-700',
    consumo: '18:00 – 19:00',
    cierre: '19:00',
    inicioPrep: '01:00 PM / 13:00 (Inicio de Preparación -5h)'
  },
};

// Modal de detalle de aprendices para un plato (vista de Bienestar y Administracion)
const ModalDetalleAprendicesPlato = ({ plato, onClose }) => {
  const [busqueda, setBusqueda] = useState('');
  const aprendices = plato.aprendices || [];

  const aprendicesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return aprendices;
    const q = busqueda.trim().toLowerCase();
    return aprendices.filter(a =>
      a.NombreCompleto?.toLowerCase().includes(q) ||
      String(a.NumDoc).includes(q) ||
      String(a.Num_Ficha).includes(q) ||
      a.Nom_Programa?.toLowerCase().includes(q)
    );
  }, [aprendices, busqueda]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        {/* Cabecera del modal */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-teal-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                {plato.tipo}
              </span>
              <h2 className="text-lg font-bold text-gray-900">{plato.Nom_Plato}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Lista nominal de aprendices que reservaron este plato ({aprendices.length} aprendices)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador rapido */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <input
            type="text"
            placeholder="Buscar por nombre, documento o ficha..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          />
        </div>

        {/* Tabla de aprendices */}
        <div className="overflow-y-auto p-4 flex-1">
          {aprendicesFiltrados.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              No se encontraron aprendices con ese criterio de busqueda
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2.5">Documento</th>
                    <th className="px-3 py-2.5">Aprendiz</th>
                    <th className="px-3 py-2.5">Ficha</th>
                    <th className="px-3 py-2.5">Programa</th>
                    <th className="px-3 py-2.5">Convivencia</th>
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {aprendicesFiltrados.map((item, idx) => (
                    <tr key={idx} className="hover:bg-teal-50/30 transition">
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {item.TipDoc || "CC"} {item.NumDoc}
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                        {item.NombreCompleto}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {item.Num_Ficha}
                      </td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-xs" title={item.Nom_Programa}>
                        {item.Nom_Programa}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.CenCon_Usuario === "Si" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {item.CenCon_Usuario === "Si" ? "Interno" : "Externo"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {item.Est_Reserva}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Tarjeta de cantidad por plato (con click habilitado para ver detalle)
const TarjetaPlato = ({ plato, total, puedeVerDetalle, onVerDetalle }) => {
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return (
    <div
      onClick={() => puedeVerDetalle && onVerDetalle && onVerDetalle(plato)}
      className={`flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm transition ${
        puedeVerDetalle ? 'hover:border-teal-400 hover:shadow-md cursor-pointer' : ''
      }`}
      title={puedeVerDetalle ? 'Haz clic para ver listado nominal de aprendices que pidieron este plato' : ''}
    >
      {plato.Img_Plato ? (
        <img
          src={`${baseUrl}/uploads/${plato.Img_Plato}`}
          alt={plato.Nom_Plato}
          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100"
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Utensils className="w-5 h-5 text-gray-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-800 text-sm truncate">{plato.Nom_Plato}</p>
          {puedeVerDetalle && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
              <Eye className="w-3 h-3" /> Ver lista
            </span>
          )}
        </div>
        {plato.Des_Plato && (
          <p className="text-xs text-gray-400 truncate">{plato.Des_Plato}</p>
        )}
      </div>
      <div className="shrink-0 text-center">
        <p className="text-2xl font-extrabold text-teal-700 leading-none">{total}</p>
        <p className="text-xs text-gray-400 mt-0.5">platos</p>
      </div>
    </div>
  );
};

// Tarjeta de turno con totales, hora limite de preparacion (-5h) y lista de platos
const TarjetaTurno = ({ tipo, datos, conteoEstado, puedeVerDetalle, onVerDetalle }) => {
  const cfg = CONFIG_TURNO[tipo];
  const IconoTurno = cfg.icono;
  const platosTurno = datos?.filter(p => p.tipo === tipo) || [];

  return (
    <div
      className="rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      {/* Encabezado del turno */}
      <div className="px-5 py-4 border-b" style={{ borderColor: cfg.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: cfg.color }}
            >
              <IconoTurno className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{tipo}</p>
              <p className="text-xs text-gray-500">
                Horario de Comedor: <strong>{cfg.consumo}</strong>
              </p>
            </div>
          </div>

          {/* Badge obligatorio de preparacion 5 horas antes */}
          <div className="flex items-center gap-1.5 bg-white/90 border border-orange-300 text-orange-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>{cfg.inicioPrep}</span>
          </div>

          <div className="text-right">
            <p className="text-3xl font-extrabold leading-none" style={{ color: cfg.color }}>
              {conteoEstado?.total || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">reservas activas</p>
          </div>
        </div>

        {/* Barra de estados */}
        {conteoEstado && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { key: 'Generado', label: 'Generado', bg: '#dbeafe', color: '#1d4ed8' },
              { key: 'Verificado', label: 'Verificado', bg: '#fef3c7', color: '#b45309' },
              { key: 'Consumido', label: 'Consumido', bg: '#d1fae5', color: '#065f46' },
              { key: 'Cancelado', label: 'Cancelado', bg: '#fee2e2', color: '#991b1b' },
              { key: 'Vencido', label: 'Vencido', bg: '#f1f5f9', color: '#475569' },
            ].map(est => (
              <span
                key={est.key}
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: est.bg, color: est.color }}
              >
                {est.label}: {conteoEstado[est.key] ?? 0}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lista de platos del turno */}
      <div className="p-4 space-y-2">
        {platosTurno.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Sin platos asignados para este turno
          </p>
        ) : (
          platosTurno.map(p => (
            <TarjetaPlato
              key={p.Nom_Plato}
              plato={p}
              total={p.total}
              puedeVerDetalle={puedeVerDetalle}
              onVerDetalle={onVerDetalle}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Componente principal: PlanCocina
const PlanCocina = () => {
  const [resumen, setResumen] = useState(null);
  const [excepcionales, setExcepcionales] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nuevaExcepcional, setNuevaExcepcional] = useState(false);
  const [conteosTurnos, setConteosTurnos] = useState({});
  const [mostrarGuia, setMostrarGuia] = useState(false);

  // Modal para ver los aprendices de un plato seleccionado
  const [platoSeleccionado, setPlatoSeleccionado] = useState(null);

  // Identificar rol del usuario actual
  const rolActivo = localStorage.getItem('rol') || '';
  const puedeVerDetalle = ['Bienestar', 'Administrador', 'Coordinador'].includes(rolActivo);

  // Fecha de hoy formateada
  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const fechaHoyStr = new Date().toISOString().split('T')[0];

  // Carga el resumen del dia y las excepcionales
  const CargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [resRes, excRes] = await Promise.all([
        apiAxios.get(`${API_BASE}/plan-hoy`),
        apiAxios.get(`${API_BASE}/excepcionales-hoy`),
      ]);
      setResumen(resRes.data);
      setExcepcionales(excRes.data);

      // Cargar balance de cada turno en paralelo
      const [desRes, almRes, cenRes] = await Promise.all([
        apiAxios.get(`${API_BASE}/turno-actual/Desayuno`),
        apiAxios.get(`${API_BASE}/turno-actual/Almuerzo`),
        apiAxios.get(`${API_BASE}/turno-actual/Cena`),
      ]);
      setConteosTurnos({
        Desayuno: { ...desRes.data.conteos, total: (desRes.data.conteos?.Generado || 0) + (desRes.data.conteos?.Verificado || 0) + (desRes.data.conteos?.Consumido || 0) },
        Almuerzo: { ...almRes.data.conteos, total: (almRes.data.conteos?.Generado || 0) + (almRes.data.conteos?.Verificado || 0) + (almRes.data.conteos?.Consumido || 0) },
        Cena:     { ...cenRes.data.conteos, total: (cenRes.data.conteos?.Generado || 0) + (cenRes.data.conteos?.Verificado || 0) + (cenRes.data.conteos?.Consumido || 0) },
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar los datos. Verifica tu conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    CargarDatos();
  }, [CargarDatos]);

  // Polling para detectar nuevas reservas excepcionales
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const excRes = await apiAxios.get(`${API_BASE}/excepcionales-hoy`);
        const nuevaData = excRes.data;
        
        setExcepcionales(prev => {
          if (prev && nuevaData.total > prev.total) {
            setNuevaExcepcional(true);
            setTimeout(() => setNuevaExcepcional(false), 8000);
          }
          return nuevaData;
        });
      } catch { /* ignorar errores de polling */ }
    }, 60_000);
    return () => clearInterval(intervalo);
  }, []);

  // Exportar consolidado a Excel
  const manejarExportarExcel = () => {
    if (!resumen || !resumen.cantidadesPorPlato || resumen.cantidadesPorPlato.length === 0) {
      alert('No hay platos programados en el plan de hoy para exportar.');
      return;
    }

    const columnas = [
      { header: 'Turno de Comida', key: 'tipo' },
      { header: 'Hora Consumo', key: 'horarioConsumo' },
      { header: 'Inicio de Preparación (-5h)', key: 'inicioPrep' },
      { header: 'Nombre del Plato', key: 'Nom_Plato' },
      { header: 'Descripción del Plato', key: 'Des_Plato' },
      { header: 'Cantidad de Platos Requeridos', key: 'total' }
    ];

    const datosFormateados = resumen.cantidadesPorPlato.map(p => {
      const cfg = CONFIG_TURNO[p.tipo] || {};
      return {
        tipo: p.tipo,
        horarioConsumo: cfg.consumo || '--',
        inicioPrep: cfg.inicioPrep || '--',
        Nom_Plato: p.Nom_Plato,
        Des_Plato: p.Des_Plato || '',
        total: p.total
      };
    });

    exportarAExcel({
      columnas,
      datos: datosFormateados,
      nombreArchivo: `Plan_Cocina_${fechaHoyStr}`,
      tituloHoja: 'Plan de Cocina'
    });
  };

  // Exportar consolidado a PDF
  const manejarExportarPDF = () => {
    if (!resumen || !resumen.cantidadesPorPlato || resumen.cantidadesPorPlato.length === 0) {
      alert('No hay platos programados en el plan de hoy para exportar.');
      return;
    }

    const columnas = [
      { header: 'Turno', key: 'tipo' },
      { header: 'Horario', key: 'horarioConsumo' },
      { header: 'Preparación (-5h)', key: 'inicioPrep' },
      { header: 'Plato', key: 'Nom_Plato' },
      { header: 'Cantidad', key: 'total' }
    ];

    const datosFormateados = resumen.cantidadesPorPlato.map(p => {
      const cfg = CONFIG_TURNO[p.tipo] || {};
      return {
        tipo: p.tipo,
        horarioConsumo: cfg.consumo || '--',
        inicioPrep: cfg.inicioPrep || '--',
        Nom_Plato: p.Nom_Plato,
        total: `${p.total} platos`
      };
    });

    exportarAPDF({
      columnas,
      datos: datosFormateados,
      nombreArchivo: `Plan_Cocina_${fechaHoyStr}`,
      titulo: 'Plan y Consolidado de Cocina Foodsys',
      subtitulo: `Fecha: ${fechaHoyStr} · Total de Platos Programados: ${resumen.totalReservasActivas}`
    });
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-gray-500 text-sm">Cargando plan de cocina...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shrink-0">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Plan de Cocina</h1>
                {puedeVerDetalle && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    Vista Bienestar / Auditoría
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 capitalize mt-0.5">{hoy}</p>
            </div>
          </div>

          {/* Botones de accion: Actualizar, Exportar Excel y PDF */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={manejarExportarExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs"
              title="Descargar plan de hoy en Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              onClick={manejarExportarPDF}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs"
              title="Descargar plan de hoy en PDF"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={CargarDatos}
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Guia de usuario paso a paso */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-xs">
          <button
            type="button"
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-orange-600 transition"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              ¿Como funciona el Plan de Cocina? (Guia paso a paso)
            </span>
            {mostrarGuia ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {mostrarGuia && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1.5 leading-relaxed">
              <p><strong>1. Regla de 5 Horas:</strong> El equipo de cocina prepara los alimentos con 5 horas de antelacion (Desayuno: 01:00 AM, Almuerzo: 06:30 AM, Cena: 01:00 PM).</p>
              <p><strong>2. Consolidado de Platos:</strong> Cada tarjeta muestra la cantidad exacta de porciones necesarias de cada opcion de comida.</p>
              <p><strong>3. Novedades y Excepcionales:</strong> Las reservas excepcionales de Almuerzo registradas antes de las 9:00 AM alertan inmediatamente con sonido y campana.</p>
              <p><strong>4. Vista Exclusiva Bienestar:</strong> Los coordinadores y personal de Bienestar pueden hacer clic encima de cualquier plato para ver la lista nominal de aprendices que lo pidieron.</p>
              <p><strong>5. Exportacion:</strong> Descarga la orden consolidada en PDF o Excel con fecha y horario oficial.</p>
            </div>
          )}
        </div>

        {/* Alerta de nueva reserva excepcional */}
        {nuevaExcepcional && (
          <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-400 rounded-2xl px-5 py-4 animate-pulse">
            <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">
                ¡Nueva reserva excepcional detectada!
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                El coordinador acaba de agregar una novedad de Almuerzo. Revisa el panel de excepcionales.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {resumen && (
          <>
            {/* Totales generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total del dia', valor: resumen.totalReservasActivas, icono: BarChart3, bg: 'bg-teal-50', color: 'text-teal-700', iconColor: 'text-teal-500' },
                { label: 'Canceladas', valor: resumen.totalesPorEstado?.Cancelado || 0, icono: XCircle, bg: 'bg-red-50', color: 'text-red-700', iconColor: 'text-red-500' },
                { label: 'Vencidas', valor: resumen.totalesPorEstado?.Vencido || 0, icono: Clock, bg: 'bg-slate-50', color: 'text-slate-700', iconColor: 'text-slate-500' },
                { label: 'Excepcionales', valor: excepcionales?.total || 0, icono: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-700', iconColor: 'text-amber-500' },
              ].map(m => {
                const IconoComp = m.icono;
                return (
                  <div key={m.label} className={`${m.bg} rounded-2xl p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 bg-white/70 rounded-xl flex items-center justify-center shrink-0">
                      <IconoComp className={`w-5 h-5 ${m.iconColor}`} />
                    </div>
                    <div>
                      <p className={`text-3xl font-extrabold ${m.color} leading-none`}>{m.valor}</p>
                      <p className={`text-xs font-medium ${m.color} opacity-75 mt-1`}>{m.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panel de excepcionales del dia */}
            {excepcionales?.total > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <h2 className="font-bold text-amber-800 text-sm">
                    Reservas Excepcionales Hoy ({excepcionales.total})
                  </h2>
                </div>
                <div className="divide-y divide-amber-100">
                  {excepcionales.reservas.map(r => (
                    <div key={r.Id_Reserva} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{r.Aprendiz}</p>
                        <p className="text-xs text-gray-500">Doc: {r.Documento} · {r.Tipo} · {r.Plato}</p>
                        {r.Jus_Reserva && (
                          <p className="text-xs text-amber-700 italic mt-0.5">{r.Jus_Reserva}</p>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        r.Estado === 'Consumido' ? 'bg-green-100 text-green-700 border-green-200' :
                        r.Estado === 'Cancelado' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {r.Estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Turnos con platos y calculo de 5 horas antes */}
            <div className="space-y-4">
              {['Desayuno', 'Almuerzo', 'Cena'].map(tipo => (
                <TarjetaTurno
                  key={tipo}
                  tipo={tipo}
                  datos={resumen.cantidadesPorPlato}
                  conteoEstado={conteosTurnos[tipo]}
                  puedeVerDetalle={puedeVerDetalle}
                  onVerDetalle={(plato) => setPlatoSeleccionado({ ...plato, tipo })}
                />
              ))}
            </div>

            {/* Nota informativa de horarios */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Horarios oficiales de preparacion y vencimiento automatico
                </p>
              </div>
              <p className="text-xs text-blue-600">
                El equipo de cocina inicia la preparacion <strong>5 horas antes</strong> de cada servicio. Las reservas no consumidas se marcan como <strong>Vencidas</strong> automaticamente al finalizar el turno:
                Desayuno a las <strong>07:00</strong>, Almuerzo a las <strong>13:30</strong>, Cena a las <strong>19:00</strong>.
              </p>
              <p className="text-xs text-blue-500 mt-2">
                <strong>Cancelaciones:</strong> los aprendices solo pueden cancelar hasta 9 horas antes del inicio del turno.
                Desayuno: antes de las 21:00 del dia anterior · Almuerzo: antes de las 02:30 AM · Cena: antes de las 09:00 AM.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal de Detalle de Aprendices por Plato (Bienestar) */}
      {platoSeleccionado && (
        <ModalDetalleAprendicesPlato
          plato={platoSeleccionado}
          onClose={() => setPlatoSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default PlanCocina;
