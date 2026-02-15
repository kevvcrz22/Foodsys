import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiAxios from "../../api/axiosConfig";
import ReservasAprendiz from "./ReservasAprendiz";

const Perfil = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [menuAbierto, setMenuAbierto] = useState(false); // Cerrado por defecto en mobile
  const [actividadAbierta, setActividadAbierta] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState("informacion");

  const [telefono, setTelefono] = useState(usuario?.Tel_Usuario || "");
  const [correo, setCorreo] = useState(usuario?.Cor_Usuario || "");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

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
    } catch (error) {
      alert("Error al actualizar la información");
    }
  };

  const cambiarPassword = () => {
    if (!password) return alert("Ingrese una contraseña");
    alert("Contraseña actualizada");
    setPassword("");
  };

  const salir = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* BOTÓN HAMBURGUESA - Solo visible en móvil/tablet */}
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-green-500 hover:bg-green-600 
                   rounded-xl shadow-lg flex flex-col items-center justify-center gap-1
                   transition-all duration-300"
      >
        <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? 'rotate-45 translate-y-1.5' : ''}`}></span>
        <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? 'opacity-0' : ''}`}></span>
        <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
      </button>

      {/* SIDEBAR */}
      <aside
        className={`
    -ml-32 -mt-5 w-64 bg-gradient-to-b from-indigo-100 to-indigo-50
    transition-transform duration-300 ease-in-out
   shadow-lg h-[calc(100vh-0px)] flex flex-col overflow-hidden
    lg:static lg:translate-x-0
    fixed inset-y-0 left-0 z-40
    ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
  `}
      >
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-indigo-200">
            <div className="flex items-center gap-3 mb-2">
              <i className="bi bi-person-circle text-3xl text-indigo-600"></i>
              <h3 className="text-lg font-semibold text-gray-800">
                Aprendiz Externo
              </h3>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {/* Mi Perfil */}
            <div>
              <button
                onClick={() => setPerfilAbierto(!perfilAbierto)}
                className="w-full flex items-center justify-between px-4 py-3 
                           rounded-lg hover:bg-white/60 transition-colors duration-200
                           text-gray-800 font-medium"
              >
                <div className="flex items-center gap-3">
                  <i className="bi bi-person-badge text-lg"></i>
                  <span>Mi Perfil</span>
                </div>
                <i
                  className={`bi bi-chevron-${perfilAbierto ? "up" : "down"
                    } text-sm`}
                ></i>
              </button>

              {perfilAbierto && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setSeccionActiva("informacion");
                      setMenuAbierto(false); // Cerrar menú en mobile al seleccionar
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm
                               transition-colors duration-200
                               ${seccionActiva === "informacion"
                        ? "bg-indigo-500 text-white"
                        : "hover:bg-white/50 text-gray-700"
                      }`}
                  >
                    <i className="bi bi-info-circle mr-2"></i>
                    Información personal
                  </button>
                </div>
              )}
            </div>

            {/* Actividad */}
            <div>
              <button
                onClick={() => setActividadAbierta(!actividadAbierta)}
                className="w-full flex items-center justify-between px-4 py-3 
                           rounded-lg hover:bg-white/60 transition-colors duration-200
                           text-gray-800 font-medium"
              >
                <div className="flex items-center gap-3">
                  <i className="bi bi-calendar-check text-lg"></i>
                  <span>Actividad</span>
                </div>
                <i
                  className={`bi bi-chevron-${actividadAbierta ? "up" : "down"
                    } text-sm`}
                ></i>
              </button>

              {actividadAbierta && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setSeccionActiva("reservas");
                      setMenuAbierto(false); // Cerrar menú en mobile al seleccionar
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm
                               transition-colors duration-200
                               ${seccionActiva === "reservas"
                        ? "bg-indigo-500 text-white"
                        : "hover:bg-white/50 text-gray-700"
                      }`}
                  >
                    <i className="bi bi-bookmark-check mr-2"></i>
                    Gestionar Reservas
                  </button>
                </div>
              )}
            </div>
         </nav>
      </div>
      
      {/* Cerrar Sesión - Pegado al fondo */}
      <div className="p-6 pt-4 border-t border-indigo-200">
        <button
          onClick={salir}
          className="w-full flex items-center gap-3 px-4 py-3
                     rounded-lg bg-red-50 hover:bg-red-100 
                     text-red-600 font-medium transition-colors duration-200"
        >
          <i className="bi bi-box-arrow-right text-lg"></i>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto">
        {seccionActiva === "informacion" && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 pt-16 lg:pt-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Mi Perfil
              </h1>
              <p className="text-gray-600">
                Gestiona tu información personal y seguridad
              </p>
            </div>

            {/* Información Personal Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <i className="bi bi-person-lines-fill text-indigo-600"></i>
                Información personal
              </h2>

              {/* Datos del aprendiz */}
              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">
                  Datos del aprendiz
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-book mr-2 text-indigo-500"></i>
                      Programa de formación
                    </label>
                    <input
                      type="text"
                      value={usuario?.Programa || "No asignado"}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                                 bg-gray-50 text-gray-600 cursor-not-allowed
                                 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-hash mr-2 text-indigo-500"></i>
                      Ficha
                    </label>
                    <input
                      type="text"
                      value={usuario?.ficha?.Num_Ficha || "Sin ficha"}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                                 bg-gray-50 text-gray-600 cursor-not-allowed
                                 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Datos de contacto */}
              <div>
                <h3 className="text-base font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">
                  Datos de contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-envelope mr-2 text-indigo-500"></i>
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                                 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-phone mr-2 text-indigo-500"></i>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                                 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                <button
                  onClick={guardarDatos}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 
                             hover:bg-indigo-700 text-white font-medium rounded-lg
                             transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <i className="bi bi-check-circle"></i>
                  Guardar cambios
                </button>
              </div>
            </div>

            {/* Seguridad Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border-l-4 border-indigo-600">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <i className="bi bi-shield-lock text-indigo-600"></i>
                Seguridad
              </h2>

              <div className="max-w-md">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="bi bi-key mr-2 text-indigo-500"></i>
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese nueva contraseña"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 
                               focus:border-transparent transition-shadow"
                  />
                </div>

                <button
                  onClick={cambiarPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 
                             hover:bg-indigo-700 text-white font-medium rounded-lg
                             transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <i className="bi bi-arrow-repeat"></i>
                  Cambiar contraseña
                </button>
              </div>
            </div>
          </div>
        )}

        {seccionActiva === "reservas" && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 pt-16 lg:pt-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <i className="bi bi-calendar2-check text-indigo-600"></i>
                Mis Reservas
              </h1>
            </div>
            <ReservasAprendiz localMode={true} />
          </div>
        )}
      </main>

      {/* Overlay para mobile cuando sidebar está abierto */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        ></div>
      )}
    </div>
  );
};

export default Perfil;