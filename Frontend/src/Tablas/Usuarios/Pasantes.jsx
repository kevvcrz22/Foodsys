// Frontend/src/Tablas/Usuarios/Pasantes.jsx
// Modulo dedicado para la gestion y seguimiento de Pasantes (Internos y Externos)
// Incluye semaforo de inasistencias 0/3, historial individual, exportacion Excel/PDF y guia paso a paso
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import {
  Users, Search, CheckCircle2, AlertCircle, ShieldCheck, Ban,
  History, X, Download, FileText, ChevronDown, ChevronUp,
  AlertTriangle, Phone, Mail, HelpCircle, UserCheck
} from "lucide-react";
import { exportarAExcel, exportarAPDF, confirmarExportacion } from "../../utils/exportUtils";
import GlobalLoader from "../../Components/GlobalLoader";

/* ============================================================
   BADGE DE ESTADO FORMATIVO
============================================================ */
const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "activo" || estado === "En Formacion";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
        activo
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {activo ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {estado || "—"}
    </span>
  );
};

/* ============================================================
   SEMAFORO DE INASISTENCIAS SEMANALES (0/3, 1/3, 2/3, 3/3)
============================================================ */
const SemaforoInasistencias = ({ inasistencias = 0, sancionado = false }) => {
  let badgeColor = "bg-green-50 text-green-700 border-green-200";
  let label = `${inasistencias}/3`;

  if (sancionado || inasistencias >= 3) {
    badgeColor = "bg-red-100 text-red-800 border-red-300 font-bold";
    label = `${inasistencias}/3 Sancionado`;
  } else if (inasistencias === 2) {
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse";
    label = "2/3 En Riesgo";
  } else if (inasistencias === 1) {
    badgeColor = "bg-yellow-50 text-yellow-800 border-yellow-200";
    label = "1/3";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeColor}`}
      title={`Inasistencias acumuladas en la semana actual (Lunes a Domingo): ${inasistencias}`}
    >
      {label}
    </span>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL: PASANTES
============================================================ */
const Pasantes = () => {
  const [pasantes, setPasantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos"); // 'todos', 'Pasante Interno', 'Pasante Externo'
  const [filtroSancion, setFiltroSancion] = useState("todos"); // 'todos', 'sancionados', 'activos'
  const [filtroEstado, setFiltroEstado] = useState("todos"); // 'todos', 'En Formacion', 'Inactivo'

  // Modal de historial individual
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [historialReservas, setHistorialReservas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [filtroHistorialTipo, setFiltroHistorialTipo] = useState("todos");

  // Estado para el acordeon de guia de usuario
  const [mostrarGuia, setMostrarGuia] = useState(false);

  useEffect(() => {
    cargarPasantes();
  }, []);

  const cargarPasantes = async () => {
    setCargando(true);
    try {
      const res = await apiAxios.get("/api/Usuarios/pasantes");
      const data = Array.isArray(res.data) ? res.data : [];
      setPasantes(data);
    } catch (err) {
      console.error("Error al cargar pasantes:", err);
      toast.error("Error al cargar la lista de pasantes.");
    } finally {
      setCargando(false);
    }
  };

  // Abrir modal de historial individual del pasante
  const verHistorialUsuario = async (usuario) => {
    setUsuarioDetalle(usuario);
    setCargandoHistorial(true);
    setFiltroHistorialTipo("todos");
    try {
      const res = await apiAxios.get(`/api/Reportes/aprendiz?documento=${usuario.NumDoc_Usuario}`);
      setHistorialReservas(res.data?.historial || []);
    } catch (err) {
      console.warn("Nota sobre historial individual:", err.message);
      setHistorialReservas([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Cambiar estado de sancion de un pasante
  const toggleSancion = async (usuario) => {
    const nuevo = usuario.San_Usuario === "Si" ? "No" : "Si";
    const accion = nuevo === "Si" ? "sancionar" : "levantar sancion a";
    const nombre = `${usuario.Nom_Usuario || ""} ${usuario.Ape_Usuario || ""}`.trim();

    if (!window.confirm(`¿Estas seguro de ${accion} a ${nombre}?`)) return;

    try {
      await apiAxios.patch(`/api/Usuarios/${usuario.Id_Usuario}/sancion`, { San_Usuario: nuevo });
      toast.success(`Sancion ${nuevo === "Si" ? "activada" : "retirada"} con exito`);
      cargarPasantes();
      if (usuarioDetalle && usuarioDetalle.Id_Usuario === usuario.Id_Usuario) {
        setUsuarioDetalle({ ...usuarioDetalle, San_Usuario: nuevo });
      }
    } catch (err) {
      console.error("Error al actualizar sancion:", err);
      toast.error("No se pudo actualizar la sancion.");
    }
  };

  // Filtrado reactivo en memoria para +500 registros instantaneos
  const pasantesFiltrados = pasantes.filter((p) => {
    const roles = p.roles || [];

    // Filtro por rol especifico
    if (filtroRol !== "todos" && !roles.includes(filtroRol)) return false;

    // Filtro por sancion
    if (filtroSancion === "sancionados" && p.San_Usuario !== "Si") return false;
    if (filtroSancion === "activos" && p.San_Usuario === "Si") return false;

    // Filtro por estado formativo
    if (filtroEstado !== "todos" && p.Est_Usuario !== filtroEstado) return false;

    // Filtro por texto libre
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const nombreCompleto = `${p.Nom_Usuario || ""} ${p.Ape_Usuario || ""}`.toLowerCase();
      const doc = String(p.NumDoc_Usuario || "").toLowerCase();
      const ficha = String(p.ficha?.Num_Ficha || "").toLowerCase();
      const correo = String(p.Cor_Usuario || "").toLowerCase();
      return nombreCompleto.includes(q) || doc.includes(q) || ficha.includes(q) || correo.includes(q);
    }

    return true;
  });

  const tieneFiltros =
    filtroRol !== "todos" ||
    filtroSancion !== "todos" ||
    filtroEstado !== "todos" ||
    busqueda.trim().length > 0;

  // Manejador de exportacion Excel con confirmacion inteligente
  const handleExportarExcel = async () => {
    const decision = await confirmarExportacion({
      totalOriginal: pasantes.length,
      totalFiltrado: pasantesFiltrados.length,
      tieneFiltrosActivos: tieneFiltros,
      formato: "Excel",
      nombreModulo: "pasantes"
    });

    if (!decision) return;

    const listaAExportar = decision === "filtrados" ? pasantesFiltrados : pasantes;

    const datosFormateados = listaAExportar.map((p) => ({
      "Tipo Documento": p.TipDoc_Usuario || "CC",
      "N° Documento": p.NumDoc_Usuario,
      "Nombres": p.Nom_Usuario,
      "Apellidos": p.Ape_Usuario || "",
      "Genero": p.Gen_Usuario || "",
      "Correo": p.Cor_Usuario || "",
      "Telefono": p.Tel_Usuario || "",
      "Centro Convivencia": p.CenCon_Usuario || "No",
      "Rol": (p.roles || []).join(", ") || "Pasante",
      "Ficha": p.ficha?.Num_Ficha || "Sin ficha",
      "Programa": p.ficha?.programas?.Nom_Programa || "Sin programa",
      "Estado": p.Est_Usuario || "En Formacion",
      "Sancionado": p.San_Usuario || "No",
      "Inasistencias Semana": p.inasistenciasSemana || 0,
      "Fecha Desancion": p.Fec_Desancion || "N/A"
    }));

    exportarAExcel({
      datos: datosFormateados,
      nombreArchivo: "Foodsys_Pasantes",
      nombreHoja: "Pasantes"
    });
  };

  // Manejador de exportacion PDF con confirmacion inteligente
  const handleExportarPDF = async () => {
    const decision = await confirmarExportacion({
      totalOriginal: pasantes.length,
      totalFiltrado: pasantesFiltrados.length,
      tieneFiltrosActivos: tieneFiltros,
      formato: "PDF",
      nombreModulo: "pasantes"
    });

    if (!decision) return;

    const listaAExportar = decision === "filtrados" ? pasantesFiltrados : pasantes;

    const columnas = ["Doc", "Nombre Completo", "Rol", "CenCon", "Ficha", "Estado", "Sancion", "Inasist."];
    const filas = listaAExportar.map((p) => [
      String(p.NumDoc_Usuario),
      `${p.Nom_Usuario || ""} ${p.Ape_Usuario || ""}`.trim(),
      (p.roles || []).join(", "),
      p.CenCon_Usuario === "Si" ? "Interno" : "Externo",
      String(p.ficha?.Num_Ficha || "N/A"),
      p.Est_Usuario || "Activo",
      p.San_Usuario === "Si" ? "Sancionado" : "Activo",
      `${p.inasistenciasSemana || 0}/3`
    ]);

    exportarAPDF({
      titulo: "Reporte Nominal de Pasantes - Foodsys",
      subtitulo: "Centro Agropecuario La Granja - Espinal Tolima",
      columnas,
      datos: filas,
      nombreArchivo: "Foodsys_Pasantes",
      orientacion: "landscape"
    });
  };

  // Columnas para DataTable responsivo
  const columnasTabla = [
    {
      name: "Documento",
      selector: (row) => row.NumDoc_Usuario,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <div>
          <span className="font-semibold text-gray-800 text-xs">{row.NumDoc_Usuario}</span>
          <p className="text-[10px] text-gray-400 m-0">{row.TipDoc_Usuario || "CC"}</p>
        </div>
      )
    },
    {
      name: "Pasante",
      selector: (row) => `${row.Nom_Usuario} ${row.Ape_Usuario || ""}`,
      sortable: true,
      minWidth: "170px",
      cell: (row) => (
        <button
          onClick={() => verHistorialUsuario(row)}
          className="text-left group hover:text-blue-700 transition"
          title="Ver historial de reservas"
        >
          <p className="font-bold text-gray-900 text-xs group-hover:underline m-0">
            {row.Nom_Usuario} {row.Ape_Usuario}
          </p>
          <p className="text-[10px] text-gray-400 m-0 truncate max-w-[150px]">
            {row.Cor_Usuario || "Sin correo"}
          </p>
        </button>
      )
    },
    {
      name: "Rol",
      selector: (row) => (row.roles || []).join(", "),
      sortable: true,
      width: "140px",
      cell: (row) => {
        const esInterno = (row.roles || []).includes("Pasante Interno") || row.CenCon_Usuario === "Si";
        return (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
              esInterno
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {esInterno ? "Pasante Interno" : "Pasante Externo"}
          </span>
        );
      }
    },
    {
      name: "Ficha / Programa",
      selector: (row) => row.ficha?.Num_Ficha,
      sortable: true,
      minWidth: "140px",
      cell: (row) => (
        <div>
          <span className="font-semibold text-gray-700 text-xs">
            {row.ficha?.Num_Ficha || "Sin ficha"}
          </span>
          <p className="text-[10px] text-gray-400 m-0 truncate max-w-[130px]">
            {row.ficha?.programas?.Nom_Programa || "Sin programa"}
          </p>
        </div>
      )
    },
    {
      name: "Inasistencias",
      selector: (row) => row.inasistenciasSemana || 0,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <SemaforoInasistencias
          inasistencias={row.inasistenciasSemana || 0}
          sancionado={row.San_Usuario === "Si"}
        />
      )
    },
    {
      name: "Estado",
      selector: (row) => row.Est_Usuario,
      sortable: true,
      width: "110px",
      cell: (row) => <EstadoBadge estado={row.Est_Usuario} />
    },
    {
      name: "Acciones",
      width: "140px",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => verHistorialUsuario(row)}
            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
            title="Ver historial de consumo"
          >
            <History size={15} />
          </button>
          <button
            onClick={() => toggleSancion(row)}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 ${
              row.San_Usuario === "Si"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
            title={row.San_Usuario === "Si" ? "Quitar sancion" : "Sancionar pasante"}
          >
            {row.San_Usuario === "Si" ? (
              <>
                <ShieldCheck size={13} />
                Desancionar
              </>
            ) : (
              <>
                <Ban size={13} />
                Sancionar
              </>
            )}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Cabecera del modulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <UserCheck size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 m-0">
                Modulo de Pasantes
              </h1>
              <p className="text-xs text-gray-500 m-0">
                Gestion de Pasantes Internos y Externos · Control de inasistencias y seguimiento
              </p>
            </div>
          </div>
        </div>

        {/* Botones de accion y exportacion */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportarExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95"
            title="Descargar lista en Excel (.xlsx)"
          >
            <Download size={15} />
            Exportar Excel
          </button>
          <button
            onClick={handleExportarPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95"
            title="Descargar lista en PDF (.pdf)"
          >
            <FileText size={15} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Acordeon didactico: Guia paso a paso para usuarios */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-blue-900 text-xs sm:text-sm hover:bg-blue-100/50 transition"
        >
          <span className="flex items-center gap-2">
            <HelpCircle size={18} className="text-blue-700" />
            ¿Como usar este modulo? (Guia paso a paso para el usuario)
          </span>
          {mostrarGuia ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {mostrarGuia && (
          <div className="p-4 pt-1 border-t border-blue-200 text-xs text-blue-950 space-y-2 bg-white/70">
            <p className="m-0 font-medium">
              Este modulo permite consultar y supervisar a todos los pasantes que realizan sus labores en el Centro Agropecuario "La Granja".
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>
                <strong>Pasante Interno vs Externo:</strong> Quienes viven en el Centro de Convivencia (CenCon = Si) tienen asignado el rol <em>Pasante Interno</em> y acceden a las 3 comidas. Quienes no residen en convivencia son <em>Pasante Externo</em> y acceden a almuerzo.
              </li>
              <li>
                <strong>Semaforo de Inasistencias (0/3, 1/3, 2/3, 3/3):</strong> Muestra cuantas veces el pasante reservo y no asistio a comer en la semana ISO actual (lunes a domingo). Si llega a 3 incumplimientos, el sistema lo sanciona de forma automatica bloqueando nuevas reservas.
              </li>
              <li>
                <strong>Ver Historial de Consumo:</strong> Haz clic encima del nombre del pasante o en el icono de reloj para abrir su historial completo, ver que platos ha consumido y exportar su reporte individual.
              </li>
              <li>
                <strong>Exportar Informacion:</strong> Los botones de arriba descargan exactamente los registros que tengas filtrados en pantalla (o toda la lista si no has aplicado filtros).
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Barra de filtros y busqueda */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador de texto */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o ficha..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Filtro por Rol */}
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="todos">Todos los Pasantes</option>
            <option value="Pasante Interno">Pasante Interno (Convivencia)</option>
            <option value="Pasante Externo">Pasante Externo</option>
          </select>

          {/* Filtro por Sancion */}
          <select
            value={filtroSancion}
            onChange={(e) => setFiltroSancion(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="todos">Todas las Sanciones</option>
            <option value="activos">Activos (Sin sancion)</option>
            <option value="sancionados">Sancionados (San_Usuario = Si)</option>
          </select>

          {/* Filtro por Estado Formativo */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="todos">Todos los Estados</option>
            <option value="En Formacion">En Formacion (Activos)</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>

        {/* Resumen de conteos rapidos */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>
            Mostrando <b>{pasantesFiltrados.length}</b> de <b>{pasantes.length}</b> pasantes registrados
          </span>
          {tieneFiltros && (
            <button
              onClick={() => {
                setBusqueda("");
                setFiltroRol("todos");
                setFiltroSancion("todos");
                setFiltroEstado("todos");
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla responsiva */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="py-12">
            <GlobalLoader
              mensaje="Cargando pasantes..."
              submensaje="Consultando la base de datos de Foodsys"
            />
          </div>
        ) : (
          <DataTable
            columns={columnasTabla}
            data={pasantesFiltrados}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            noDataComponent={
              <div className="py-12 text-center text-gray-400">
                <Users size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No se encontraron pasantes registrados</p>
                <p className="text-xs">Prueba ajustando los filtros de busqueda</p>
              </div>
            }
            responsive
            highlightOnHover
          />
        )}
      </div>

      {/* Modal de Historial Individual del Pasante */}
      {usuarioDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base m-0">
                    Historial de Consumo: {usuarioDetalle.Nom_Usuario} {usuarioDetalle.Ape_Usuario}
                  </h3>
                  <p className="text-xs text-gray-500 m-0">
                    Doc: {usuarioDetalle.NumDoc_Usuario} · Ficha: {usuarioDetalle.ficha?.Num_Ficha || "Sin ficha"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUsuarioDetalle(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Tarjetas de contacto rapido */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-400 block mb-0.5">Telefono:</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Phone size={13} className="text-emerald-600" />
                    {usuarioDetalle.Tel_Usuario || "No registrado"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-400 block mb-0.5">Correo:</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1 truncate">
                    <Mail size={13} className="text-blue-600" />
                    {usuarioDetalle.Cor_Usuario || "No registrado"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-400 block mb-0.5">Estado:</span>
                  <span className="font-semibold text-gray-800">
                    {usuarioDetalle.San_Usuario === "Si" ? "Sancionado" : "Activo en comedor"}
                  </span>
                </div>
              </div>

              {/* Filtro por tipo de comida */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="text-xs font-semibold text-gray-700">Filtrar por comida:</span>
                <div className="flex gap-1.5">
                  {["todos", "Desayuno", "Almuerzo", "Cena"].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setFiltroHistorialTipo(tipo)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                        filtroHistorialTipo === tipo
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tipo === "todos" ? "Todas" : tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de reservas */}
              {cargandoHistorial ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  Cargando reservas del pasante...
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {historialReservas
                    .filter((r) =>
                      filtroHistorialTipo === "todos" ? true : r.Tip_Reserva === filtroHistorialTipo
                    )
                    .map((r, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-xs hover:border-blue-200 transition"
                      >
                        <div>
                          <p className="font-bold text-gray-800 m-0">
                            {r.Fec_Reserva} · {r.Tip_Reserva}
                          </p>
                          <p className="text-gray-400 m-0 text-[11px]">
                            Plato: {r.plato?.Nom_Plato || "Plato del Dia"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.Est_Reserva === "Consumido"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.Est_Reserva === "Vencido"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {r.Est_Reserva}
                        </span>
                      </div>
                    ))}

                  {historialReservas.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      Este pasante aun no registra reservas en el sistema.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setUsuarioDetalle(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pasantes;
