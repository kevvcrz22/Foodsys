
import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import { User, Hash, Mail, Phone, FileText, Shield, Tag, BookOpen, Lock } from "lucide-react";

/* ── Clases base reutilizables ── */
const inputCls = [
  "w-full px-3 py-2.5 text-sm text-slate-800 bg-white",
  "border border-slate-200 rounded-lg outline-none",
  "placeholder:text-slate-300",
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
  "transition-all duration-150",
].join(" ");

const labelCls = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className={labelCls}>
      <span className="flex items-center gap-1.5">
        {Icon && <Icon size={10} className="text-slate-400" />}
        {label}
      </span>
    </label>
    {children}
  </div>
);

const UsuariosForm = ({ hideModal, UsuarioSeleccionado, Editar, reload }) => {
  const [Id_Usuario,     setId_Usuario]     = useState("");
  const [TipDoc_Usuario, setTipDoc_Usuario] = useState("");
  const [NumDoc_Usuario, setNumDoc_Usuario] = useState("");
  const [Nom_Usuario,    setNom_Usuario]    = useState("");
  const [Ape_Usuario,    setApe_Usuario]    = useState("");
  const [Gen_Usuario,    setGen_Usuario]    = useState("");
  const [Cor_Usuario,    setCor_Usuario]    = useState("");
  const [Tel_Usuario,    setTel_Usuario]    = useState("");
  const [CenCon_Usuario, setCenCon_Usuario] = useState("");
  const [Est_Usuario,    setEst_Usuario]    = useState("");
  const [San_Usuario,    setSan_Usuario]    = useState("");
  const [Id_Ficha,       setId_Ficha]       = useState("");
  const [Fichas,         setFichas]         = useState([]);
  const [textFormButton, setTextFormButton] = useState("Guardar");
  const [enviando,       setEnviando]       = useState(false);

  useEffect(() => { getFichas(); }, []);

  useEffect(() => {
    if (Editar && UsuarioSeleccionado) {
      setId_Usuario(UsuarioSeleccionado.Id_Usuario);
      setTipDoc_Usuario(UsuarioSeleccionado.TipDoc_Usuario || "");
      setNumDoc_Usuario(UsuarioSeleccionado.NumDoc_Usuario || "");
      setNom_Usuario(UsuarioSeleccionado.Nom_Usuario || "");
      setApe_Usuario(UsuarioSeleccionado.Ape_Usuario || "");
      setGen_Usuario(UsuarioSeleccionado.Gen_Usuario || "");
      setCor_Usuario(UsuarioSeleccionado.Cor_Usuario || "");
      setTel_Usuario(UsuarioSeleccionado.Tel_Usuario || "");
      setCenCon_Usuario(UsuarioSeleccionado.CenCon_Usuario || "");
      setEst_Usuario(UsuarioSeleccionado.Est_Usuario || "");
      setSan_Usuario(UsuarioSeleccionado.San_Usuario || "");
      setId_Ficha(UsuarioSeleccionado.Id_Ficha || "");
      setTextFormButton("Actualizar");
    } else {
      resetForm();
    }
  }, [UsuarioSeleccionado, Editar]);

  const resetForm = () => {
    setId_Usuario(""); setTipDoc_Usuario(""); setNumDoc_Usuario("");
    setNom_Usuario(""); setApe_Usuario(""); setGen_Usuario("");
    setCor_Usuario(""); setTel_Usuario(""); setCenCon_Usuario("");
    setEst_Usuario(""); setSan_Usuario(""); setId_Ficha("");
    setTextFormButton("Guardar");
  };

  const getFichas = async () => {
    try {
      const res = await apiAxios.get("/api/Fichas");
      setFichas(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error cargando fichas:", err); }
  };

  const gestionarForm = async (e) => {
    e.preventDefault();
    if (!TipDoc_Usuario || !NumDoc_Usuario || !Nom_Usuario || !Ape_Usuario) {
      alert("Tipo documento, N° documento, Nombres y Apellidos son requeridos.");
      return;
    }
    setEnviando(true);
    try {
      const payload = {
        TipDoc_Usuario, NumDoc_Usuario, Nom_Usuario, Ape_Usuario,
        Gen_Usuario, Cor_Usuario, Tel_Usuario, CenCon_Usuario,
        Est_Usuario, San_Usuario,
        Id_Ficha: Id_Ficha || null,
        ...(!Editar && { password: String(NumDoc_Usuario) }),
      };
      if (textFormButton === "Guardar") {
        await apiAxios.post("/api/Usuarios/", payload);
        alert("Usuario creado correctamente");
      } else {
        await apiAxios.put(`/api/Usuarios/${Id_Usuario}`, payload);
        alert("Usuario actualizado correctamente");
      }
      reload();
      hideModal();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={gestionarForm} className="flex flex-col gap-0">

      {/* ── Sección: Identificación ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
            <FileText size={11} className="text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Identificación
          </span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tipo de Documento */}
          <Field label="Tipo de Documento *" icon={Tag}>
            <select className={inputCls} value={TipDoc_Usuario}
              onChange={(e) => setTipDoc_Usuario(e.target.value)} required>
              <option value="">Seleccionar...</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="PEP">Permiso Especial de Permanencia</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="PPT">Permiso por Protección Temporal</option>
            </select>
          </Field>

          {/* N° Documento */}
          <Field label="N° Documento *" icon={Hash}>
            <input
              type="text"
              className={inputCls}
              value={NumDoc_Usuario}
              onChange={(e) => setNumDoc_Usuario(e.target.value)}
              placeholder="Ej. 1003810633"
              required
            />
            {!Editar && NumDoc_Usuario && (
              <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <Lock size={9} /> Contraseña inicial: <strong className="font-mono">{NumDoc_Usuario}</strong>
              </p>
            )}
          </Field>
        </div>
      </div>

      {/* ── Sección: Datos personales ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
            <User size={11} className="text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Datos Personales
          </span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombres *" icon={User}>
            <input type="text" className={inputCls} value={Nom_Usuario}
              onChange={(e) => setNom_Usuario(e.target.value)}
              placeholder="Ej. Kevin" required />
          </Field>

          <Field label="Apellidos *" icon={User}>
            <input type="text" className={inputCls} value={Ape_Usuario}
              onChange={(e) => setApe_Usuario(e.target.value)}
              placeholder="Ej. Cruz" required />
          </Field>

          <Field label="Género" icon={User}>
            <select className={inputCls} value={Gen_Usuario}
              onChange={(e) => setGen_Usuario(e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Prefiero no decirlo</option>
            </select>
          </Field>

          <Field label="Correo Electrónico" icon={Mail}>
            <input type="email" className={inputCls} value={Cor_Usuario}
              onChange={(e) => setCor_Usuario(e.target.value)}
              placeholder="correo@ejemplo.com" />
          </Field>

          <Field label="Teléfono" icon={Phone}>
            <input type="text" className={inputCls} value={Tel_Usuario}
              onChange={(e) => setTel_Usuario(e.target.value)}
              placeholder="Ej. 3247433621" />
          </Field>

          <Field label="Centro de Convivencia">
            <select className={inputCls} value={CenCon_Usuario}
              onChange={(e) => setCenCon_Usuario(e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Sección: Vinculación ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
            <BookOpen size={11} className="text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Vinculación
          </span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Estado">
            <select className={inputCls} value={Est_Usuario}
              onChange={(e) => setEst_Usuario(e.target.value)}>
              <option value="">Seleccionar...</option>
              {[
                "Aplazado", "Apoyo de Sostenimiento", "Cancelado", "Condicionado",
                "En Formacion", "En Induccion", "Etapa Productiva", "Retiro Voluntario",
                "Sena Empresa", "Traslado", "Visitantes", "Turno Sena Empresa",
              ].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Sanción" icon={Shield}>
            <select className={inputCls} value={San_Usuario}
              onChange={(e) => setSan_Usuario(e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>
          </Field>

          <Field label="Ficha" icon={BookOpen}>
            <select className={inputCls} value={Id_Ficha}
              onChange={(e) => setId_Ficha(e.target.value)}>
              <option value="">Sin ficha</option>
              {Fichas.map((f) => (
                <option key={f.Id_Ficha} value={f.Id_Ficha}>{f.Num_Ficha}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Aviso contraseña (solo creación) ── */}
      {!Editar && (
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-5">
          <div className="w-6 h-6 rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
            <Lock size={11} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-800 m-0 mb-0.5">Contraseña inicial automática</p>
            <p className="text-[11px] text-blue-600 m-0 leading-relaxed">
              La contraseña inicial se establece igual al número de documento.
              El usuario podrá cambiarla desde su perfil.
            </p>
          </div>
        </div>
      )}

      {/* ── Botones ── */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={hideModal}
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className={[
            "flex-[2] py-2.5 px-4 rounded-xl text-sm font-semibold text-white border-0 transition-all",
            enviando
              ? "bg-blue-400 cursor-wait"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm",
          ].join(" ")}
        >
          {enviando ? "Guardando..." : textFormButton}
        </button>
      </div>
    </form>
  );
};

export default UsuariosForm;