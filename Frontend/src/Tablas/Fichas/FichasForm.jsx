// Frontend/src/Tablas/Fichas/FichasForm.jsx
import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import toast from "react-hot-toast";
import { Calendar, Hash, BookOpen, AlertCircle } from "lucide-react";

/* ── InputField definido afuera para no perder el foco al escribir ── */
const InputField = ({ label, type, value, onChange, placeholder, required = true, icon: Icon }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-blue-500" />}
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all"
    />
  </div>
);

const FichasForm = ({ hideModal, selectedFicha, isEdit, reload }) => {
  const [Id_Ficha,        setId_Ficha]        = useState("");
  const [Num_Ficha,        setNum_Ficha]        = useState("");
  const [FecIniLec_Ficha,  setFecIniLec_Ficha]  = useState("");
  const [FecFinLec_Ficha,  setFecFinLec_Ficha]  = useState("");
  const [FecIniPra_Ficha,  setFecIniPra_Ficha]  = useState("");
  const [FecFinPra_Ficha,  setFecFinPra_Ficha]  = useState("");
  const [Id_Programa,      setId_Programa]      = useState("");
  const [Programas,        setProgramas]        = useState([]);
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    fetchProgramas();
  }, []);

  useEffect(() => {
    if (isEdit && selectedFicha) {
      setId_Ficha(selectedFicha.Id_Ficha);
      setNum_Ficha(selectedFicha.Num_Ficha || "");
      setFecIniLec_Ficha(selectedFicha.FecIniLec_Ficha?.slice(0, 10) || "");
      setFecFinLec_Ficha(selectedFicha.FecFinLec_Ficha?.slice(0, 10) || "");
      setFecIniPra_Ficha(selectedFicha.FecIniPra_Ficha?.slice(0, 10) || "");
      setFecFinPra_Ficha(selectedFicha.FecFinPra_Ficha?.slice(0, 10) || "");
      setId_Programa(selectedFicha.Id_Programa || "");
    }
  }, [selectedFicha, isEdit]);

  const fetchProgramas = async () => {
    try {
      const res = await apiAxios.get("/api/Programa");
      setProgramas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al cargar programas:", err);
      toast.error("Error al cargar la lista de programas");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Num_Ficha || !Id_Programa) {
      toast.error("Por favor completa el número de ficha y selecciona un programa.");
      return;
    }

    setLoading(true);

    const payload = {
      Num_Ficha:       parseInt(Num_Ficha, 10),
      FecIniLec_Ficha,
      FecFinLec_Ficha,
      FecIniPra_Ficha,
      FecFinPra_Ficha,
      Id_Programa:     parseInt(Id_Programa, 10),
    };

    try {
      if (isEdit) {
        await apiAxios.put(`/api/Fichas/${Id_Ficha}`, payload);
        toast.success("Ficha actualizada exitosamente");
      } else {
        await apiAxios.post("/api/Fichas/", payload);
        toast.success("Ficha creada exitosamente");
      }
      reload();
      hideModal();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Error al guardar ficha";
      console.error("Error al guardar ficha:", error.response?.data || error);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <InputField
            label="Número de Ficha"
            icon={Hash}
            type="number"
            value={Num_Ficha}
            onChange={setNum_Ficha}
            placeholder="Ej: 2503412"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <BookOpen size={12} className="text-blue-500" />
            Programa de Formación
          </label>
          <select
            value={Id_Programa}
            onChange={(e) => setId_Programa(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all appearance-none"
          >
            <option value="">Seleccione un programa...</option>
            {Programas.map((prog) => (
              <option key={prog.Id_Programa} value={prog.Id_Programa}>
                {prog.Nom_Programa}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl sm:col-span-2 flex gap-3 items-start">
          <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[12px] text-blue-700 leading-snug">
            Asegúrate de ingresar las fechas correctamente. El sistema utiliza estas fechas para validar la elegibilidad de los aprendices en el comedor.
          </p>
        </div>

        <InputField label="Inicio Lectiva" icon={Calendar} type="date" value={FecIniLec_Ficha} onChange={setFecIniLec_Ficha} />
        <InputField label="Fin Lectiva" icon={Calendar} type="date" value={FecFinLec_Ficha} onChange={setFecFinLec_Ficha} />
        <InputField label="Inicio Práctica" icon={Calendar} type="date" value={FecIniPra_Ficha} onChange={setFecIniPra_Ficha} />
        <InputField label="Fin Práctica" icon={Calendar} type="date" value={FecFinPra_Ficha} onChange={setFecFinPra_Ficha} />
      </div>

      <div className="flex gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all text-sm uppercase tracking-wide cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-wide shadow-lg shadow-blue-200 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
        >
          {loading ? "Procesando..." : isEdit ? "Actualizar" : "Registrar"}
        </button>
      </div>
    </form>
  );
};

export default FichasForm;