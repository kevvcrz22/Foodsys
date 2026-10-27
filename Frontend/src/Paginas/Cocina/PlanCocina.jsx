// Frontend/src/Paginas/Cocina/PlanCocina.jsx
// Modulo de planificacion de alimentos para el personal de Cocina, Supervisor y Bienestar al Aprendiz.
//
// CARACTERISTICAS PRINCIPALES V5.0:
//   1. Horarios Oficiales de Preparacion (-5 Horas antes de cada servicio):
//      - Desayuno: servicio 06:00 – 07:00 -> Preparacion inicia 01:00 AM (-5h). Vence a las 07:00 AM.
//      - Almuerzo: servicio 11:30 – 13:30 -> Preparacion inicia 06:30 AM (-5h). Vence a las 13:30 PM.
//      - Cena:     servicio 18:00 – 19:30 -> Preparacion inicia 13:00 / 01:00 PM (-5h). Vence a las 19:30 PM.
//   2. Selector rapido [ Hoy ], [ Mañana ] y selector de fecha para planificar produccion de cualquier dia.
//   3. Tarjetas detalladas de Platos a Preparar y Bebidas (Frias y Calientes).
//   4. Bloque exclusivo: "🌾 Almuerzos por Guardar — Jornada de Campo / SENA Empresa".
//   5. Modal nominal al hacer clic sobre cualquier plato, bebida o acta de campo.
//   6. Exportacion consolidada a Excel y PDF con firmas oficiales institucionales.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Utensils, BarChart3, Clock, AlertTriangle, RefreshCw,
  CheckCircle, XCircle, ChefHat, Calendar, Bell, Info,
  Sun, Coffee, Moon, TrendingUp, Loader2, FileSpreadsheet,
  FileText, Users, Eye, HelpCircle, ChevronDown, ChevronUp, X,
  Wheat, Sparkles, CupSoda
} from 'lucide-react';
import apiAxios from '../../api/axiosConfig';
import { exportarAExcel, exportarAPDF } from '../../utils/exportUtils';
import FoodsysToast from '../../Components/UI/FoodsysToast';

const API_BASE = '/api/Cocina';

// Configuracion visual de los turnos con calculo de preparacion 5 horas antes
const CONFIG_TURNO = {
  Desayuno: {
    icono: Coffee,
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    badge: 'bg-orange-100 text-orange-700',
    consumo: '06:00 – 07:00 AM',
    cierre: '07:00 AM',
    inicioPrep: '01:00 AM (Inicio de Preparación -5h)'
  },
  Almuerzo: {
    icono: Utensils,
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
    badge: 'bg-teal-100 text-teal-700',
    consumo: '11:30 AM – 01:30 PM',
    cierre: '13:30 PM',
    inicioPrep: '06:30 AM (Inicio de Preparación -5h)'
  },
  Cena: {
    icono: Moon,
    color: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
    badge: 'bg-indigo-100 text-indigo-700',
    consumo: '18:00 – 19:30 PM',
    cierre: '19:30 PM',
    inicioPrep: '01:00 PM / 13:00 (Inicio de Preparación -5h)'
  },
};

// Modal de detalle de aprendices para un plato, bebida o ficha guardada
const ModalDetalleAprendicesItem = ({ item, titulo, subtitulo, tipo, onClose }) => {
  const [busqueda, setBusqueda] = useState('');
  const aprendices = item.aprendices || [];

  const aprendicesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return aprendices;
    const q = busqueda.trim().toLowerCase();
    return aprendices.filter(a =>
      a.NombreCompleto?.toLowerCase().includes(q) ||
      String(a.NumDoc).includes(q) ||
      String(a.Num_Ficha).includes(q) ||
      a.Programa?.toLowerCase().includes(q)
    );
  }, [aprendices, busqueda]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-teal-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                {tipo || 'Detalle'}
              </span>
              <h2 className="text-lg font-bold text-gray-900">{titulo || item.Nom_Plato}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {subtitulo || `Lista nominal de aprendices asignados (${aprendices.length} personas)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador dentro del modal */}
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <input
            type="text"
            placeholder="Buscar por nombre, documento o ficha..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
          />
        </div>

        {/* Tabla de aprendices */}
        <div className="overflow-y-auto p-4 flex-1">
          {aprendicesFiltrados.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              No se encontraron aprendices con ese criterio de búsqueda
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
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {aprendicesFiltrados.map((itemA, idx) => (
                    <tr key={idx} className="hover:bg-teal-50/30 transition">
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {itemA.NumDoc}
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                        {itemA.NombreCompleto}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {itemA.Num_Ficha}
                      </td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-xs" title={itemA.Programa}>
                        {itemA.Programa}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {itemA.Estado}
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

// Tarjeta de item (Plato o Bebida)
const TarjetaItemCocina = ({ item, esBebida, puedeVerDetalle, onVerDetalle }) => {
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return (
    <div
      onClick={() => puedeVerDetalle && onVerDetalle && onVerDetalle(item)}
      className={`flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-xs transition ${
        puedeVerDetalle ? 'hover:border-teal-400 hover:shadow-md cursor-pointer' : ''
      }`}
      title={puedeVerDetalle ? 'Haz clic para ver listado nominal de aprendices' : ''}
    >
      {item.Img_Plato ? (
        <img
          src={`${baseUrl}/uploads/${item.Img_Plato}`}
          alt={item.Nom_Plato}
          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100"
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          {esBebida ? <CupSoda className="w-5 h-5 text-teal-600" /> : <Utensils className="w-5 h-5 text-gray-400" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-800 text-sm truncate">{item.Nom_Plato}</p>
          {esBebida && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              item.Subtipo_Bebida === 'CALIENTE' ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800'
            }`}>
              {item.Subtipo_Bebida === 'CALIENTE' ? '☕ Caliente' : '🧊 Fría'}
            </span>
          )}
          {puedeVerDetalle && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
              <Eye className="w-3 h-3" /> Ver lista
            </span>
          )}
        </div>
        {item.Des_Plato && (
          <p className="text-xs text-gray-400 truncate">{item.Des_Plato}</p>
        )}
      </div>
      <div className="shrink-0 text-center">
        <p className="text-2xl font-extrabold text-teal-700 leading-none">{item.total}</p>
        <p className="text-xs text-gray-400 mt-0.5">{esBebida ? 'bebidas' : 'platos'}</p>
      </div>
    </div>
  );
};

// Tarjeta de turno con platos y bebidas
const TarjetaTurno = ({ tipo, platos, bebidas, conteoEstado, puedeVerDetalle, onVerDetalleItem }) => {
  const cfg = CONFIG_TURNO[tipo];
  const IconoTurno = cfg.icono;
  const platosTurno = platos?.filter(p => p.tipo === tipo) || [];
  const bebidasTurno = bebidas?.filter(b => b.tipo === tipo) || [];

  return (
    <div
      className="rounded-2xl border shadow-xs overflow-hidden"
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

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="bg-white/80 border border-slate-200 px-3 py-1 rounded-xl text-slate-700 font-semibold">
              <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
              {cfg.inicioPrep}
            </span>
            <span className="bg-white/80 border border-slate-200 px-3 py-1 rounded-xl text-slate-700 font-semibold">
              Vence: <strong>{cfg.cierre}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Contenido del turno */}
      <div className="p-5 space-y-4">
        {/* Platos Fuertes */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-teal-600" /> Platos a Cocinar ({platosTurno.reduce((acc, p) => acc + p.total, 0)} raciones)
          </h4>
          {platosTurno.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-white/50 p-3 rounded-xl border border-gray-100">
              No hay platos registrados para {tipo} en esta fecha.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {platosTurno.map(plato => (
                <TarjetaItemCocina
                  key={plato.Nom_Plato}
                  item={plato}
                  esBebida={false}
                  puedeVerDetalle={puedeVerDetalle}
                  onVerDetalle={(p) => onVerDetalleItem({ item: p, tipo, esBebida: false })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bebidas */}
        {bebidasTurno.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CupSoda className="w-3.5 h-3.5 text-sky-600" /> Bebidas a Servir ({bebidasTurno.reduce((acc, b) => acc + b.total, 0)} raciones)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bebidasTurno.map(bebida => (
                <TarjetaItemCocina
                  key={bebida.Nom_Plato}
                  item={bebida}
                  esBebida={true}
                  puedeVerDetalle={puedeVerDetalle}
                  onVerDetalle={(b) => onVerDetalleItem({ item: b, tipo, esBebida: true })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal PlanCocina
const PlanCocina = () => {
  const hoyBogotaStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

  // Fecha seleccionada (default hoy)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyBogotaStr);

  const [resumen, setResumen] = useState(null);
  const [excepcionales, setExcepcionales] = useState(null);
  const [conteosTurnos, setConteosTurnos] = useState({ Desayuno: {}, Almuerzo: {}, Cena: {} });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nuevaExcepcional, setNuevaExcepcional] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  // Modal para ver los aprendices
  const [modalItem, setModalItem] = useState(null);

  // Rol activo
  const rolActivo = localStorage.getItem('rol') || localStorage.getItem('rolActivo') || '';
  const puedeVerDetalle = ['Bienestar', 'Administrador', 'Coordinador', 'Supervisor', 'Cocina'].includes(rolActivo);

  // Helpers para fechas rapidas
  const getMananaStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d);
  };

  const mananaBogotaStr = getMananaStr();

  // Carga de datos de la fecha seleccionada
  const CargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [resRes, excRes] = await Promise.all([
        apiAxios.get(`${API_BASE}/plan/${fechaSeleccionada}`),
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
      setError(err?.response?.data?.message || 'Error al cargar los datos del plan de cocina.');
    } finally {
      setCargando(false);
    }
  }, [fechaSeleccionada]);

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
      } catch { /* ignorar */ }
    }, 60_000);
    return () => clearInterval(intervalo);
  }, []);

  // Exportar consolidado a Excel
  const manejarExportarExcel = () => {
    if (!resumen) return;

    const platosDatos = (resumen.cantidadesPorPlato || []).map(p => {
      const cfg = CONFIG_TURNO[p.tipo] || {};
      return {
        tipo: p.tipo,
        categoria: 'PLATO FUERTE',
        nombreItem: p.Nom_Plato,
        subtipo: '--',
        horario: cfg.consumo || '--',
        inicioPrep: cfg.inicioPrep || '--',
        total: p.total
      };
    });

    const bebidasDatos = (resumen.cantidadesPorBebida || []).map(b => {
      const cfg = CONFIG_TURNO[b.tipo] || {};
      return {
        tipo: b.tipo,
        categoria: 'BEBIDA',
        nombreItem: b.Nom_Plato,
        subtipo: b.Subtipo_Bebida === 'CALIENTE' ? 'Caliente' : 'Fría',
        horario: cfg.consumo || '--',
        inicioPrep: cfg.inicioPrep || '--',
        total: b.total
      };
    });

    const datosFormateados = [...platosDatos, ...bebidasDatos];

    if (datosFormateados.length === 0) {
      FoodsysToast.warning('No hay platos ni bebidas programadas en esta fecha para exportar.');
      return;
    }

    const columnas = [
      { header: 'Turno', key: 'tipo' },
      { header: 'Categoría', key: 'categoria' },
      { header: 'Ítem / Menú', key: 'nombreItem' },
      { header: 'Temperatura', key: 'subtipo' },
      { header: 'Horario Consumo', key: 'horario' },
      { header: 'Inicio Preparación (-5h)', key: 'inicioPrep' },
      { header: 'Cantidad Requerida', key: 'total' }
    ];

    exportarAExcel({
      columnas,
      datos: datosFormateados,
      nombreArchivo: `Plan_Cocina_${fechaSeleccionada}`,
      tituloHoja: 'Plan de Cocina'
    });
  };

  // Exportar consolidado a PDF
  const manejarExportarPDF = () => {
    if (!resumen) return;

    const platosDatos = (resumen.cantidadesPorPlato || []).map(p => {
      const cfg = CONFIG_TURNO[p.tipo] || {};
      return {
        tipo: p.tipo,
        item: `[Plato] ${p.Nom_Plato}`,
        horario: cfg.consumo || '--',
        prep: cfg.inicioPrep || '--',
        cantidad: `${p.total} raciones`
      };
    });

    const bebidasDatos = (resumen.cantidadesPorBebida || []).map(b => {
      const cfg = CONFIG_TURNO[b.tipo] || {};
      return {
        tipo: b.tipo,
        item: `[Bebida ${b.Subtipo_Bebida === 'CALIENTE' ? 'Caliente' : 'Fría'}] ${b.Nom_Plato}`,
        horario: cfg.consumo || '--',
        prep: cfg.inicioPrep || '--',
        cantidad: `${b.total} raciones`
      };
    });

    const datos = [...platosDatos, ...bebidasDatos];

    if (datos.length === 0) {
      FoodsysToast.warning('No hay datos para exportar en esta fecha.');
      return;
    }

    const columnas = [
      { header: 'Turno', key: 'tipo' },
      { header: 'Plato / Bebida', key: 'item' },
      { header: 'Horario', key: 'horario' },
      { header: 'Preparación (-5h)', key: 'prep' },
      { header: 'Cantidad', key: 'cantidad' }
    ];

    exportarAPDF({
      columnas,
      datos,
      nombreArchivo: `Plan_Cocina_${fechaSeleccionada}`,
      titulo: 'Plan Diario y Consolidado de Cocina Foodsys',
      subtitulo: `Fecha de Producción: ${fechaSeleccionada} · Centro Agropecuario La Granja`
    });
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-gray-500 text-sm font-semibold">Cargando plan diario de cocina...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 px-4 py-6 md:px-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Encabezado y Selector de Fecha ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shrink-0 text-white">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Plan Diario de Cocina</h1>
                {puedeVerDetalle && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    Auditoría / Bienestar
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Consolidado de preparación (-5h antes), platos, bebidas y raciones de campo
              </p>
            </div>
          </div>

          {/* Selectores rápidos de fecha */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFechaSeleccionada(hoyBogotaStr)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                fechaSeleccionada === hoyBogotaStr
                  ? 'bg-orange-500 text-white shadow-orange-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              [ Hoy ]
            </button>

            <button
              onClick={() => setFechaSeleccionada(mananaBogotaStr)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                fechaSeleccionada === mananaBogotaStr
                  ? 'bg-orange-500 text-white shadow-orange-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              [ Mañana ]
            </button>

            <div className="relative">
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <button
              onClick={manejarExportarExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-xs"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={manejarExportarPDF}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-xs"
              title="Descargar PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={CargarDatos}
              className="flex items-center gap-1 bg-white border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-600 px-3 py-2 rounded-xl text-xs font-semibold transition"
              title="Recargar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Guía didáctica desplegable */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-xs">
          <button
            type="button"
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-orange-600 transition"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              ¿Cómo funciona el Plan de Cocina? (Guía de preparación -5 horas)
            </span>
            {mostrarGuia ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {mostrarGuia && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1.5 leading-relaxed">
              <p><strong>1. Regla de -5 Horas:</strong> El personal de cocina inicia preparación 5 horas antes: Desayuno a las 01:00 AM, Almuerzo a las 06:30 AM y Cena a la 01:00 PM (13:00).</p>
              <p><strong>2. Platos y Bebidas:</strong> Cada tarjeta muestra la cantidad consolidada de cada plato y de cada bebida (indicando si es Fría o Caliente).</p>
              <p><strong>3. Jornadas de Campo:</strong> El bloque especial de abajo lista las raciones autorizadas para guardar a fichas que están en labores agrícolas o pecuarias lejanas.</p>
              <p><strong>4. Lista Nominal al Clic:</strong> Haz clic sobre cualquier plato, bebida o acta para ver el listado de aprendices.</p>
            </div>
          )}
        </div>

        {/* Alerta de nueva reserva excepcional */}
        {nuevaExcepcional && (
          <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-400 rounded-2xl px-5 py-4 animate-pulse">
            <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">¡Nueva reserva excepcional detectada!</p>
              <p className="text-xs text-amber-700 mt-0.5">El coordinador acaba de registrar una novedad de Almuerzo.</p>
            </div>
          </div>
        )}

        {/* Totales generales */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Reservas Activas', valor: resumen.totalReservasActivas, icono: BarChart3, bg: 'bg-teal-50', color: 'text-teal-700', iconColor: 'text-teal-500' },
              { label: 'Almuerzos en Campo', valor: (resumen.almuerzosGuardadosCampo || []).reduce((acc, a) => acc + a.Total_Aprendices_Guardados, 0), icono: Wheat, bg: 'bg-emerald-50', color: 'text-emerald-700', iconColor: 'text-emerald-500' },
              { label: 'Canceladas / Vencidas', valor: (resumen.totalesPorEstado?.Cancelado || 0) + (resumen.totalesPorEstado?.Vencido || 0), icono: XCircle, bg: 'bg-rose-50', color: 'text-rose-700', iconColor: 'text-rose-500' },
              { label: 'Excepcionales (Novedades)', valor: excepcionales?.total || 0, icono: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-700', iconColor: 'text-amber-500' },
            ].map(m => {
              const IconoComp = m.icono;
              return (
                <div key={m.label} className={`${m.bg} rounded-2xl p-4 flex items-center gap-3 border border-slate-200/50`}>
                  <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                    <IconoComp className={`w-5 h-5 ${m.iconColor}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-extrabold ${m.color} leading-none`}>{m.valor}</p>
                    <p className={`text-xs font-semibold ${m.color} opacity-80 mt-1`}>{m.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Turnos con platos, bebidas y calculo de 5 horas antes */}
        {resumen && (
          <div className="space-y-4">
            {['Desayuno', 'Almuerzo', 'Cena'].map(tipo => (
              <TarjetaTurno
                key={tipo}
                tipo={tipo}
                platos={resumen.cantidadesPorPlato}
                bebidas={resumen.cantidadesPorBebida}
                conteoEstado={conteosTurnos[tipo]}
                puedeVerDetalle={puedeVerDetalle}
                onVerDetalleItem={({ item, tipo, esBebida }) => {
                  setModalItem({
                    aprendices: item.aprendices,
                    titulo: item.Nom_Plato,
                    subtitulo: esBebida ? `Bebida: ${item.Nom_Plato}` : `Plato: ${item.Nom_Plato}`,
                    tipo: `${tipo} · ${esBebida ? 'Bebida' : 'Plato'}`
                  });
                }}
              />
            ))}
          </div>
        )}

        {/* ============================================================
            NUEVO BLOQUE: ALMUERZOS POR GUARDAR — JORNADA DE CAMPO / SENA EMPRESA
        ============================================================ */}
        {resumen && (
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Wheat size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    🌾 Almuerzos por Guardar — Jornada de Campo / SENA Empresa ({resumen.almuerzosGuardadosCampo?.length || 0} actas)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fichas con autorización de llegada tardía y raciones guardadas para hoy
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl">
                {(resumen.almuerzosGuardadosCampo || []).reduce((acc, a) => acc + a.Total_Aprendices_Guardados, 0)} Raciones Guardadas
              </span>
            </div>

            {(!resumen.almuerzosGuardadosCampo || resumen.almuerzosGuardadosCampo.length === 0) ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                No hay solicitudes de jornada de campo registradas para esta fecha ({fechaSeleccionada}).
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {resumen.almuerzosGuardadosCampo.map(acta => (
                  <div
                    key={acta.Id_Solicitud_Campo}
                    className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md text-[10px]">
                          {acta.Codigo_Acta}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">Ficha #{acta.Num_Ficha}</h4>
                      </div>
                      <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                        {acta.Total_Aprendices_Guardados} raciones
                      </span>
                    </div>

                    <p className="text-slate-600 truncate font-medium" title={acta.Nom_Programa}>
                      {acta.Nom_Programa}
                    </p>

                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-1 text-slate-700">
                      <p><strong>Unidad:</strong> {acta.Unidad_Productiva}</p>
                      <p><strong>Lugar:</strong> {acta.Detalle_Lugar_Practica}</p>
                      <p><strong>Hora Recogida:</strong> {acta.Hora_Estimada_Llegada ? acta.Hora_Estimada_Llegada.substring(0, 5) : '14:30'}</p>
                      <p><strong>Entregados:</strong> {acta.Total_Almuerzos_Entregados} de {acta.Total_Aprendices_Guardados}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nota informativa de horarios oficiales V5.0 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Horarios Oficiales Coordinados y Políticas Foodsys (V5.0)
            </p>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            • <strong>Desayuno:</strong> Servicio de 06:00 a 07:00 AM (vence 07:00 AM). Inicio de preparación cocina 01:00 AM (-5h). Solo Internos.<br />
            • <strong>Almuerzo:</strong> Servicio de 11:30 AM a 01:30 PM (vence 13:30 PM, salvo raciones con jornada de campo autorizada que vencen en su hora extendida). Inicio cocina 06:30 AM (-5h).<br />
            • <strong>Cena:</strong> Servicio de 18:00 a 19:30 PM (vence 19:30 PM). Inicio de preparación cocina 13:00 PM (-5h). Solo Internos.<br />
            • <strong>Cancelación de reservas:</strong> Permitida para todas las comidas hasta las 10:30 PM (22:30:00) del día anterior.<br />
            • <strong>Reserva Excepcional (Novedades):</strong> Hasta las 09:00 AM del mismo día (exclusivo para Almuerzo).<br />
            • <strong>Ceder Reserva:</strong> Desayuno hasta las 05:30 AM, Almuerzo hasta las 10:30 AM, Cena hasta las 17:00 PM.
          </p>
        </div>
      </div>

      {/* Modal de Detalle de Aprendices por Item */}
      {modalItem && (
        <ModalDetalleAprendicesItem
          item={modalItem}
          titulo={modalItem.titulo}
          subtitulo={modalItem.subtitulo}
          tipo={modalItem.tipo}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  );
};

export default PlanCocina;
