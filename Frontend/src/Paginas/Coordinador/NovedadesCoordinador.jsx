import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NovedadesCoordinador = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [tipo, setTipo] = useState('Almuerzo');
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [reservasExcepcionales, setReservasExcepcionales] = useState([]);

  useEffect(() => {
    fetchUsuarios();
    fetchReservasExcepcionales();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/Usuarios/aprendices');
      setUsuarios(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReservasExcepcionales = async () => {
    try {
        const res = await axios.get('http://localhost:8000/api/Reservas');
        const ahora = new Date();
        const hora = ahora.getHours();
        
        // La fecha esperada de la reserva (hoy si < 18h, mañana si >= 18h)
        const fechaEsperada = new Date();
        if (hora >= 18) fechaEsperada.setDate(fechaEsperada.getDate() + 1);
        
        const dia = fechaEsperada.getDate();
        const mes = fechaEsperada.getMonth();
        const anio = fechaEsperada.getFullYear();
        const fechaStr = `${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;

        const excepcionales = res.data.filter(r => 
            r.Res_Excepcional === 'Si' && r.Fec_Reserva === fechaStr
        );
        setReservasExcepcionales(excepcionales);
    } catch (error) {
        console.error(error);
    }
};

  const tiposDisponibles = (u) => {
    if (!u) return ['Desayuno', 'Almuerzo', 'Cena'];
    const esExterno = u.roles?.includes('Aprendiz Externo') && !u.roles?.includes('Aprendiz Interno');
    return esExterno ? ['Almuerzo'] : ['Desayuno', 'Almuerzo', 'Cena'];
  };

  const usuariosFiltrados = usuarios.filter(u =>
    `${u.Nom_Usuario} ${u.Ape_Usuario}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(u.NumDoc_Usuario).includes(busqueda)
  );

  const handleSeleccionarUsuario = (u) => {
    setUsuarioSeleccionado(u);
    setBusqueda(`${u.Nom_Usuario} ${u.Ape_Usuario}`);
    const esExterno = u.roles?.includes('Aprendiz Externo') && !u.roles?.includes('Aprendiz Interno');
    setTipo(esExterno ? 'Almuerzo' : 'Almuerzo');
  };

  const handleRegistrar = async () => {
    if (!usuarioSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un aprendiz primero' });
      return;
    }

    try {
      setIsLoading(true);
      const qrData = JSON.stringify({
        Id_Usuario: usuarioSeleccionado.Id_Usuario,
        Tipo: tipo,
        Excepcional: true
      });

      await axios.post('http://localhost:8000/api/Reservas/excepcional', {
        Id_Usuario: usuarioSeleccionado.Id_Usuario,
        Tipo: tipo,
        Tex_Qr: qrData
      });

      setMensaje({ tipo: 'exito', texto: `Reserva excepcional registrada para ${usuarioSeleccionado.Nom_Usuario} ${usuarioSeleccionado.Ape_Usuario}` });
      setUsuarioSeleccionado(null);
      setBusqueda('');
      setTipo('Almuerzo');
      fetchReservasExcepcionales();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.message || 'Error al registrar' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1861c1]">Módulo de Novedades</h1>
        <p className="text-gray-500 text-sm mt-1">Registra reservas excepcionales para aprendices que no alcanzaron a reservar antes de las 6:00 p.m.</p>
      </div>

      {mensaje && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Panel izquierdo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#1861c1]/10 rounded-lg flex items-center justify-center text-[#1861c1]">
              <i className="fas fa-plus text-sm"></i>
            </span>
            Registrar Reserva Excepcional
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Buscar aprendiz</label>
            <input
              type="text"
              placeholder="Nombre o número de documento..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setUsuarioSeleccionado(null); setTipo('Almuerzo'); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#1861c1]"
            />

            {busqueda && !usuarioSeleccionado && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                {usuariosFiltrados.length === 0 ? (
                  <p className="text-sm text-gray-400 p-3 text-center">No se encontraron aprendices</p>
                ) : (
                  usuariosFiltrados.map(u => (
                    <button
                      key={u.Id_Usuario}
                      onClick={() => handleSeleccionarUsuario(u)}
                      className="w-full text-left px-4 py-3 hover:bg-[#f0f4ff] transition text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium text-gray-700">{u.Nom_Usuario} {u.Ape_Usuario}</span>
                      <span className="text-gray-400 ml-2">— {u.NumDoc_Usuario}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${u.roles?.includes('Aprendiz Externo') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {u.roles?.includes('Aprendiz Externo') ? 'Externo' : 'Interno'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {usuarioSeleccionado && (
            <div className="mb-4 bg-[#f0f4ff] rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1861c1]">{usuarioSeleccionado.Nom_Usuario} {usuarioSeleccionado.Ape_Usuario}</p>
                <p className="text-xs text-gray-500">{usuarioSeleccionado.TipDoc_Usuario} — {usuarioSeleccionado.NumDoc_Usuario}</p>
                <p className="text-xs text-gray-400">{usuarioSeleccionado.roles?.join(', ')}</p>
              </div>
              <button onClick={() => { setUsuarioSeleccionado(null); setBusqueda(''); setTipo('Almuerzo'); }} className="text-gray-400 hover:text-red-400 transition">
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Tipo de comida</label>
            <div className="flex gap-2">
              {tiposDisponibles(usuarioSeleccionado).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tipo === t ? 'bg-[#1861c1] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {usuarioSeleccionado?.roles?.includes('Aprendiz Externo') && !usuarioSeleccionado?.roles?.includes('Aprendiz Interno') && (
              <p className="text-xs text-orange-500 mt-1">* Los aprendices externos solo pueden reservar almuerzo</p>
            )}
          </div>

          <button
            onClick={handleRegistrar}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold bg-[#42b72a] text-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <><i className="fas fa-check-circle"></i> Registrar Novedad</>
            )}
          </button>
        </div>

        {/* Panel derecho */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
        <span className="w-8 h-8 bg-[#42b72a]/10 rounded-lg flex items-center justify-center text-[#42b72a]">
            <i className="fas fa-list text-sm"></i>
        </span>
        Novedades del día
    </div>
    {reservasExcepcionales.length > 0 && (
        <span className="bg-[#1861c1] text-white text-xs font-bold px-3 py-1 rounded-full">
            {reservasExcepcionales.length} registradas
        </span>
    )}
</h2>

          {reservasExcepcionales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <i className="fas fa-inbox text-4xl mb-2"></i>
              <p className="text-sm">Sin novedades registradas</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {reservasExcepcionales.map(r => {
    const usuarioInfo = usuarios.find(u => u.Id_Usuario === r.Id_Usuario);
    const esExterno = usuarioInfo?.roles?.includes('Aprendiz Externo') && !usuarioInfo?.roles?.includes('Aprendiz Interno');
    
    return (
        <div key={r.Id_Reserva} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
                <p className="text-sm font-medium text-gray-700">
                    {r.usuario ? `${r.usuario.Nom_Usuario} ${r.usuario.Ape_Usuario}` : `Usuario #${r.Id_Usuario}`}
                </p>
                <p className="text-xs text-gray-400">{r.Tipo} — {r.Fec_Reserva}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-1 rounded-lg">Excepcional</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${esExterno ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                    {esExterno ? 'Externo' : 'Interno'}
                </span>
            </div>
        </div>
    );
})}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NovedadesCoordinador;