import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";

const PlatosForm = ({ hideModal, selectedPlato, isEdit, reload }) => {

  const [Id_Plato, setId_Plato] = useState("");
  const [Nom_Plato, setNom_Plato] = useState("");
  const [Des_Plato, setDes_Plato] = useState("");
  const [Tip_Plato, setTip_Plato] = useState("");
  const [Img_Plato, setImg_Plato] = useState(null); // 👈 NUEVO

  const [textFormButton, setTextFormButton] = useState("Guardar");

  useEffect(() => {
    if (isEdit && selectedPlato) {
      setId_Plato(selectedPlato.Id_Plato);
      setNom_Plato(selectedPlato.Nom_Plato);
      setDes_Plato(selectedPlato.Des_Plato);
      setTip_Plato(selectedPlato.Tip_Plato);
      setTextFormButton("Actualizar");
    } else {
      setId_Plato("");
      setNom_Plato("");
      setDes_Plato("");
      setTip_Plato("");
      setImg_Plato(null);
      setTextFormButton("Guardar");
    }
  }, [selectedPlato, isEdit]);

  const gestionarForm = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(); // 👈 CLAVE

      formData.append("Nom_Plato", Nom_Plato);
      formData.append("Des_Plato", Des_Plato);
      formData.append("Tip_Plato", Tip_Plato);

      if (Img_Plato) {
        formData.append("imagen", Img_Plato);
      }

      if (!isEdit) {
        await apiAxios.post("/api/platos", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        alert("Plato creado correctamente");
      } else {
        await apiAxios.put(`/api/platos/${Id_Plato}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        alert("Plato actualizado correctamente");
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
        {isEdit ? "Editar Plato" : "Nuevo Plato"}
      </h2>

      {/* Nombre */}
      <div>
        <label className="block text-sm mb-1">Nombre</label>
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg"
          value={Nom_Plato}
          onChange={(e) => setNom_Plato(e.target.value)}
          required
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm mb-1">Descripción</label>
        <textarea
          className="w-full px-4 py-2 border rounded-lg"
          value={Des_Plato}
          onChange={(e) => setDes_Plato(e.target.value)}
        />
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm mb-1">Tipo</label>
        <select
          className="w-full px-4 py-2 border rounded-lg"
          value={Tip_Plato}
          onChange={(e) => setTip_Plato(e.target.value)}
          required
        >
          <option value="">Seleccione</option>
          <option value="Desayuno">Desayuno</option>
          <option value="Almuerzo">Almuerzo</option>
          <option value="Cena">Cena</option>
        </select>
      </div>

      {/* 👇 INPUT DE IMAGEN */}
      <div>
        <label className="block text-sm mb-1">Imagen De Referencia</label>
        <input
          type="file"
          accept="image/*"
          className="w-full px-4 py-2 border rounded-lg"
          onChange={(e) => setImg_Plato(e.target.files[0])}
        />
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

export default PlatosForm;