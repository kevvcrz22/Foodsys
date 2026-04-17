import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Lock,
  User,
  CreditCard,
  GraduationCap,
  Eye,
  EyeOff
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";

const PerfilExterno = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [telefono, setTelefono] = useState(usuario?.Tel_Usuario || "");
  const [correo, setCorreo] = useState(usuario?.Cor_Usuario || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [Nom_Programa, setNom_Programa] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [cargandoPassword, setCargandoPassword] = useState(false);

  useEffect(() => {
    const fetchPrograma = async () => {
      if (usuario?.Id_Ficha) {
        try {
          const res = await apiAxios.get(`/api/Fichas/${usuario.Id_Ficha}`);
          console.log("Respuesta ficha:", res.data);
          setNom_Programa(res.data.Programa.Nom_Programa);
        } catch (error) {
          console.log("Error:", error.response);
        }
      }
    };
    fetchPrograma();
  }, []);

  const guardarDatos = async () => {
    try {
      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}`, {
        Tel_Usuario: telefono,
        Cor_Usuario: correo,
      });
      setMensaje("✅ Información actualizada correctamente");
    } catch (error) {
      setMensaje("❌ Error al actualizar la información");
    }
  };

  const cambiarPassword = async () => {
    console.log("Click en cambiar contraseña");
    console.log("Password:", password);
    console.log("Confirm:", confirmPassword);

    if (!password || !confirmPassword) {
      setMensaje("⚠️ Debes completar ambos campos");
      return;
    }

    if (password !== confirmPassword) {
      setMensaje("⚠️ Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setMensaje("⚠️ La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    try {
      setCargandoPassword(true);

      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}`, {
        password: password
      });

      setMensaje("🔒 Contraseña actualizada correctamente");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.log("Error contraseña:", error.response);
      setMensaje("❌ Error al cambiar contraseña");
    } finally {
      setCargandoPassword(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {mensaje && (
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {usuario?.Nom_Usuario?.charAt(0) || "U"}
            </div>

            <div>
              <h2 className="font-semibold text-lg text-slate-800">
                {usuario?.Nom_Usuario || "Usuario"}
              </h2>
              <p className="text-sm text-slate-500">Aprendiz Externo</p>

              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Cuenta Activa
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* INFORMACIÓN GENERAL */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <h3 className="font-semibold text-slate-700 mb-4">
              Información General
            </h3>

            <div className="space-y-4">

              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />

                <input
                  value={usuario?.Nom_Usuario || ""}
                  disabled
                  className="w-full bg-slate-100 rounded-lg pl-10 p-2 border-0"
                />
              </div>

              <div className="relative">
                <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />

                <input
                  value={usuario?.NumDoc_Usuario || ""}
                  disabled
                  className="w-full bg-slate-100 rounded-lg pl-10 p-2 border-0"
                />
              </div>

            </div>
          </div>

          {/* SEGURIDAD */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">

            <h3 className="font-semibold text-slate-700 mb-4">
              Seguridad
            </h3>

            <div className="space-y-4">

              {/* NUEVA CONTRASEÑA */}
              <div>
                <label className="text-sm text-slate-500 mb-1 block">
                  Nueva contraseña
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />

                  <input
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Escribe tu nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg pl-10 pr-10 p-2 border-0 focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-2.5 text-slate-400"
                  >
                    {mostrarPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              <div>
                <label className="text-sm text-slate-500 mb-1 block">
                  Confirmar contraseña
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />

                  <input
                    type={mostrarConfirm ? "text" : "password"}
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg pl-10 pr-10 p-2 border-0 focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarConfirm(!mostrarConfirm)}
                    className="absolute right-3 top-2.5 text-slate-400"
                  >
                    {mostrarConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={cambiarPassword}
                disabled={cargandoPassword}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {cargandoPassword ? "Actualizando..." : "Cambiar contraseña"}
              </button>

            </div>
          </div>

          {/* INFORMACIÓN ACADÉMICA */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">

            <h3 className="font-semibold text-slate-700 mb-4">
              Información Académica
            </h3>

            <div className="space-y-4">

              <div className="relative">
                <GraduationCap className="absolute left-3 top-3 text-slate-400" size={18} />

                <input
                  value={Nom_Programa || ""}
                  disabled
                  className="w-full bg-slate-100 rounded-lg pl-10 p-2 border-0"
                />
              </div>

              <div className="relative">
                <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />

                <input
                  value={usuario?.Id_Ficha || ""}
                  disabled
                  className="w-full bg-slate-100 rounded-lg pl-10 p-2 border-0"
                />
              </div>

            </div>
          </div>

          {/* CONTACTO */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">

            <h3 className="font-semibold text-slate-700 mb-4">
              Información de Contacto
            </h3>

            <div className="space-y-4">

              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />

                <input
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg pl-10 p-2 border-0 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3 text-slate-400" size={18} />

                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg pl-10 p-2 border-0 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={guardarDatos}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Guardar cambios
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PerfilExterno;