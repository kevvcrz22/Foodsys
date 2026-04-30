import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UsuariosForm from "./UsuariosForm.jsx";
import { CheckCircle, XCircle } from "lucide-react";

/* Badge estado usuario */
const EstadoBadge = ({ estado }) => {
  const activo = estado === "Activo" || estado === "activo";
  return (
    <span
      className={`px-2 py-1 text-xs rounded ${
        activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {activo ? <CheckCircle size={12} /> : <XCircle size={12} />} {estado}
    </span>
  );
};

const Aprendices = () => {
  const [Usuarios, setUsuarios] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filtroReserva, setFiltroReserva] = useState("todos");

  const [selectedUsuario, setselectedUsuario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [detalleReservas, setDetalleReservas] = useState([]);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState(null);

  /* COLUMNAS */
  const columnsTable = [
    { name: "ID", selector: (r) => r.Id_Usuario, width: "70px" },

    {
      name: "Nombre",
      selector: (r) => `${r.Nom_Usuario} ${r.Ape_Usuario}`,
      sortable: true,
    },

    { name: "Documento", selector: (r) => r.NumDoc_Usuario },

    { name: "Teléfono", selector: (r) => r.Tel_Usuario },

    // 🔥 FICHA (NO SE BORRA)
    {
      name: "Ficha",
      selector: (r) => r.ficha?.Num_Ficha || "Sin ficha",
    },

    // 🔥 PROGRAMA (DESDE FICHA)
    {
      name: "Programa",
      selector: (r) =>
        r.ficha?.Programa?.Nom_Programa || "Sin programa",
      sortable: true,
    },

    // 🔥 ESTADO RESERVA
    {
      name: "Reserva",
      cell: (r) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            r.tieneReserva
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {r.estadoReserva}
        </span>
      ),
    },

    // 🔥 TIPO COMIDA
    {
      name: "Comida",
      selector: (r) => r.tipoComida,
    },

    {
      name: "Estado",
      cell: (r) => <EstadoBadge estado={r.Est_Usuario} />,
    },

    {
      name: "Acciones",
      cell: (row) => (
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded"
          onClick={() => editUsuario(row)}
        >
          Editar
        </button>
      ),
    },
    {
  name: "Detalle",
  cell: (row) => (
    <button
      className="bg-purple-500 text-white px-2 py-1 rounded"
      onClick={() => verDetalle(row)}
    >
      Ver
    </button>
  ),
}
  ];

  useEffect(() => {
    getAllUsuarios();
  }, []);

  /* 🔥 TRAER DATOS */
  const getAllUsuarios = async () => {
    try {
      const usuariosRes = await apiAxios.get("/api/Usuarios/aprendices");
      const reservasRes = await apiAxios.get("/api/Reservas/");
      console.log(usuariosRes.data[0]);

      const aprendices = usuariosRes.data;
      // 🔹 Mapear datos
      const aprendicesFull = aprendices.map((user) => {
        const reserva = reservasRes.data.find(
          (r) =>
            r.Id_Usuario === user.Id_Usuario ||
            r.id_usuario === user.Id_Usuario &&
            r.Estado === "Generada"
        );

        return {
          ...user,
          tieneReserva: !!reserva,
          estadoReserva: reserva?.Estado || "Sin reserva",
          tipoComida: reserva?.Tipo || "—",
        };
      });

      setUsuarios(aprendicesFull);
    } catch (error) {
      console.log("🔥 ERROR RESERVAS:", error); 

  if (error.response) {
    console.log("DATA:", error.response.data);
    console.log("STATUS:", error.response.status);
    }
  }
  };

  /* EDITAR */
  const editUsuario = (row) => {
    setselectedUsuario(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setselectedUsuario(null);
    setIsEdit(false);
  };

  /* 🔥 FILTROS */
  let listaFiltrada = Usuarios;

  if (filtroReserva === "con") {
    listaFiltrada = listaFiltrada.filter((u) => u.tieneReserva === true);
  } else if (filtroReserva === "sin") {
    listaFiltrada = listaFiltrada.filter((u) => u.tieneReserva === false);
  }

  const newList = listaFiltrada.filter((a) => {
    const t = filterText.toLowerCase();
    return (
      String(a.NumDoc_Usuario || "").toLowerCase().includes(t) ||
      String(a.Nom_Usuario || "").toLowerCase().includes(t) ||
      String(a.Ape_Usuario || "").toLowerCase().includes(t)
    );
  });


  const verDetalle = async (usuario) => {
  try {
    const res = await apiAxios.get(
      `/api/reservas/reporte-aprendiz-detalle/${usuario.Id_Usuario}`
    );

    setDetalleReservas(res.data);
    setAprendizSeleccionado(usuario);
    setModalDetalle(true);

  } catch (error) {
    console.error("Error detalle:", error);
  }
};
  return (
    <>
      <div className="p-4">
        <h1 className="text-xl font-bold mb-3">Aprendices</h1>

        {/* BUSCADOR */}
        <input
          type="text"
          placeholder="Buscar..."
          className="border p-2 mb-3 w-full"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />

        {/* BOTONES */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFiltroReserva("todos")}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Todos
          </button>

          <button
            onClick={() => setFiltroReserva("con")}
            className="px-3 py-1 bg-green-200 rounded"
          >
            Con reservas
          </button>

          <button
            onClick={() => setFiltroReserva("sin")}
            className="px-3 py-1 bg-red-200 rounded"
          >
            Sin reservas
          </button>
          
        </div>

        {/* TABLA */}
        <DataTable columns={columnsTable} data={newList} pagination
        
        
        />
        
      </div>
      
      

      {/* MODAL */}
      {isModalOpen && (
        <UsuariosForm
          hideModal={hideModal}
          UsuarioSeleccionado={selectedUsuario}
          Editar={isEdit}
          reload={getAllUsuarios}
        />
      )}
      {modalDetalle && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">

    {/* fondo oscuro */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setModalDetalle(false)}
    />

    {/* contenido */}
    <div className="bg-white rounded-xl shadow-lg p-6 z-10 w-full max-w-3xl">

      <h2 className="text-lg font-bold mb-4">
        Reservas de {aprendizSeleccionado?.Nom_Usuario} {aprendizSeleccionado?.Ape_Usuario}
      </h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th>Fecha</th>
            <th>Desayuno</th>
            <th>Almuerzo</th>
            <th>Cena</th>
          </tr>
        </thead>

        <tbody>
          {detalleReservas.length > 0 ? (
            detalleReservas.map((r, i) => (
              <tr key={i} className="border-b text-center">
                <td>{r.fecha}</td>
                <td>{r.desayuno ? "✔️" : "❌"}</td>
                <td>{r.almuerzo ? "✔️" : "❌"}</td>
                <td>{r.cena ? "✔️" : "❌"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-3">
                No tiene reservas
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  </div>
)}
    </>
  );
};

export default Aprendices;