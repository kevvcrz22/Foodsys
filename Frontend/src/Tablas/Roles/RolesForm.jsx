// Frontend/src/Tablas/Roles/RolesForm.jsx
import { useState, useEffect } from "react";
import apiNode from "../../api/axiosConfig";

const RolesForm = ({ hideModal, selectedRole, actualizarLista }) => {
  const [Nom_Rol, setNom_Rol] = useState("");

  // Lista de roles validos segun requerimientos del negocio
  const opcionesRoles = [
    "Administrador",
    "Coordinador",
    "Bienestar",
    "Monitor",
    "Supervisor",
    "Cocina",
    "Aprendiz Interno",
    "Aprendiz Externo",
    "Pasante Interno",
    "Pasante Externo",
  ];

  // Carga el nombre del rol si se esta editando uno existente
  useEffect(() => {
    if (selectedRole && selectedRole.Nom_Rol) {
      setNom_Rol(selectedRole.Nom_Rol);
    } else {
      setNom_Rol("");
    }
  }, [selectedRole]);

  const gestionarForm = async (e) => {
    e.preventDefault();

    if (!Nom_Rol) {
      alert("Por favor, selecciona un rol de la lista.");
      return;
    }

    try {
      if (selectedRole && selectedRole.Id_Rol) {
        // Actualizacion de un rol existente
        await apiNode.put(`/api/Roles/${selectedRole.Id_Rol}`, { Nom_Rol });
        alert("Rol actualizado correctamente");
      } else {
        // Creacion de un nuevo rol
        await apiNode.post("/api/Roles/", { Nom_Rol });
        alert("Rol creado correctamente");
      }

      actualizarLista();
      hideModal();
    } catch (error) {
      console.error("Error al gestionar el rol:", error);
      alert("No se pudo procesar el rol. Intentalo de nuevo.");
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-5">
      <div>
        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-2">
          Nombre del Rol
        </label>
        <select
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 text-slate-700 text-sm transition-all"
          value={Nom_Rol}
          onChange={(e) => setNom_Rol(e.target.value)}
          required
        >
          <option value="">Selecciona un rol...</option>
          {opcionesRoles.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[11px] text-slate-400 italic">
          * Asegurate de elegir el rol correcto para mantener la integridad de los permisos.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 text-sm"
        >
          {selectedRole && selectedRole.Id_Rol ? "Actualizar Rol" : "Registrar Rol"}
        </button>
      </div>
    </form>
  );
};

export default RolesForm;