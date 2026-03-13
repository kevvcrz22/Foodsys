import { useState } from "react";
import apiAxios from "../../api/axiosConfig";

const Perfil = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [seccionActiva, ] = useState("informacion");
  const [telefono, setTelefono] = useState(usuario?.Tel_Usuario || "");
  const [correo, setCorreo] = useState(usuario?.Cor_Usuario || "");
  const [password, setPassword] = useState("");

  /* ───────────── ACTUALIZAR DATOS ───────────── */
  const guardarDatos = async () => {
    if (!usuario?.Id_Usuario) {
      alert("Usuario no disponible");
      return;
    }

    try {
      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}`, {
        Tel_Usuario: telefono,
        Cor_Usuario: correo,
      });

      alert("Datos actualizados correctamente");

      // Actualiza también el localStorage
      const usuarioActualizado = {
        ...usuario,
        Tel_Usuario: telefono,
        Cor_Usuario: correo,
      };
      localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
    } catch (error) {
      alert("Error al actualizar la información");
      console.error(error);
    }
  };

  /* ───────────── CAMBIAR CONTRASEÑA ───────────── */
  const cambiarPassword = () => {
    if (!password) {
      alert("Ingrese una contraseña");
      return;
    }

    // Aquí deberías hacer petición real al backend
    alert("Contraseña actualizada");
    setPassword("");
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen p-4 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">

        {/* ───────────── INFORMACIÓN ───────────── */}
        {seccionActiva === "informacion" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Mi Perfil
              </h1>
              <p className="text-gray-600">
                Gestiona tu información personal y seguridad
              </p>
            </div>

            {/* Información Personal */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Información personal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programa de formación
                  </label>
                  <input
                    type="text"
                    value={usuario?.Programa || "No asignado"}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ficha
                  </label>
                  <input
                    type="text"
                    value={usuario?.ficha?.Num_Ficha || "Sin ficha"}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={guardarDatos}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                           text-white font-medium rounded-lg transition-all"
              >
                Guardar cambios
              </button>
            </div>

            {/* Seguridad */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border-l-4 border-blue-600">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Seguridad
              </h2>

              <div className="max-w-md">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <button
                  onClick={cambiarPassword}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                             text-white font-medium rounded-lg transition-all"
                >
                  Cambiar contraseña
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Perfil;