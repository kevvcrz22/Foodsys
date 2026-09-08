import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";

const PlatosForm = ({ hideModal, selectedPlato, isEdit, reload }) => {

  const [Id_Plato, setId_Plato] = useState("");
  const [Nom_Plato, setNom_Plato] = useState("");
  const [Des_Plato, setDes_Plato] = useState("");
  const [Tip_Plato, setTip_Plato] = useState("");
  const [Img_Plato, setImg_Plato] = useState(null);
  const [enviando, setEnviando] = useState(false);

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

    if (!Nom_Plato.trim()) {
      toast.error("Ingresa el nombre del plato");
      return;
    }

    if (!Tip_Plato) {
      toast.error("Selecciona el tipo de comida");
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();

      formData.append("Nom_Plato", Nom_Plato.trim());
      formData.append("Des_Plato", Des_Plato.trim());
      formData.append("Tip_Plato", Tip_Plato);

      if (Img_Plato) {
        formData.append("imagen", Img_Plato);
      }

      if (!isEdit) {
        await apiAxios.post("/api/platos", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Plato creado correctamente");
      } else {
        await apiAxios.put(`/api/platos/${Id_Plato}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Plato actualizado correctamente");
      }

      reload();
      hideModal();

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Error al guardar el plato";
      toast.error(msg);
    } finally {
      setEnviando(false);
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

      {/* INPUT DE IMAGEN */}
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
          disabled={enviando}
          className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          {enviando && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {textFormButton}
        </button>
      </div>

    </form>
  );
};

export default PlatosForm;