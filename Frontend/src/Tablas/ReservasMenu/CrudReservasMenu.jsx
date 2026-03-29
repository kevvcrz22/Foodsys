import apiAxios from "../../api/axiosConfig.js";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import ReservasMenuForm from "./ReservasMenuForm";
import { Pencil, Plus } from "lucide-react";

const CrudReservasMenu = () => {

  const [data, setData] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columnsTable = [
    { name: "ID", selector: r => r.Id_ReservaMenu, sortable: true },
    { name: "Reserva", selector: r => r.Id_Reserva },
    { name: "Menú", selector: r => r.menu?.Id_Menu },
    { name: "Fecha Menú", selector: r => r.menu?.Fec_Menu },
    { name: "Tipo", selector: r => r.menu?.Tip_Menu },
    {
      name: "Acciones",
      cell: row => (
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          onClick={() => editItem(row)}
        >
          <Pencil size={14}/> Editar
        </button>
      )
    }
  ];

  useEffect(() => {
    getAll();
  }, []);

  const getAll = async () => {
    try {
      const res = await apiAxios.get("/api/reservasmenu");
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const editItem = (row) => {
    setSelectedItem(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const newList = data.filter(item => {
    const t = filterText.toLowerCase();
    return (
      item.Id_Reserva?.toString().includes(t) ||
      item.menu?.Tip_Menu?.toLowerCase().includes(t)
    );
  });

  const hideModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setIsEdit(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">

      <div className="flex justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <button
          onClick={() => {
            setSelectedItem(null);
            setIsEdit(false);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16}/> Nuevo
        </button>
      </div>

      <DataTable
        title="Reservas - Menú"
        columns={columnsTable}
        data={newList}
        pagination
        highlightOnHover
        striped
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center">
          <div className="fixed inset-0 bg-black/30" onClick={hideModal}/>
          <div className="bg-white p-6 rounded-xl shadow-xl z-10 w-full max-w-lg">
            <ReservasMenuForm
              hideModal={hideModal}
              data={selectedItem}
              isEdit={isEdit}
              reload={getAll}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default CrudReservasMenu;