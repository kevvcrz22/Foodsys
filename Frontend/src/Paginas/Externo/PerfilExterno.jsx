import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";

const PerfilExterno = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [screen, setScreen] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreen(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screen < 640;

  // DATOS
  const [Nom_Programa, setNom_Programa] = useState(usuario?.Nom_Programa || "");
  const [Id_Ficha, setId_Ficha] = useState(usuario?.Id_Ficha || "");
  const [telefono, setTelefono] = useState(usuario?.Tel_Usuario || "");
  const [correo, setCorreo] = useState(usuario?.Cor_Usuario || "");

  // 🔥 PASSWORD
  const [password, setPassword] = useState("");

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

  // 🔥 CAMBIO DE CONTRASEÑA REAL
  const cambiarPassword = async () => {
    if (!password) {
      alert("Ingrese una contraseña");
      return;
    }

    try {
      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}/password`, {
        password: password,
      });

      alert("Contraseña actualizada correctamente");
      setPassword("");
    } catch (error) {
      console.error(error);
      alert("Error al cambiar la contraseña");
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className={`font-bold text-gray-800 mb-2 ${isMobile ? "text-xl" : "text-3xl"}`}>
            Mi Perfil
          </h1>
          <p className="text-gray-600">
            Información personal del aprendiz externo
          </p>
        </div>

        {/* TARJETA */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6 border border-slate-200">
          <div className={`flex ${isMobile ? "flex-col gap-4" : "items-center justify-between"}`}>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                {usuario?.Nom_Usuario?.charAt(0) || "U"}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {usuario?.Nom_Usuario || "Aprendiz"}
                </h2>
                <p className="text-sm text-slate-500">
                  Aprendiz externo
                </p>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-slate-500">Documento</p>
              <p className="font-semibold text-slate-800 text-sm tracking-wide">
                {usuario?.NumDoc_Usuario || "—"}
              </p>
            </div>

          </div>
        </div>

        {/* ACADÉMICA */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Información académica
          </h2>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <div className="bg-slate-50 border rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Programa</p>
              <input
                value={Nom_Programa}
                onChange={(e) => setNom_Programa(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="bg-slate-50 border rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Ficha</p>
              <input
                value={Id_Ficha}
                onChange={(e) => setId_Ficha(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* CONTACTO */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Información de contacto
          </h2>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <div className="bg-slate-50 border rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Correo</p>
              <input
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="bg-slate-50 border rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Teléfono</p>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          <button
            onClick={guardarDatos}
            className={`mt-6 bg-indigo-600 text-white px-6 py-2 rounded ${
              isMobile ? "w-full" : ""
            }`}
          >
            Guardar cambios
          </button>
        </div>

        {/* 🔥 SEGURIDAD */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border-l-4 border-indigo-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Seguridad
          </h2>

          <div className="max-w-md">
            <div className="bg-slate-50 border rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-500 mb-1">Nueva contraseña</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <button
              onClick={cambiarPassword}
              className={`bg-indigo-600 text-white px-6 py-2 rounded ${
                isMobile ? "w-full" : ""
              }`}
            >
              Cambiar contraseña
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerfilExterno;