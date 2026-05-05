// Frontend/src/Tablas/Programas/ProgramaForm.jsx
// Formulario para crear y actualizar programas de formacion.
// Se conecta al endpoint /api/Programa del Node (sin 's' al final).
// Los campos Are_Programa y NivFor_Programa deben coincidir exactamente
// con los nombres de columna definidos en ProgramaModel.js del backend.
import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig.js";

const ProgramaForm = ({ hideModal, programa, actualizarLista }) => {

  const [Id_Programa,     setId_Programa]     = useState("");
  const [Nom_Programa,    setNom_Programa]     = useState("");
  const [Are_Programa,    setAre_Programa]     = useState("");
  const [NivFor_Programa, setNivFor_Programa]  = useState("");
  const [loading,         setLoading]          = useState(false);
  const [error,           setError]            = useState("");

  // Rellena el formulario cuando se va a editar un programa existente
  useEffect(() => {
    if (programa) {
      setId_Programa(programa.Id_Programa    || "");
      setNom_Programa(programa.Nom_Programa  || "");
      setAre_Programa(programa.Are_Programa  || "");
      setNivFor_Programa(programa.NivFor_Programa || "");
    } else {
      setId_Programa("");
      setNom_Programa("");
      setAre_Programa("");
      setNivFor_Programa("");
    }
    setError("");
  }, [programa]);

  const gestionarForm = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // El payload usa los mismos nombres de campo que la BD y el modelo de Sequelize
    const payload = {
      Nom_Programa,
      Are_Programa,
      NivFor_Programa,
    };

    try {
      if (programa) {
        // PUT /api/Programa/:id — actualiza el programa existente
        await apiAxios.put(`/api/Programa/${Id_Programa}`, payload);
        alert("Programa actualizado correctamente");
      } else {
        // POST /api/Programa — crea un nuevo programa
        await apiAxios.post("/api/Programa/", payload);
        alert("Programa creado correctamente");
      }
      actualizarLista();
      hideModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error desconocido";
      setError(msg);
      console.error("Error al guardar programa:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">

      {/* Mensaje de error visible al usuario */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Nombre del Programa
        </label>
        <input
          type="text"
          required
          placeholder="Ej: Técnico en Sistemas"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all"
          value={Nom_Programa}
          onChange={(e) => setNom_Programa(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Nivel de Formación
        </label>
        <select
          required
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all appearance-none"
          value={NivFor_Programa}
          onChange={(e) => setNivFor_Programa(e.target.value)}
        >
          <option value="">Selecciona un nivel...</option>
          {/* Los valores coinciden con el ENUM NivFor_Programa de la BD */}
          <option value="Tecnólogo">Tecnólogo</option>
          <option value="Técnico">Técnico</option>
          <option value="operario">Operario</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Área
        </label>
        <select
          required
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all appearance-none"
          value={Are_Programa}
          onChange={(e) => setAre_Programa(e.target.value)}
        >
          <option value="">Selecciona un área...</option>
          {/* Los valores coinciden con el ENUM Are_Programa de la BD */}
          <option value="Agricola">Agrícola</option>
          <option value="Agroindustria">Agroindustria</option>
          <option value="Ambiental">Ambiental</option>
          <option value="Gestion">Gestión</option>
          <option value="Mecanizacion">Mecanización</option>
          <option value="Pecuario">Pecuario</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-blue-200 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "Procesando..." : programa ? "Actualizar" : "Registrar"}
        </button>
      </div>

    </form>
  );
};

export default ProgramaForm;