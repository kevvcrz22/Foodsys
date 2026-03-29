import apiAxios from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import MenusForm from "./MenusForm";
import { Calendar, Pencil, Plus } from "lucide-react";

const CrudMenus = () => {

  const [menus, setMenus] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columnsTable = [
    { name: "ID", selector: r => r.Id_Menu, sortable: true },
    { name: "Fecha", selector: r => r.Fec_Menu, sortable: true },
    { name: "Tipo", selector: r => r.Tip_Menu, sortable: true },
    { name: "Plato", selector: r => r.plato?.Nom_Plato },
    {
      name: "Acciones",
      cell: row => (
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          onClick={() => editMenu(row)}
        >
          <Pencil size={14}/> Editar
        </button>
      )
    }
  ];

  useEffect(() => {
    getAllMenus();
  }, []);

  const getAllMenus = async () => {
    try {
      const res = await apiAxios.get("/api/menu");
      setMenus(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const editMenu = (row) => {
    setSelectedMenu(row);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const newList = menus.filter(m => {
    const t = filterText.toLowerCase();
    return (
      m.Tip_Menu?.toLowerCase().includes(t) ||
      m.plato?.Nom_Plato?.toLowerCase().includes(t)
    );
  });

  const hideModal = () => {
    setIsModalOpen(false);
    setSelectedMenu(null);
    setIsEdit(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar menú..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <button
          onClick={() => {
            setSelectedMenu(null);
            setIsEdit(false);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16}/> Nuevo
        </button>
      </div>

      {/* Tabla */}
      <DataTable
        title="Menús"
        columns={columnsTable}
        data={newList}
        pagination
        highlightOnHover
        striped
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center">
          <div className="fixed inset-0 bg-black/30" onClick={hideModal}/>
          <div className="bg-white p-6 rounded-xl shadow-xl z-10 w-full max-w-lg">
            <MenusForm
              hideModal={hideModal}
              selectedMenu={selectedMenu}
              isEdit={isEdit}
              reload={getAllMenus}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default CrudMenus;