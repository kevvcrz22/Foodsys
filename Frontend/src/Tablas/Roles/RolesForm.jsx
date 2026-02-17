import { useState, useEffect } from "react";
import apiNode from "../../api/axiosConfig";

const RolesForm = ({ hideModal, programa, actualizarLista }) => {
  const [Nom_Rol, setNom_Rol] = useState("");

  const opcionesRoles = [
    "Administrador",
    "Coordinador",
    "Bienestar",
    "Monitor",
    "Supervisor",
    "Aprendiz externo",
    "Aprendiz interno",
  ];

  // Al abrir el modal, cargar el rol existente o limpiar
  useEffect(() => {
    if (programa && programa.Nom_Rol) {
      setNom_Rol(programa.Nom_Rol);
    } else {
      setNom_Rol("");
    }
  }, [programa]);

  const gestionarForm = async (e) => {
    e.preventDefault();

    if (!Nom_Rol) {
      alert("Selecciona un rol válido");
      return;
    }

    try {
      if (programa && programa.Id_Rol) {
        // Actualizar rol existente
        await apiNode.put(`/api/Roles/${programa.Id_Rol}`, { Nom_Rol });
        alert("Rol actualizado correctamente");
      } else {
        // Crear nuevo rol
        await apiNode.post("/api/Roles/", { Nom_Rol });
        alert("Rol creado correctamente");
      }

      actualizarLista();
      hideModal();
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al procesar el rol");
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre Rol
        </label>
        <select
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={Nom_Rol}
          onChange={(e) => setNom_Rol(e.target.value)}
          required
        >
          <option value="">Selecciona uno...</option>
          {opcionesRoles.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        {programa && programa.Id_Rol ? "Actualizar" : "Enviar"}
      </button>
    </form>
  );
};

export default RolesForm;
