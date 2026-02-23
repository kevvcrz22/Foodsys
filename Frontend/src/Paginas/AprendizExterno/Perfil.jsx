import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiAxios from "../../api/axiosConfig";
import ReservasAprendiz from "./ReservasAprendiz";

const Perfil = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [actividadAbierta, setActividadAbierta] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState("informacion");

  const [telefono, setTelefono] = useState(usuario?.Tel_Usuario || "");
  const [correo, setCorreo] = useState(usuario?.Cor_Usuario || "");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const guardarDatos = async () => {
    if (!usuario?.Id_Usuario) return alert("Usuario no disponible");
    try {
      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}`, {
        Tel_Usuario: telefono,
        Cor_Usuario: correo,
      });
      alert("Datos actualizados correctamente");
    } catch {
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

  const seleccionarSeccion = (seccion) => {
    setSeccionActiva(seccion);
    setMenuAbierto(false);
  };

  return (
    // Contenedor raíz: flex row, sidebar fijo + columna scrolleable
    <div className="flex min-h-screen bg-gray-50">

      {/* ── OVERLAY MOBILE ── */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* ── BOTÓN HAMBURGUESA ── */}
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-green-500 hover:bg-green-600
                   rounded-xl shadow-lg flex flex-col items-center justify-center gap-1.5
                   transition-all duration-300"
        aria-label="Abrir menú"
      >
        <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? "opacity-0" : ""}`} />
        <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {/* ── SIDEBAR FIJO ──
           - En desktop: siempre visible, fijo al lado izquierdo
           - En móvil: deslizable (translate)
      */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-64 flex flex-col
          bg-gradient-to-b from-indigo-100 to-indigo-50
          border-r border-indigo-200 shadow-lg
          transition-transform duration-300 ease-in-out
          ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Contenido scrolleable del sidebar */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-indigo-200">
            <div className="flex items-center gap-3">
              <i className="bi bi-person-circle text-3xl text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Aprendiz Externo
              </h3>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {/* Mi Perfil */}
            <div>
              <button
                onClick={() => setPerfilAbierto(!perfilAbierto)}
                className="w-full flex items-center justify-between px-4 py-3
                           rounded-lg hover:bg-white/60 transition-colors text-gray-800 font-medium"
              >
                <div className="flex items-center gap-3">
                  <i className="bi bi-person-badge text-lg" />
                  <span>Mi Perfil</span>
                </div>
                <i className={`bi bi-chevron-${perfilAbierto ? "up" : "down"} text-sm`} />
              </button>

              {perfilAbierto && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => seleccionarSeccion("informacion")}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors
                      ${seccionActiva === "informacion"
                        ? "bg-indigo-500 text-white"
                        : "hover:bg-white/50 text-gray-700"
                      }`}
                  >
                    <i className="bi bi-info-circle mr-2" />
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
                           rounded-lg hover:bg-white/60 transition-colors text-gray-800 font-medium"
              >
                <div className="flex items-center gap-3">
                  <i className="bi bi-calendar-check text-lg" />
                  <span>Actividad</span>
                </div>
                <i className={`bi bi-chevron-${actividadAbierta ? "up" : "down"} text-sm`} />
              </button>

              {actividadAbierta && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => seleccionarSeccion("reservas")}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors
                      ${seccionActiva === "reservas"
                        ? "bg-indigo-500 text-white"
                        : "hover:bg-white/50 text-gray-700"
                      }`}
                  >
                    <i className="bi bi-bookmark-check mr-2" />
                    Gestionar Reservas
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Cerrar sesión pegado al fondo del sidebar */}
        <div className="p-6 border-t border-indigo-200 flex-shrink-0">
          <button
            onClick={salir}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                       bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors"
          >
            <i className="bi bi-box-arrow-right text-lg" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── ÁREA DERECHA: solo el contenido scrolleable ──
           lg:ml-64 empuja el contenido para que no quede bajo el sidebar fijo
      */}
      <main className="flex-1 lg:ml-64 overflow-y-auto p-4 md:p-8 lg:p-10">
        {seccionActiva === "informacion" && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 pt-14 lg:pt-0">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Mi Perfil</h1>
                <p className="text-gray-600">Gestiona tu información personal y seguridad</p>
              </div>

              {/* Información Personal */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <i className="bi bi-person-lines-fill text-indigo-600" />
                  Información personal
                </h2>

                <div className="mb-8">
                  <h3 className="text-base font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Datos del aprendiz
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="bi bi-book mr-2 text-indigo-500" />
                        Programa de formación
                      </label>
                      <input
                        type="text"
                        value={usuario?.Programa || "No asignado"}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="bi bi-hash mr-2 text-indigo-500" />
                        Ficha
                      </label>
                      <input
                        type="text"
                        value={usuario?.ficha?.Num_Ficha || "Sin ficha"}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Datos de contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="bi bi-envelope mr-2 text-indigo-500" />
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="bi bi-phone mr-2 text-indigo-500" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                  </div>
                  <button
                    onClick={guardarDatos}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700
                               text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                  >
                    <i className="bi bi-check-circle" />
                    Guardar cambios
                  </button>
                </div>
              </div>

              {/* Seguridad */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border-l-4 border-indigo-600">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <i className="bi bi-shield-lock text-indigo-600" />
                  Seguridad
                </h2>
                <div className="max-w-md">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-key mr-2 text-indigo-500" />
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingrese nueva contraseña"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <button
                    onClick={cambiarPassword}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700
                               text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                  >
                    <i className="bi bi-arrow-repeat" />
                    Cambiar contraseña
                  </button>
                </div>
              </div>
            </div>
          )}

          {seccionActiva === "reservas" && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-8 pt-14 lg:pt-0">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <i className="bi bi-calendar2-check text-indigo-600" />
                  Mis Reservas
                </h1>
              </div>
              <ReservasAprendiz localMode={true} />
            </div>
          )}
        </main>

    </div>
  );
};

export default Perfil;