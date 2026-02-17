import { useState } from "react";
import { 
  User, 
  Phone, 
  Lock, 
  Mail, 
  CreditCard, 
  MapPin, 
  BookOpen, 
  Save, 
  Edit, 
  BadgeCheck,
  Eye,
  EyeOff,
  Info
} from "lucide-react";

export default function Perfil() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      <div className="w-full px-4 py-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{font-family:'Inter',system-ui,-apple-system,sans-serif}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fadeIn 0.4s ease-out}.input-focus{transition:all 0.2s ease-in-out}.input-focus:focus{border-color:#3b82f6;ring:2px;ring-color:#dbeafe}`}</style>

        <div className="max-w-6xl mx-auto pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1 text-center">Mi Perfil</h1>
          
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IZQUIERDA - Formulario de Edición */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card: Información de Usuario */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Editar Información
                </h2>
              </div>

              {/* Campo: Nombre de Usuario */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                    defaultValue="santiago_grijalba"
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">El nombre de usuario no se puede modificar</p>
              </div>

              {/* Campo: Teléfono */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    defaultValue="+57 3188520999"
                  />
                </div>
              </div>
            </div>

            {/* Card: Cambiar Contraseña */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Cambiar Contraseña
                </h2>
              </div>

              {/* Nueva Contraseña */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Dejar en blanco para no cambiar"
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Mínimo 8 caracteres
                </p>
              </div>

              {/* Confirmar Contraseña */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu nueva contraseña"
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-red-400 mt-1.5">
                  Debe coincidir con la nueva contraseña
                </p>
              </div>

              {/* Botón Guardar */}
              <button className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>

          {/* DERECHA - Información Personal */}
          <div className="space-y-6">
            {/* Card: Información Personal */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Información Personal
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Nombre Completo", value: "Santiago Grijalba Cardenas", Icon: User },
                  { label: "Correo Electrónico", value: "santigrijalba007@gmail.com", Icon: Mail },
                  { label: "Documento", value: "1109291696", Icon: CreditCard },
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
            <div className="bg-gradient-to-br from-blue-400 to-blue-200 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Programa de Formación</h3>
              </div>
              
              <p className="mb-4 leading-relaxed opacity-95">
                Tecnología en Análisis y Desarrollo de Software
              </p>
              
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-green-500 backdrop-blur-sm rounded-lg border border-white/30">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-green" />
                    <span className="text-sm font-semibold">Ficha: 3140221</span>
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
