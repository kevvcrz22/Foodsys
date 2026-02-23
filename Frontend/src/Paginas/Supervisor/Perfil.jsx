import { useState, useEffect } from "react";
import {
  User, Phone, Lock, Mail, CreditCard, MapPin,
  BookOpen, Save, Edit, BadgeCheck, Eye, EyeOff
} from "lucide-react";

const API_URL = "http://localhost:8000/api/Usuarios";

export default function Perfil() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telefono, setTelefono] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [guardando, setGuardando] = useState(false);

  // Cargar datos del usuario desde la API
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
        if (!usuarioLocal?.Id_Usuario) throw new Error("Sesión no encontrada");

        const response = await fetch(`${API_URL}/${usuarioLocal.Id_Usuario}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!response.ok) throw new Error("Error al obtener datos del usuario");

        const data = await response.json();
        setUsuario(data);
        setTelefono(data.Tel_Usuario || "");
      } catch (error) {
        mostrarMensaje(error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, []);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000);
  };

  const handleGuardar = async () => {
    // Validaciones
    if (newPassword && newPassword.length < 8) {
      return mostrarMensaje("La contraseña debe tener mínimo 8 caracteres", "error");
    }
    if (newPassword && newPassword !== confirmPassword) {
      return mostrarMensaje("Las contraseñas no coinciden", "error");
    }

    try {
      setGuardando(true);

      const body = { Tel_Usuario: telefono };
      if (newPassword) body.password = newPassword;

      const response = await fetch(`${API_URL}/${usuario.Id_Usuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Error al actualizar");
      }

      // Actualizar localStorage con el nuevo teléfono
      const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
      localStorage.setItem("usuario", JSON.stringify({ ...usuarioLocal, Tel_Usuario: telefono }));

      setNewPassword("");
      setConfirmPassword("");
      mostrarMensaje("Cambios guardados correctamente", "exito");
    } catch (error) {
      mostrarMensaje(error.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  // Construir nombre de usuario para mostrar (campo no editable)
  const usernameDisplay = usuario
    ? `${usuario.Nom_Usuario?.toLowerCase()}_${usuario.Ape_Usuario?.split(" ")[0]?.toLowerCase()}`
    : "";

  const nombreCompleto = usuario
    ? `${usuario.Nom_Usuario} ${usuario.Ape_Usuario}`
    : "";

  const nombrePrograma = usuario?.Ficha?.Programa?.Nom_Programa || "Sin programa asignado";
  const numFicha = usuario?.Ficha?.Num_Ficha || "Sin ficha";

  if (loading) {
    return (
      <div className="min-h-screen lg:pl-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <div className="w-full px-4 py-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{font-family:'Inter',system-ui,-apple-system,sans-serif}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fadeIn 0.4s ease-out}`}</style>

        <div className="max-w-6xl mx-auto pb-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-1 text-center">Mi Perfil</h1>
          </div>

          {/* Mensaje de éxito o error */}
          {mensaje.texto && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
              mensaje.tipo === "exito"
                ? "bg-green-50 border border-green-300 text-green-700"
                : "bg-red-50 border border-red-300 text-red-700"
            }`}>
              {mensaje.tipo === "exito" ? "✓" : "✕"} {mensaje.texto}
            </div>
          )}

          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* IZQUIERDA */}
            <div className="lg:col-span-2 space-y-6">

              {/* Card: Editar Información */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Editar Información</h2>
                </div>

                {/* Nombre de Usuario (solo lectura) */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                      value={usernameDisplay}
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">El nombre de usuario no se puede modificar</p>
                </div>

                {/* Teléfono */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card: Cambiar Contraseña */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h2>
                </div>

                {/* Nueva Contraseña */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Dejar en blanco para no cambiar"
                      className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-red-400 mt-1.5">Mínimo 8 caracteres</p>
                </div>

                {/* Confirmar Contraseña */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirma tu nueva contraseña"
                      className={`w-full pl-10 pr-12 py-2.5 rounded-lg border focus:ring-2 outline-none transition-all ${
                        confirmPassword && confirmPassword !== newPassword
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-green-400 focus:border-green-500 focus:ring-green-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-400 mt-1.5">Debe coincidir con la nueva contraseña</p>
                  )}
                </div>

                {/* Botón Guardar */}
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  {guardando ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>

            {/* DERECHA */}
            <div className="space-y-6">
              {/* Card: Información Personal */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Nombre Completo", value: nombreCompleto, Icon: User },
                    { label: "Correo Electrónico", value: usuario?.Cor_Usuario || "—", Icon: Mail },
                    { label: "Documento", value: usuario?.NumDoc_Usuario || "—", Icon: CreditCard },
                    { label: "Sede", value: "Centro Agropecuario La Granja", Icon: MapPin },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-100/60 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="p-1.5 bg-white rounded-lg border border-green-500 flex-shrink-0">
                        <item.Icon className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                        <p className="font-medium text-gray-900 text-sm truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card: Programa de Formación */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-200 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Programa de Formación</h3>
                </div>

                <p className="mb-4 leading-relaxed opacity-95">
                  {nombrePrograma}
                </p>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-green-500 rounded-lg border border-white/30">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="text-sm font-semibold">Ficha: {numFicha}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}