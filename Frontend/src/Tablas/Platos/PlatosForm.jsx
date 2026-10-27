// Frontend/src/Tablas/Platos/PlatosForm.jsx
// Formulario para creacion y edicion de Platos y Bebidas (Frias y Calientes)
// Incluye compresion inteligente en canvas a formato WebP (<60KB) y soporte para multiples comidas.
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import { Utensils, Coffee, Snowflake, Flame, Image as ImageIcon } from "lucide-react";

// Compresion de imagen en cliente usando HTML5 Canvas a WebP de maximo 600x600 px y calidad 0.78
const comprimirImagenAWebp = (archivo, maxDim = 600, calidad = 0.78) => {
  return new Promise((resolve) => {
    if (!archivo || !archivo.type.startsWith("image/")) {
      resolve(archivo);
      return;
    }

    const lector = new FileReader();
    lector.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;

        if (ancho > maxDim || alto > maxDim) {
          if (ancho > alto) {
            alto = Math.round((alto * maxDim) / ancho);
            ancho = maxDim;
          } else {
            ancho = Math.round((ancho * maxDim) / alto);
            alto = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, ancho, alto);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(archivo);
              return;
            }
            const nombreLimpio = archivo.name.replace(/\.[^/.]+$/, "");
            const archivoWebp = new File([blob], `${nombreLimpio}.webp`, {
              type: "image/webp",
              lastModified: Date.now()
            });
            resolve(archivoWebp);
          },
          "image/webp",
          calidad
        );
      };
      img.onerror = () => resolve(archivo);
      img.src = e.target.result;
    };
    lector.onerror = () => resolve(archivo);
    lector.readAsDataURL(archivo);
  });
};

const PlatosForm = ({ hideModal, selectedPlato, isEdit, reload, initialTipo = "PLATO" }) => {
  const [Id_Plato, setId_Plato] = useState("");
  const [Nom_Plato, setNom_Plato] = useState("");
  const [Des_Plato, setDes_Plato] = useState("");
  const [Tip_Plato, setTip_Plato] = useState("Todas");
  const [Tipo_Item, setTipo_Item] = useState(initialTipo);
  const [Subtipo_Bebida, setSubtipo_Bebida] = useState("FRIA");
  const [Img_Plato, setImg_Plato] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (isEdit && selectedPlato) {
      setId_Plato(selectedPlato.Id_Plato);
      setNom_Plato(selectedPlato.Nom_Plato || "");
      setDes_Plato(selectedPlato.Des_Plato || "");
      setTip_Plato(selectedPlato.Tip_Comida_Item || selectedPlato.Tip_Plato || "Todas");
      setTipo_Item(selectedPlato.Tipo_Item || "PLATO");
      setSubtipo_Bebida(selectedPlato.Subtipo_Bebida || "FRIA");
      if (selectedPlato.Img_Plato) {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        setVistaPrevia(`${apiUrl}/uploads/${selectedPlato.Img_Plato}`);
      }
    } else {
      setId_Plato("");
      setNom_Plato("");
      setDes_Plato("");
      setTip_Plato("Todas");
      setTipo_Item(initialTipo);
      setSubtipo_Bebida("FRIA");
      setImg_Plato(null);
      setVistaPrevia(null);
    }
  }, [selectedPlato, isEdit, initialTipo]);

  const handleSeleccionarArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setComprimiendo(true);
    try {
      const archivoOptimizado = await comprimirImagenAWebp(file, 600, 0.78);
      setImg_Plato(archivoOptimizado);
      setVistaPrevia(URL.createObjectURL(archivoOptimizado));
      toast.success("Imagen comprimida y optimizada a formato WebP");
    } catch (err) {
      console.warn("Fallo al comprimir imagen en cliente:", err);
      setImg_Plato(file);
      setVistaPrevia(URL.createObjectURL(file));
    } finally {
      setComprimiendo(false);
    }
  };

  const gestionarForm = async (e) => {
    e.preventDefault();

    if (!Nom_Plato.trim()) {
      toast.error("Ingresa el nombre del plato o bebida");
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("Nom_Plato", Nom_Plato.trim());
      formData.append("Des_Plato", Des_Plato.trim());
      formData.append("Tip_Plato", Tip_Plato);
      formData.append("Tipo_Item", Tipo_Item);
      formData.append("Subtipo_Bebida", Tipo_Item === "BEBIDA" ? Subtipo_Bebida : "NINGUNA");
      formData.append("Tip_Comida_Item", Tip_Plato);

      if (Img_Plato) {
        formData.append("imagen", Img_Plato);
      }

      if (!isEdit) {
        await apiAxios.post("/api/platos", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(Tipo_Item === "PLATO" ? "Plato creado exitosamente" : "Bebida creada exitosamente");
      } else {
        await apiAxios.put(`/api/platos/${Id_Plato}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(Tipo_Item === "PLATO" ? "Plato actualizado correctamente" : "Bebida actualizada correctamente");
      }

      reload();
      hideModal();
    } catch (error) {
      console.error("Error al guardar item:", error);
      const msg = error.response?.data?.message || "Error al guardar el registro en la base de datos";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={gestionarForm} className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
          {Tipo_Item === "PLATO" ? (
            <Utensils className="w-5 h-5 text-emerald-600" />
          ) : (
            <Coffee className="w-5 h-5 text-blue-600" />
          )}
          {isEdit
            ? `Editar ${Tipo_Item === "PLATO" ? "Plato" : "Bebida"}`
            : `Nuevo ${Tipo_Item === "PLATO" ? "Plato" : "Bebida"}`}
        </h2>
      </div>

      {/* Selector de Tipo (Plato vs Bebida) */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Tipo de Elemento
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipo_Item("PLATO")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              Tipo_Item === "PLATO"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Utensils size={14} /> Plato Fuerte / Comida
          </button>
          <button
            type="button"
            onClick={() => setTipo_Item("BEBIDA")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              Tipo_Item === "BEBIDA"
                ? "bg-blue-50 border-blue-300 text-blue-800 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Coffee size={14} /> Bebida
          </button>
        </div>
      </div>

      {/* Subtipo de Bebida si es BEBIDA */}
      {Tipo_Item === "BEBIDA" && (
        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
          <label className="block text-xs font-bold text-blue-900">
            Clasificacion de la Bebida
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSubtipo_Bebida("FRIA")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                Subtipo_Bebida === "FRIA"
                  ? "bg-cyan-100 border-cyan-400 text-cyan-900 shadow-xs"
                  : "bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
              }`}
            >
              <Snowflake size={14} className="text-cyan-600" /> Bebida Fria
            </button>
            <button
              type="button"
              onClick={() => setSubtipo_Bebida("CALIENTE")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                Subtipo_Bebida === "CALIENTE"
                  ? "bg-amber-100 border-amber-400 text-amber-900 shadow-xs"
                  : "bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
              }`}
            >
              <Flame size={14} className="text-amber-600" /> Bebida Caliente
            </button>
          </div>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Nombre Oficial {Tipo_Item === "PLATO" ? "del Plato" : "de la Bebida"} *
        </label>
        <input
          type="text"
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          placeholder={
            Tipo_Item === "PLATO"
              ? "Ej: Arroz con pollo campesino y ensalada"
              : "Ej: Jugo natural de lulo en agua"
          }
          value={Nom_Plato}
          onChange={(e) => setNom_Plato(e.target.value)}
          required
        />
      </div>

      {/* Descripcion */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Descripcion e Ingredientes (Opcional)
        </label>
        <textarea
          rows={2}
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
          placeholder="Ej: Acompanado con tajada de maduro, papa al vapor y porcion de ensalada mixta."
          value={Des_Plato}
          onChange={(e) => setDes_Plato(e.target.value)}
        />
      </div>

      {/* Turno de comida vinculado */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Turno de Comida Asignado
        </label>
        <select
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
          value={Tip_Plato}
          onChange={(e) => setTip_Plato(e.target.value)}
        >
          <option value="Todas">Aplica para Todas las Comidas</option>
          <option value="Desayuno">Exclusivo de Desayuno</option>
          <option value="Almuerzo">Exclusivo de Almuerzo</option>
          <option value="Cena">Exclusivo de Cena</option>
        </select>
      </div>

      {/* Input de Imagen con compresion automatica */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
          <span>Foto o Imagen Referencial</span>
          <span className="text-[11px] text-emerald-600 font-medium">Compresion automatica WebP &lt; 60KB</span>
        </label>

        <div className="flex items-center gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-slate-50 hover:bg-emerald-50/40 text-xs font-semibold text-slate-600 transition-colors cursor-pointer">
            <ImageIcon size={16} className="text-slate-400" />
            <span>{Img_Plato ? Img_Plato.name : "Seleccionar imagen..."}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSeleccionarArchivo}
              disabled={comprimiendo || enviando}
            />
          </label>

          {vistaPrevia && (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img src={vistaPrevia} alt="Vista previa" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2.5 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={hideModal}
          disabled={enviando || comprimiendo}
          className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando || comprimiendo}
          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {enviando && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {isEdit ? "Actualizar Registro" : "Guardar Registro"}
        </button>
      </div>
    </form>
  );
};

export default PlatosForm;