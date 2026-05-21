// Paginas/Cocina/PlanCocina.jsx
//
// Modulo de planificacion para el personal de Cocina.
// Permite ver cuantos platos de cada tipo se deben preparar para cada turno.
//
// FUNCIONALIDADES:
//   1. Resumen del dia de hoy: totales por turno y por plato
//   2. Reporte previo al turno (8 horas antes): cuantos preparar
//   3. Balance del turno en progreso: consumidos, pendientes, cancelados
//   4. Notificaciones de reservas excepcionales (Exc_Reserva = 'Si')
//   5. Horarios de vencimiento automatico

import { useState, useEffect, useCallback } from 'react';
import {
  Utensils, BarChart3, Clock, AlertTriangle, RefreshCw,
  CheckCircle, XCircle, ChefHat, Calendar, Bell, Info,
  Sun, Coffee, Moon, TrendingUp, Loader2,
} from 'lucide-react';
import apiAxios from '../../api/axiosConfig';

const API_BASE = '/api/Cocina';

// Configuracion visual de los turnos
const CONFIG_TURNO = {
  Desayuno: {
    icono: Coffee,
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    badge: 'bg-orange-100 text-orange-700',
    consumo: '06:00 – 07:00',
    cierre: '07:00',
  },
  Almuerzo: {
    icono: Utensils,
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
    badge: 'bg-teal-100 text-teal-700',
    consumo: '11:30 – 13:30',
    cierre: '13:30',
  },
  Cena: {
    icono: Moon,
    color: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
    badge: 'bg-indigo-100 text-indigo-700',
    consumo: '18:00 – 19:00',
    cierre: '19:00',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta de cantidad por plato
// ─────────────────────────────────────────────────────────────────────────────
const TarjetaPlato = ({ plato, total }) => {
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
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
        <p className="font-semibold text-gray-800 text-sm truncate">{plato.Nom_Plato}</p>
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

// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta de turno con totales y lista de platos
// ─────────────────────────────────────────────────────────────────────────────
const TarjetaTurno = ({ tipo, datos, conteoEstado }) => {
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: cfg.color }}
            >
              <IconoTurno className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{tipo}</p>
              <p className="text-xs text-gray-500">Consumo: {cfg.consumo} · Cierre: {cfg.cierre}</p>
            </div>
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
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal: PlanCocina
// ─────────────────────────────────────────────────────────────────────────────
const PlanCocina = () => {
  const [resumen, setResumen] = useState(null);
  const [excepcionales, setExcepcionales] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nuevaExcepcional, setNuevaExcepcional] = useState(false);
  const [conteosTurnos, setConteosTurnos] = useState({});

  // Fecha de hoy formateada
  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

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
        Desayuno: { ...desRes.data.conteos, total: desRes.data.conteos?.Generado + desRes.data.conteos?.Verificado + desRes.data.conteos?.Consumido },
        Almuerzo: { ...almRes.data.conteos, total: almRes.data.conteos?.Generado + almRes.data.conteos?.Verificado + almRes.data.conteos?.Consumido },
        Cena:     { ...cenRes.data.conteos, total: cenRes.data.conteos?.Generado + cenRes.data.conteos?.Verificado + cenRes.data.conteos?.Consumido },
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar los datos. Verifica tu conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    CargarDatos();
    // Verificar excepcionales cada 60 segundos para detectar nuevas novedades
    const intervalo = setInterval(async () => {
      try {
        const excRes = await apiAxios.get(`${API_BASE}/excepcionales-hoy`);
        const nuevaData = excRes.data;
        if (excepcionales && nuevaData.total > excepcionales.total) {
          setNuevaExcepcional(true);
          setTimeout(() => setNuevaExcepcional(false), 8000);
        }
        setExcepcionales(nuevaData);
      } catch { /* ignorar errores de polling */ }
    }, 60_000);
    return () => clearInterval(intervalo);
  }, [CargarDatos, excepcionales]);

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
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shrink-0">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900">Plan de Cocina</h1>
            <p className="text-sm text-gray-500 capitalize mt-0.5">{hoy}</p>
          </div>
          <button
            onClick={CargarDatos}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* ── Alerta de nueva excepcional ── */}
        {nuevaExcepcional && (
          <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-400 rounded-2xl px-5 py-4 animate-pulse">
            <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">
                ¡Nueva reserva excepcional detectada!
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                El coordinador acaba de agregar una novedad. Revisa el panel de excepcionales.
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {resumen && (
          <>
            {/* ── Totales generales ── */}
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

            {/* ── Panel de excepcionales del dia ── */}
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

            {/* ── Turnos con platos ── */}
            <div className="space-y-4">
              {['Desayuno', 'Almuerzo', 'Cena'].map(tipo => (
                <TarjetaTurno
                  key={tipo}
                  tipo={tipo}
                  datos={resumen.cantidadesPorPlato}
                  conteoEstado={conteosTurnos[tipo]}
                />
              ))}
            </div>

            {/* ── Nota informativa de horarios ── */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Horarios de vencimiento automatico
                </p>
              </div>
              <p className="text-xs text-blue-600">
                Las reservas no consumidas se marcan como <strong>Vencidas</strong> automaticamente:
                Desayuno a las <strong>07:00</strong>, Almuerzo a las <strong>13:30</strong>, Cena a las <strong>19:00</strong>.
                El aprendiz queda sancionado y no podra reservar en la siguiente semana.
              </p>
              <p className="text-xs text-blue-500 mt-2">
                <strong>Cancelaciones:</strong> los aprendices solo pueden cancelar hasta 9 horas antes del inicio del turno.
                Desayuno: antes de las 21:00 del dia anterior · Almuerzo: antes de las 02:30 · Cena: antes de las 09:00.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanCocina;
