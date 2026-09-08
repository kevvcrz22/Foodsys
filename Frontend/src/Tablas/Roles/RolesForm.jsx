import { useState, useEffect } from "react";
import apiNode from "../../api/axiosConfig";
import toast from "react-hot-toast";

const RolesForm = ({ hideModal, rol, actualizarLista }) => {
  const [Nom_Rol, setNom_Rol] = useState("");
  const [loading, setLoading] = useState(false);

  const opcionesRoles = [
    "Administrador",
    "Coordinador",
    "Supervisor",
    "Cocina",
    "Bienestar",
    "Monitor",
    "Aprendiz Interno",
    "Aprendiz Externo",
    "Pasante Interno",
    "Pasante Externo",
  ];

  // Al abrir el modal, cargar el rol existente o limpiar
  useEffect(() => {
    if (rol && rol.Nom_Rol) {
      setNom_Rol(rol.Nom_Rol);
    } else {
      setNom_Rol("");
    }
  }, [rol]);

  const gestionarForm = async (e) => {
    e.preventDefault();

    const nombreLimpio = Nom_Rol.trim();
    if (!nombreLimpio) {
      toast.error("Por favor ingresa un nombre para el rol");
      return;
    }

    setLoading(true);
    try {
      if (rol && rol.Id_Rol) {
        // Actualizar rol existente
        await apiNode.put(`/api/Roles/${rol.Id_Rol}`, { Nom_Rol: nombreLimpio });
        toast.success("Rol actualizado correctamente");
      } else {
        // Crear nuevo rol
        await apiNode.post("/api/Roles/", { Nom_Rol: nombreLimpio });
        toast.success("Rol creado correctamente");
      }

      actualizarLista();
      hideModal();
    } catch (error) {
      console.error("Error al guardar rol:", error);
      const msg = error.response?.data?.message || "Ocurrió un error al procesar el rol";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Nombre del Rol *
        </label>
        <input
          type="text"
          list="roles-sugeridos"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all"
          placeholder="Ej: Cocina, Pasante Interno, Seguridad..."
          value={Nom_Rol}
          onChange={(e) => setNom_Rol(e.target.value)}
          required
        />
        <datalist id="roles-sugeridos">
          {opcionesRoles.map((sug) => (
            <option key={sug} value={sug} />
          ))}
        </datalist>
        <p className="text-[11px] text-slate-400 mt-1.5">
          Puedes escribir un rol nuevo personalizado o seleccionar una sugerencia.
        </p>
      </div>

      <div className="flex gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-violet-200 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Guardando..." : rol && rol.Id_Rol ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </form>
  );
};

export default RolesForm;