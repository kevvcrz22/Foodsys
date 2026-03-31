import { useState } from "react";
import { Mail, Phone, Lock, User, CreditCard, GraduationCap } from "lucide-react";
import apiAxios from "../../api/axiosConfig";

const PerfilExterno = () => {

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [telefono, setTelefono] = useState(usuario?.Tel_Usuario || "");
  const [correo, setCorreo] = useState(usuario?.Cor_Usuario || "");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mensaje, setMensaje] = useState("");

  const guardarDatos = async () => {

    try {

      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}`, {
        Tel_Usuario: telefono,
        Cor_Usuario: correo
      });

      setMensaje("✅ Información actualizada correctamente");

    } catch (error) {

      setMensaje("❌ Error al actualizar la información");

    }

  };

  const cambiarPassword = async () => {

    if (password !== confirmPassword) {
      setMensaje("⚠️ Las contraseñas no coinciden");
      return;
    }

    try {

      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}/password`, {
        password: password
      });

      setMensaje("🔒 Contraseña actualizada correctamente");

      setPassword("");
      setConfirmPassword("");

    } catch (error) {

      setMensaje("❌ Error al cambiar contraseña");

    }

  };

  return (

    <div className="bg-slate-100 min-h-screen p-6">

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ALERTA */}
        {mensaje && (
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        {/* PERFIL */}

        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {usuario?.Nom_Usuario?.charAt(0) || "U"}
            </div>

            <div>

              <h2 className="font-semibold text-lg text-slate-800">
                {usuario?.Nom_Usuario || "Usuario"}
              </h2>

              <p className="text-sm text-slate-500">
                Aprendiz Externo
              </p>

              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Cuenta Activa
              </span>

            </div>

          </div>

          <div className="text-sm text-slate-500">
            {correo}
          </div>

        </div>


        {/* GRID */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* INFORMACIÓN GENERAL */}

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">

            <h3 className="font-semibold text-slate-700 mb-4">
              Información General
            </h3>

            <div className="space-y-4">

              <div className="relative">

                <User className="absolute left-3 top-3 text-slate-400" size={18}/>

                <input
                  value={usuario?.Nom_Usuario || ""}
                  disabled
                  className="w-full bg-slate-100 rounded-lg pl-10 p-2 border-0"
                />

              </div>

              <div className="relative">

                <CreditCard className="absolute left-3 top-3 text-slate-400" size={18}/>

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

              <div className="relative">

                <Lock className="absolute left-3 top-3 text-slate-400" size={18}/>

                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg pl-10 p-2 border-0 focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <div className="relative">

                <Lock className="absolute left-3 top-3 text-slate-400" size={18}/>

                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg pl-10 p-2 border-0 focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <button
                onClick={cambiarPassword}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Cambiar contraseña
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

                <GraduationCap className="absolute left-3 top-3 text-slate-400" size={18}/>

                <input
                  value={usuario?.Id_Programa || ""}
                  disabled
                  className="w-full bg-slate-100 rounded-lg pl-10 p-2 border-0"
                />

              </div>

              <div className="relative">

                <CreditCard className="absolute left-3 top-3 text-slate-400" size={18}/>

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

                <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>

                <input
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg pl-10 p-2 border-0 focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <div className="relative">

                <Phone className="absolute left-3 top-3 text-slate-400" size={18}/>

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