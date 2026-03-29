import { useState, useEffect } from "react";
import {
  User, Phone, CreditCard, ShieldCheck, Lock, Eye, EyeOff, Save, BadgeCheck,
} from "lucide-react";

const API_URL = "http://localhost:8000/api/Usuarios";

export default function PerfilAdmin() {
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usuario, setUsuario]                     = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [telefono, setTelefono]                   = useState("");
  const [newPassword, setNewPassword]             = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");
  const [mensaje, setMensaje]                     = useState({ texto: "", tipo: "" });
  const [guardando, setGuardando]                 = useState(false);

  /* ─── FETCH USUARIO ─── */
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        // ✅ Leer el usuario y el token JWT real del localStorage
        const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
        const token        = localStorage.getItem("token");

        if (!usuarioLocal?.Id_Usuario) throw new Error("Sesión no encontrada. Por favor inicia sesión de nuevo.");
        if (!token || token === "ok" || token.split(".").length !== 3) {
          throw new Error("Token de sesión inválido. Por favor inicia sesión de nuevo.");
        }

        const response = await fetch(`${API_URL}/${usuarioLocal.Id_Usuario}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          // Token expirado o inválido — limpiar sesión
          localStorage.clear();
          window.location.href = "/";
          return;
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "Error al obtener datos del usuario");
        }

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

  /* ─── GUARDAR ─── */
  const handleGuardar = async () => {
    if (newPassword && newPassword.length < 8)
      return mostrarMensaje("La contraseña debe tener mínimo 8 caracteres", "error");
    if (newPassword && newPassword !== confirmPassword)
      return mostrarMensaje("Las contraseñas no coinciden", "error");

    try {
      setGuardando(true);
      const token = localStorage.getItem("token");

      // ✅ Validar token antes de llamar al backend
      if (!token || token === "ok" || token.split(".").length !== 3) {
        mostrarMensaje("Sesión expirada. Por favor inicia sesión de nuevo.", "error");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/";
        }, 2000);
        return;
      }

      const body = { Tel_Usuario: telefono };
      if (newPassword) body.password = newPassword;

      const response = await fetch(`${API_URL}/${usuario.Id_Usuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Error al actualizar");
      }

      // ✅ Actualizar localStorage con el teléfono nuevo
      const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
      localStorage.setItem("usuario", JSON.stringify({ ...usuarioLocal, Tel_Usuario: telefono }));

      setNewPassword("");
      setConfirmPassword("");
      mostrarMensaje("Cambios guardados correctamente ✓", "exito");
    } catch (error) {
      mostrarMensaje(error.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  /* ─── DATOS DERIVADOS ─── */
  const nombreCompleto = usuario
    ? `${usuario.Nom_Usuario ?? ""} ${usuario.Ape_Usuario ?? ""}`.trim()
    : "";

  const tipoDocumento = {
    CC:  "Cédula de Ciudadanía",
    CE:  "Cédula de Extranjería",
    TI:  "Tarjeta de Identidad",
    PEP: "PEP",
    PPT: "PPT",
  }[usuario?.TipDoc_Usuario] || usuario?.TipDoc_Usuario || "—";

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  /* ─── ERROR CRÍTICO (usuario no cargó) ─── */
  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow p-10 max-w-sm">
          <ShieldCheck className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-lg mb-2">No se pudo cargar el perfil</p>
          {mensaje.texto && (
            <p className="text-red-500 text-sm mb-4">{mensaje.texto}</p>
          )}
          <button
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  /* ─── VISTA PRINCIPAL ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 md:px-10 xl:px-20 py-10">
      <div className="w-full space-y-10">

        {/* Mensaje de feedback */}
        {mensaje.texto && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            mensaje.tipo === "exito"
              ? "bg-green-50 border border-green-300 text-green-700"
              : "bg-red-50 border border-red-300 text-red-700"
          }`}>
            <span>{mensaje.tipo === "exito" ? "✓" : "✕"}</span>
            <span>{mensaje.texto}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{nombreCompleto}</h1>
              <p className="text-gray-500 mt-1">Administrador del Sistema</p>
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Cuenta Activa
              </div>
            </div>
          </div>

          {/* Info adicional de solo lectura */}
          <div className="text-right text-sm text-gray-400 space-y-1">
            {usuario.Cor_Usuario && (
              <p className="font-medium text-gray-500">📧 {usuario.Cor_Usuario}</p>
            )}
            {usuario.CenCon_Usuario && (
              <p>Centro: {usuario.CenCon_Usuario}</p>
            )}
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* INFORMACIÓN GENERAL */}
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-md border border-gray-100 p-8 space-y-8">
            <h2 className="text-xl font-semibold text-gray-800">Información General</h2>

            <div className="grid md:grid-cols-2 gap-6">

              {/* Nombre — solo lectura */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={nombreCompleto}
                    readOnly
                    className="w-full pl-10 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Tipo Documento — solo lectura */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">Tipo de Documento</label>
                <input
                  value={tipoDocumento}
                  readOnly
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Número Documento — solo lectura */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">Número de Documento</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={usuario?.NumDoc_Usuario || "—"}
                    readOnly
                    className="w-full pl-10 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Teléfono — EDITABLE */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  Teléfono <span className="text-indigo-500 text-xs">(editable)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 3001234567"
                    className="w-full pl-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Género — solo lectura */}
              {usuario?.Gen_Usuario && (
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Género</label>
                  <input
                    value={usuario.Gen_Usuario}
                    readOnly
                    className="w-full py-3 px-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Estado — solo lectura */}
              {usuario?.Est_Usuario && (
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Estado</label>
                  <div className="py-3 px-4 rounded-xl bg-gray-100 border border-gray-200">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      usuario.Est_Usuario === "Activo"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {usuario.Est_Usuario}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* SEGURIDAD */}
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Seguridad</h2>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 8 && (
                <p className="text-xs text-orange-400 mt-1.5">Mínimo 8 caracteres</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
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
                <p className="text-xs text-red-400 mt-1.5">Las contraseñas no coinciden</p>
              )}
              {confirmPassword && confirmPassword === newPassword && newPassword.length >= 8 && (
                <p className="text-xs text-green-500 mt-1.5">✓ Las contraseñas coinciden</p>
              )}
            </div>

            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition"
            >
              {guardando
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Save className="w-4 h-4" />}
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-700">
              <p className="font-medium mb-1">💡 Información</p>
              <p>Puedes actualizar tu teléfono y contraseña. Los demás datos solo pueden modificarse por el sistema.</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-sm text-amber-700">
              ⚠️ Cambiar la contraseña cerrará las sesiones activas automáticamente.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}