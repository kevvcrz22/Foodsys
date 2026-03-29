import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";

const ReservasMenuForm = ({ hideModal, data, isEdit, reload }) => {

  const [Id_ReservaMenu, setId_ReservaMenu] = useState("");
  const [Id_Reserva, setId_Reserva] = useState("");
  const [Id_Menu, setId_Menu] = useState("");

  const [reservas, setReservas] = useState([]);
  const [menus, setMenus] = useState([]);

  const [textFormButton, setTextFormButton] = useState("Guardar");

  useEffect(() => {
    getReservas();
    getMenus();
  }, []);

  useEffect(() => {
    if (isEdit && data) {
      setId_ReservaMenu(data.Id_ReservaMenu);
      setId_Reserva(data.Id_Reserva);
      setId_Menu(data.Id_Menu);
      setTextFormButton("Actualizar");
    } else {
      setId_ReservaMenu("");
      setId_Reserva("");
      setId_Menu("");
      setTextFormButton("Guardar");
    }
  }, [data, isEdit]);

  const getReservas = async () => {
    try {
      const res = await apiAxios.get("/api/Reservas");
      setReservas(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getMenus = async () => {
    try {
      const res = await apiAxios.get("/api/menu");
      setMenus(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const gestionarForm = async (e) => {
    e.preventDefault();

    try {
      if (!isEdit) {
        await apiAxios.post("/api/reservasmenu", {
          Id_Reserva,
          Id_Menu
        });
        alert("Asignación creada correctamente");
      } else {
        await apiAxios.put(`/api/reservasmenu/${Id_ReservaMenu}`, {
          Id_Reserva,
          Id_Menu
        });
        alert("Actualizado correctamente");
      }

      reload();
      hideModal();

    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">

      <h2 className="text-lg font-bold">
        {isEdit ? "Editar Reserva-Menú" : "Nueva Reserva-Menú"}
      </h2>

      {/* Reserva */}
      <div>
        <label className="block text-sm mb-1">Reserva</label>
        <select
          className="w-full px-4 py-2 border rounded-lg"
          value={Id_Reserva}
          onChange={(e) => setId_Reserva(e.target.value)}
          required
        >
          <option value="">Seleccione</option>
          {reservas.map(r => (
            <option key={r.Id_Reserva} value={r.Id_Reserva}>
              Reserva #{r.Id_Reserva}
            </option>
          ))}
        </select>
      </div>

      {/* Menú */}
      <div>
        <label className="block text-sm mb-1">Menú</label>
        <select
          className="w-full px-4 py-2 border rounded-lg"
          value={Id_Menu}
          onChange={(e) => setId_Menu(e.target.value)}
          required
        >
          <option value="">Seleccione</option>
          {menus.map(m => (
            <option key={m.Id_Menu} value={m.Id_Menu}>
              {m.Fec_Menu} - {m.Tip_Menu} ({m.plato?.Nom_Plato})
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

export default ReservasMenuForm;