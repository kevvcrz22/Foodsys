import { useState } from "react";
import {
  User,
  Phone,
  CreditCard,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Save,
  BadgeCheck,
} from "lucide-react";

export default function PerfilAdmin() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 md:px-10 xl:px-20 py-10">
      <div className="w-full space-y-10">

        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-gray-100">
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Kevin Steven Cruz Fierro
              </h1>
              <p className="text-gray-500 mt-1">
                Administrador del Sistema
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Cuenta Activa
              </div>
            </div>
          </div>

        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* INFORMACIÓN (OCUPA 2 COLUMNAS EN XL) */}
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-md border border-gray-100 p-8 space-y-8">
            <h2 className="text-xl font-semibold text-gray-800">
              Información General
            </h2>

            <div className="grid md:grid-cols-2 gap-6">

              {/* Nombre - SOLO LECTURA */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value="Kevin Steven Cruz Fierro"
                    readOnly
                    className="w-full pl-10 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Tipo Documento - SOLO LECTURA */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  Tipo de Documento
                </label>
                <input
                  value="Cédula de Ciudadanía"
                  readOnly
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Documento - SOLO LECTURA */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  Número de Documento
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value="1003810633"
                    readOnly
                    className="w-full pl-10 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Teléfono - EDITABLE */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    defaultValue="3001234567"
                    className="w-full pl-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SEGURIDAD */}
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Seguridad
            </h2>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-700">
              Cambiar la contraseña cerrará sesiones activas automáticamente.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
