// Paginas/Cocina/ValidarReservasCocina.jsx
//
// MODULO EXCLUSIVO DEL ROL COCINA
//
// PROPOSITO:
//   El personal de cocina usa este modulo para buscar la reserva de un
//   Aprendiz Externo o Pasante Externo y cambiar su estado de "Generado"
//   a "Verificado". Solo despues de esta verificacion el aprendiz podra
//   mostrar su QR al supervisor y consumir su comida.
//
// FLUJO:
//   Generado -> [Cocina verifica presencialmente aqui] -> Verificado
//            -> [Supervisor escanea QR] -> Consumido
//
// BUSQUEDA UNIFICADA:
//   Una sola barra detecta automaticamente el tipo de valor:
//   - Si el valor es numerico largo (>= 6 digitos): busca por NumDoc_Usuario
//   - Si el valor es numerico corto (< 6 digitos): busca por Id_Reserva
//   El usuario tambien puede seleccionar el modo manualmente con los botones.
//
// HORARIOS DE CONSUMO (solo para informacion, NO los gestiona este modulo):
//   Desayuno: 06:00 – 07:00
//   Almuerzo: 11:30 – 13:30
//   Cena:     18:00 – 19:00
//
// VENCIMIENTO DE TURNOS (cron automatico):
//   Desayuno: 07:00 | Almuerzo: 13:30 | Cena: 19:00

import { useState } from 'react';
import {
  Search, CheckCircle, XCircle, Loader2, QrCode,
  Hash, FileText, AlertTriangle, User, Clock, Utensils, Info,
} from 'lucide-react';
import apiAxios from '../../api/axiosConfig';

// Informacion de horarios de turnos para mostrar al personal de cocina
const HORARIOS = [
  { tipo: 'Desayuno', consumo: '06:00 – 07:00', cierre: '07:00', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { tipo: 'Almuerzo', consumo: '11:30 – 13:30', cierre: '13:30', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { tipo: 'Cena',     consumo: '18:00 – 19:00', cierre: '19:00', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
];

// Tarjeta que muestra los datos de la reserva encontrada
const TarjetaReserva = ({ reserva, onVerificar, verificando }) => {
  const colorEstado = {
    Generado:  'bg-yellow-100 text-yellow-800 border-yellow-300',
    Verificado:'bg-green-100 text-green-800 border-green-300',
    Consumido: 'bg-blue-100 text-blue-800 border-blue-300',
    Cancelado: 'bg-red-100 text-red-800 border-red-300',
  };

  const nombreAprendiz = reserva.usuario
    ? `${reserva.usuario.Nom_Usuario ?? ''} ${reserva.usuario.Ape_Usuario ?? ''}`.trim()
    : 'Sin nombre';

  const numDoc = reserva.usuario?.NumDoc_Usuario ?? 'Sin documento';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Encabezado */}
      <div className="bg-orange-50 border-b border-orange-200 px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base truncate">{nombreAprendiz}</p>
            <p className="text-sm text-gray-500">Doc: {numDoc}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${colorEstado[reserva.Est_Reserva] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            {reserva.Est_Reserva}
          </span>
        </div>
      </div>

      {/* Detalles */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Hash className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-500">ID Reserva:</span>
          <span className="font-semibold text-gray-800">#{reserva.Id_Reserva}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Utensils className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-500">Tipo:</span>
          <span className="font-semibold text-gray-800">{reserva.Tip_Reserva}</span>
        </div>
        {reserva.plato?.Nom_Plato && (
          <div className="flex items-center gap-3 text-sm">
            <QrCode className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-gray-500">Plato:</span>
            <span className="font-semibold text-gray-800">{reserva.plato.Nom_Plato}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-500">Fecha:</span>
          <span className="font-semibold text-gray-800">{reserva.Fec_Reserva}</span>
        </div>
      </div>

      {/* Accion */}
      <div className="px-5 py-4 border-t border-gray-100">
        {reserva.Est_Reserva === 'Generado' ? (
          <button
            onClick={() => onVerificar(reserva.Id_Reserva)}
            disabled={verificando}
            id={`btn-verificar-${reserva.Id_Reserva}`}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm"
          >
            {verificando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle className="w-4 h-4" />}
            {verificando ? 'Verificando...' : 'Verificar Presencia'}
          </button>
        ) : reserva.Est_Reserva === 'Verificado' ? (
          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm py-2">
            <CheckCircle className="w-4 h-4" />
            Ya verificada — el aprendiz puede usar su QR con el supervisor
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
            <XCircle className="w-4 h-4" />
            No se puede verificar — estado actual: {reserva.Est_Reserva}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal
const ValidarReservasCocina = () => {

  // tipoBusqueda: 'documento' | 'id'
  // Se detecta automaticamente segun la longitud del valor ingresado
  const [tipoBusqueda, setTipoBusqueda] = useState('documento');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [reservaEncontrada, setReservaEncontrada] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const hoy = new Date().toISOString().split('T')[0];

  // Detecta automaticamente si es documento o ID segun la cantidad de digitos
  // >= 6 digitos = documento de cedula | < 6 = ID de reserva
  const DetectarTipoBusqueda = (valor) => {
    if (!valor.trim() || isNaN(Number(valor.trim()))) return tipoBusqueda;
    return valor.trim().length >= 6 ? 'documento' : 'id';
  };

  const manejarCambioBusqueda = (e) => {
    const val = e.target.value;
    setValorBusqueda(val);
    // Auto-detectar tipo si el valor es numerico
    if (val.trim() && !isNaN(Number(val.trim()))) {
      setTipoBusqueda(val.trim().length >= 6 ? 'documento' : 'id');
    }
  };

  const buscarReserva = async () => {
    setError('');
    setMensajeExito('');
    setReservaEncontrada(null);

    if (!valorBusqueda.trim()) {
      setError('Por favor ingresa un documento o ID de reserva.');
      return;
    }

    const tipoDetectado = DetectarTipoBusqueda(valorBusqueda);

    setBuscando(true);
    try {
      const respuesta = await apiAxios.get('/api/Reservas/Todas');
      const todasLasReservas = respuesta.data;

      let encontrada = null;

      if (tipoDetectado === 'documento') {
        encontrada = todasLasReservas.find(
          r =>
            String(r.usuario?.NumDoc_Usuario) === valorBusqueda.trim() &&
            r.Fec_Reserva === hoy
        );
      } else {
        encontrada = todasLasReservas.find(
          r => String(r.Id_Reserva) === valorBusqueda.trim()
        );
      }

      if (!encontrada) {
        setError(
          tipoDetectado === 'documento'
            ? 'No se encontro reserva para hoy con ese numero de documento.'
            : 'No se encontro ninguna reserva con ese ID.'
        );
        return;
      }

      setReservaEncontrada(encontrada);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Error al buscar la reserva. Verifica tu conexion.'
      );
    } finally {
      setBuscando(false);
    }
  };

  const verificarReserva = async (idReserva) => {
    setError('');
    setMensajeExito('');
    setVerificando(true);

    try {
      await apiAxios.patch(`/api/Reservas/verificar/${idReserva}/cocina`);
      setMensajeExito('✅ Reserva verificada correctamente. El aprendiz ya puede usar su QR con el supervisor.');
      setReservaEncontrada(prev =>
        prev ? { ...prev, Est_Reserva: 'Verificado' } : prev
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'No se pudo verificar la reserva.'
      );
    } finally {
      setVerificando(false);
    }
  };

  const manejarTecla = e => { if (e.key === 'Enter') buscarReserva(); };

  return (
    <div className="w-full min-h-screen bg-gray-50 px-4 py-6 md:px-8">

      {/* Encabezado */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0 shadow-sm">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Verificacion de Reservas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Busca al aprendiz y confirma su presencia para habilitar el QR
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">

        {/* Panel de horarios informativos */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Horarios de consumo y cierre de turnos
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {HORARIOS.map(h => (
              <div
                key={h.tipo}
                style={{ background: h.bg, borderColor: h.border }}
                className="rounded-xl border p-3 text-center"
              >
                <p style={{ color: h.color }} className="font-bold text-sm">{h.tipo}</p>
                <p className="text-xs text-gray-600 mt-0.5">Consumo: {h.consumo}</p>
                <p className="text-xs text-gray-400">Cierre: {h.cierre}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Las reservas no consumidas a las horas de cierre quedan como <strong>Vencidas</strong> y el usuario es sancionado.
          </p>
        </div>

        {/* Panel de busqueda unificada */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Buscar por documento o ID de reserva
            </p>
            {/* Selector manual de tipo de busqueda */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTipoBusqueda('documento')}
                id="btn-buscar-documento"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  tipoBusqueda === 'documento'
                    ? 'bg-orange-500 text-white border-transparent shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                Numero de Documento
              </button>
              <button
                onClick={() => setTipoBusqueda('id')}
                id="btn-buscar-id"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  tipoBusqueda === 'id'
                    ? 'bg-orange-500 text-white border-transparent shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                <Hash className="w-4 h-4" />
                ID de Reserva
              </button>
            </div>

            {/* Campo unificado + boton buscar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="input-busqueda-cocina"
                  type="text"
                  inputMode="numeric"
                  placeholder={
                    tipoBusqueda === 'documento'
                      ? 'Documento o ID de reserva...'
                      : 'ID de reserva (ej: 42)'
                  }
                  value={valorBusqueda}
                  onChange={manejarCambioBusqueda}
                  onKeyDown={manejarTecla}
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-gray-50"
                />
              </div>
              <button
                onClick={buscarReserva}
                disabled={buscando}
                id="btn-buscar-reserva"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-200 text-sm shrink-0"
              >
                {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {/* Texto de ayuda */}
            <p className="text-xs text-gray-400 text-center mt-2">
              {tipoBusqueda === 'documento'
                ? 'Escribe el documento de cedula del aprendiz (>= 6 digitos se detecta como cedula).'
                : 'Escribe el ID exacto de la reserva (numero corto < 6 digitos).'}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Exito */}
        {mensajeExito && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-700">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{mensajeExito}</p>
          </div>
        )}

        {/* Tarjeta de resultado */}
        {reservaEncontrada && (
          <TarjetaReserva
            reserva={reservaEncontrada}
            onVerificar={verificarReserva}
            verificando={verificando}
          />
        )}

        {/* Nota informativa */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
            Como funciona este modulo
          </p>
          <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
            <li>El aprendiz externo se presenta en taquilla con su documento.</li>
            <li>Escribe el documento o el ID de reserva en la barra de busqueda.</li>
            <li>Si aparece en estado <strong>Generado</strong>, presiona <strong>Verificar Presencia</strong>.</li>
            <li>El estado cambia a <strong>Verificado</strong> y el aprendiz puede usar su QR con el supervisor.</li>
            <li>Los aprendices <strong>internos</strong> no pasan por este paso — van directo con el supervisor.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ValidarReservasCocina;