import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";

const MenusForm = ({ hideModal, selectedMenu, isEdit, reload }) => {

  const [Id_Menu, setId_Menu] = useState("");
  const [Fec_Menu, setFec_Menu] = useState("");
  const [Tip_Menu, setTip_Menu] = useState("");
  const [Id_Plato, setId_Plato] = useState("");

  const [platos, setPlatos] = useState([]);
  const [textFormButton, setTextFormButton] = useState("Guardar");

  useEffect(() => {
    getPlatos();
  }, []);

  useEffect(() => {
    if (isEdit && selectedMenu) {
      setId_Menu(selectedMenu.Id_Menu);
      setFec_Menu(selectedMenu.Fec_Menu?.slice(0,10));
      setTip_Menu(selectedMenu.Tip_Menu);
      setId_Plato(selectedMenu.Id_Plato);
      setTextFormButton("Actualizar");
    } else {
      setId_Menu("");
      setFec_Menu("");
      setTip_Menu("");
      setId_Plato("");
      setTextFormButton("Guardar");
    }
  }, [selectedMenu, isEdit]);

  const getPlatos = async () => {
    try {
      const res = await apiAxios.get("/api/platos");
      setPlatos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const gestionarForm = async (e) => {
    e.preventDefault();

    try {
      if (!isEdit) {
        await apiAxios.post("/api/menu", {
          Fec_Menu,
          Tip_Menu,
          Id_Plato
        });
        alert("Menú creado correctamente");
      } else {
        await apiAxios.put(`/api/menu/${Id_Menu}`, {
          Fec_Menu,
          Tip_Menu,
          Id_Plato
        });
        alert("Menú actualizado correctamente");
      }

      reload();
      hideModal();

    } catch (error) {
      console.error(error);
      alert("Error al guardar menú");
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">

      <h2 className="text-lg font-bold">
        {isEdit ? "Editar Menú" : "Nuevo Menú"}
      </h2>

      {/* Fecha */}
      <div>
        <label className="block text-sm mb-1">Fecha</label>
        <input
          type="date"
          className="w-full px-4 py-2 border rounded-lg"
          value={Fec_Menu}
          onChange={(e) => setFec_Menu(e.target.value)}
          required
        />
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm mb-1">Tipo</label>
        <select
          className="w-full px-4 py-2 border rounded-lg"
          value={Tip_Menu}
          onChange={(e) => setTip_Menu(e.target.value)}
          required
        >
          <option value="">Seleccione</option>
          <option value="Desayuno">Desayuno</option>
          <option value="Almuerzo">Almuerzo</option>
          <option value="Cena">Cena</option>
        </select>
      </div>

      {/* Plato */}
      <div>
        <label className="block text-sm mb-1">Plato</label>
        <select
          className="w-full px-4 py-2 border rounded-lg"
          value={Id_Plato}
          onChange={(e) => setId_Plato(e.target.value)}
          required
        >
          <option value="">Seleccione un plato</option>
          {platos.map(p => (
            <option key={p.Id_Plato} value={p.Id_Plato}>
              {p.Nom_Plato} ({p.Tip_Plato})
            </option>
          ))}
        </select>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          {textFormButton}
        </button>
      </div>

    </form>
  );
};

export default MenusForm;