import apiAxios from '../../api/axiosConfig';
import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import UsuariosForm from './UsuariosForm.jsx';
import {
  Users, Search, CheckCircle, XCircle, Filter, AlertTriangle, ShieldOff, ShieldCheck, History, X
} from 'lucide-react';

const EstadoBadge = ({ estado }) => {
  const activo = estado === 'Activo' || estado === 'activo' || estado === 'En Formacion';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: activo ? '#d1fae5' : '#fee2e2',
      color: activo ? '#065f46' : '#991b1b',
    }}>
      {activo ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {estado || '—'}
    </span>
  );
};

const SancionBadge = ({ sancionado }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
    background: sancionado ? '#fef2f2' : '#f0fdf4',
    color: sancionado ? '#dc2626' : '#16a34a',
    border: `1px solid ${sancionado ? '#fca5a5' : '#86efac'}`,
  }}>
    {sancionado ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
    {sancionado ? 'Sancionado' : 'Activo'}
  </span>
);

const Aprendices = () => {
  const [Usuarios, setUsuarios] = useState([]);
  const [TodasReservas, setTodasReservas] = useState([]);
  
  const [filterText, setFilterText] = useState('');
  const [filtroReserva, setFiltroReserva] = useState('todos');
  const [filtroSancion, setFiltroSancion] = useState('todos');
  const [filtroRol, setFiltroRol] = useState('todos'); // Interno / Externo
  
  const [selectedUsuario, setselectedUsuario] = useState(null);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [actualizandoSancion, setActualizandoSancion] = useState(null);

  const toggleSancion = async (usuario) => {
    const nuevo = usuario.San_Usuario === 'Si' ? 'No' : 'Si';
    const accion = nuevo === 'Si' ? 'sancionar' : 'quitar la sanción de';
    if (!window.confirm(`¿Deseas ${accion} a ${usuario.Nom_Usuario} ${usuario.Ape_Usuario}?`)) return;
    setActualizandoSancion(usuario.Id_Usuario);
    try {
      await apiAxios.patch(`/Usuarios/${usuario.Id_Usuario}/sancion`, { San_Usuario: nuevo });
      setUsuarios(prev =>
        prev.map(u => u.Id_Usuario === usuario.Id_Usuario ? { ...u, San_Usuario: nuevo } : u)
      );
      if (usuarioDetalle?.Id_Usuario === usuario.Id_Usuario) {
        setUsuarioDetalle(prev => ({ ...prev, San_Usuario: nuevo }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al actualizar la sanción');
    } finally {
      setActualizandoSancion(null);
    }
  };

  const columnsTable = [
    { name: 'Documento', selector: r => r.NumDoc_Usuario, width: '110px', cell: r => <span style={{ fontSize: 12, fontWeight: 600 }}>{r.NumDoc_Usuario}</span> },
    {
      name: 'Aprendiz',
      selector: r => `${r.Nom_Usuario} ${r.Ape_Usuario}`,
      sortable: true,
      grow: 2,
      cell: r => {
        const nombre = `${r.Nom_Usuario || ''} ${r.Ape_Usuario || ''}`.trim();
        const sancionado = r.San_Usuario === 'Si';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 0' }}>
            <p style={{ fontWeight: 600, color: sancionado ? '#dc2626' : '#1f2937', fontSize: 13, margin: 0 }}>{nombre}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
              {r.roles?.join(' · ') || 'Sin rol'}
            </p>
          </div>
        );
      },
    },
    {
      name: 'Reserva Hoy',
      width: '120px',
      cell: r => (
        <span style={{
          background: r.tieneReserva ? '#d1fae5' : '#fee2e2',
          color: r.tieneReserva ? '#065f46' : '#991b1b',
          borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 600,
        }}>
          {r.estadoReserva}
        </span>
      ),
    },
    {
      name: 'Sanción',
      width: '110px',
      cell: r => <SancionBadge sancionado={r.San_Usuario === 'Si'} />,
      sortable: false,
    },
    {
      name: 'Acciones',
      width: '240px',
      cell: row => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setUsuarioDetalle(row)}
            style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <History size={12} /> Historial
          </button>
          <button
            style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => editUsuario(row)}
          >
            Editar
          </button>
          <button
            disabled={actualizandoSancion === row.Id_Usuario}
            onClick={() => toggleSancion(row)}
            style={{
              background: row.San_Usuario === 'Si' ? '#d1fae5' : '#fef2f2',
              color: row.San_Usuario === 'Si' ? '#065f46' : '#dc2626',
              border: `1px solid ${row.San_Usuario === 'Si' ? '#6ee7b7' : '#fca5a5'}`,
              borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              opacity: actualizandoSancion === row.Id_Usuario ? 0.6 : 1,
            }}
            title={row.San_Usuario === 'Si' ? 'Quitar sanción' : 'Sancionar'}
          >
            {row.San_Usuario === 'Si' ? '✓ Quitar' : '⚠ Sancionar'}
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => { getAllUsuarios(); }, []);

  const getAllUsuarios = async () => {
    setCargando(true);
    try {
      const usuariosRes = await apiAxios.get('/Usuarios/aprendices');
      let aprendices = Array.isArray(usuariosRes.data) ? usuariosRes.data : [];

      aprendices = aprendices.filter(u => {
        const roles = u.roles || u.rolesUsuario?.map(r => r.rol?.Nom_Rol) || [];
        return roles.some(r => ['Aprendiz Interno', 'Aprendiz Externo'].includes(r));
      });

      let reservas = [];
      try {
        const reservasRes = await apiAxios.get('/Reservas/Todas');
        reservas = Array.isArray(reservasRes.data) ? reservasRes.data : [];
        setTodasReservas(reservas);
      } catch { /* ignorar */ }

      const aprendicesFull = aprendices.map(user => {
        const reserva = reservas.find(
          r => r.Id_Usuario === user.Id_Usuario && (r.Estado === 'Generada' || r.Estado === 'Verificada')
        );
        return {
          ...user,
          tieneReserva: !!reserva,
          estadoReserva: reserva?.Estado || 'Sin reserva',
          tipoComida: reserva?.Tipo || '—',
        };
      });

      setUsuarios(aprendicesFull);
    } catch (error) {
      console.error('Error cargando aprendices:', error);
    } finally {
      setCargando(false);
    }
  };

  const editUsuario = row => { setselectedUsuario(row); setIsEdit(true); setIsModalOpen(true); };
  const hideModal = () => { setIsModalOpen(false); setselectedUsuario(null); setIsEdit(false); };

  // Aplicar filtros
  let listaFiltrada = Usuarios;

  if (filtroReserva === 'con') listaFiltrada = listaFiltrada.filter(u => u.tieneReserva);
  else if (filtroReserva === 'sin') listaFiltrada = listaFiltrada.filter(u => !u.tieneReserva);

  if (filtroSancion === 'sancionados') listaFiltrada = listaFiltrada.filter(u => u.San_Usuario === 'Si');
  else if (filtroSancion === 'activos') listaFiltrada = listaFiltrada.filter(u => u.San_Usuario !== 'Si');

  if (filtroRol === 'interno') listaFiltrada = listaFiltrada.filter(u => u.roles?.includes('Aprendiz Interno'));
  else if (filtroRol === 'externo') listaFiltrada = listaFiltrada.filter(u => u.roles?.includes('Aprendiz Externo'));

  const newList = listaFiltrada.filter(a => {
    const t = filterText.toLowerCase();
    return (
      String(a.NumDoc_Usuario || '').toLowerCase().includes(t) ||
      String(a.Nom_Usuario || '').toLowerCase().includes(t) ||
      String(a.Ape_Usuario || '').toLowerCase().includes(t)
    );
  });

  const cantSancionados = Usuarios.filter(u => u.San_Usuario === 'Si').length;

  const customStyles = {
    headRow: { style: { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' } },
    rows: { style: { fontSize: 13, borderBottom: '1px solid #f3f4f6', '&:hover': { background: '#f0f9ff' } } },
    pagination: { style: { borderTop: '1px solid #e5e7eb', fontSize: 13 } },
  };

  const btnFiltro = (valor, label, bg, color, group = 'reserva') => {
    let activo = false;
    if (group === 'reserva') activo = filtroReserva === valor;
    if (group === 'sancion') activo = filtroSancion === valor;
    if (group === 'rol') activo = filtroRol === valor;

    return (
      <button
        onClick={() => {
          if (group === 'reserva') setFiltroReserva(valor);
          if (group === 'sancion') setFiltroSancion(valor);
          if (group === 'rol') setFiltroRol(valor);
        }}
        style={{
          background: activo ? bg : '#fff',
          color: activo ? color : '#6b7280',
          border: `1px solid ${activo ? 'transparent' : '#e5e7eb'}`,
          borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 16, overflow: 'hidden' }}>
        
        {/* PANEL IZQUIERDO: Tabla y Filtros */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h1 style={{ fontWeight: 700, color: '#111827', fontSize: 18, margin: 0 }}>Gestión de Aprendices</h1>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                    {Usuarios.length} totales {cantSancionados > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>({cantSancionados} sancionados)</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Búsqueda y Filtros */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o documento..."
                  style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, outline: 'none' }}
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Sanción:</span>
                  {btnFiltro('todos', 'Todos', '#e0e7ff', '#3730a3', 'sancion')}
                  {btnFiltro('sancionados', 'Sancionados', '#fef2f2', '#dc2626', 'sancion')}
                  {btnFiltro('activos', 'Activos', '#f0fdf4', '#16a34a', 'sancion')}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Rol:</span>
                  {btnFiltro('todos', 'Todos', '#e0e7ff', '#3730a3', 'rol')}
                  {btnFiltro('interno', 'Interno', '#dbeafe', '#1e40af', 'rol')}
                  {btnFiltro('externo', 'Externo', '#fef3c7', '#92400e', 'rol')}
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {cargando ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
                Cargando...
              </div>
            ) : (
              <DataTable
                columns={columnsTable}
                data={newList}
                keyField="Id_Usuario"
                pagination
                highlightOnHover
                customStyles={customStyles}
                conditionalRowStyles={[
                  { when: row => row.San_Usuario === 'Si', style: { backgroundColor: '#fff5f5' } }
                ]}
              />
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Perfil e Historial */}
        {usuarioDetalle && (
          <div style={{ width: '380px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: usuarioDetalle.San_Usuario === 'Si' ? '#fee2e2' : '#dbeafe', border: `2px solid ${usuarioDetalle.San_Usuario === 'Si' ? '#fca5a5' : '#93c5fd'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: usuarioDetalle.San_Usuario === 'Si' ? '#dc2626' : '#1d4ed8', fontWeight: 700, fontSize: 16 }}>
                      {`${usuarioDetalle.Nom_Usuario?.[0] || ''}${usuarioDetalle.Ape_Usuario?.[0] || ''}`.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>{usuarioDetalle.Nom_Usuario} {usuarioDetalle.Ape_Usuario}</h2>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>{usuarioDetalle.NumDoc_Usuario}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ fontSize: 12, margin: 0 }}><strong style={{ color: '#4b5563' }}>Ficha:</strong> {usuarioDetalle.ficha?.Num_Ficha || 'N/A'}</p>
                  <p style={{ fontSize: 12, margin: 0 }}><strong style={{ color: '#4b5563' }}>Rol:</strong> {usuarioDetalle.roles?.join(', ')}</p>
                  <p style={{ fontSize: 12, margin: 0 }}><strong style={{ color: '#4b5563' }}>Estado:</strong> <SancionBadge sancionado={usuarioDetalle.San_Usuario === 'Si'} /></p>
                </div>
              </div>
              <button onClick={() => setUsuarioDetalle(null)} style={{ background: '#e5e7eb', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={16} style={{ color: '#6366f1' }} />
                Historial de Reservas
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TodasReservas.filter(r => r.Id_Usuario === usuarioDetalle.Id_Usuario)
                  .sort((a,b) => new Date(b.Fec_Reserva) - new Date(a.Fec_Reserva))
                  .map(res => {
                    let colorEstado = '#f3f4f6';
                    let textEstado = '#374151';
                    if (res.Estado === 'Generada' || res.Estado === 'Verificada') { colorEstado = '#dbeafe'; textEstado = '#1d4ed8'; }
                    if (res.Estado === 'Consumida') { colorEstado = '#d1fae5'; textEstado = '#065f46'; }
                    if (res.Estado === 'Vencida' || res.Estado === 'Cancelada') { colorEstado = '#fee2e2'; textEstado = '#991b1b'; }

                    return (
                      <div key={res.Id_Reserva} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{res.Tipo}</span>
                          <span style={{ fontSize: 11, background: colorEstado, color: textEstado, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{res.Estado}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{new Date(res.Fec_Reserva).toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>#{res.Id_Reserva.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                    );
                  })
                }
                
                {TodasReservas.filter(r => r.Id_Usuario === usuarioDetalle.Id_Usuario).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                    <p style={{ fontSize: 13 }}>Este aprendiz no tiene reservas registradas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={hideModal} />
          <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: 20, zIndex: 10, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Editar Aprendiz</h2>
              <button onClick={hideModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              <UsuariosForm hideModal={hideModal} UsuarioSeleccionado={selectedUsuario} Editar={isEdit} reload={getAllUsuarios} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </>
  );
};

export default Aprendices;