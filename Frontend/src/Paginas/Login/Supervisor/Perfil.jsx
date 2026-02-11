export default function Perfil() {
  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="mb-6 rounded">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Mi Perfil</h1>
        
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IZQUIERDA */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <i className="bi bi-person-circle text-green-500 text-xl"></i>
            Editar Información
          </h2>

          {/* Usuario */}
          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-1">
              Nombre de Usuario
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="jperez"
              readOnly
            />
          </div>

          {/* Teléfono */}
          <div className="mb-6">
            <label className="block font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              defaultValue="+57 300 123 4567"
            />
          </div>

          {/* Contraseña */}
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <i className="bi bi-lock-fill text-green-500"></i>
            Cambiar Contraseña
          </h3>

          <div className="mb-3">
            <label className="block text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              placeholder="Dejar en blanco para no cambiar"
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Mínimo 8 caracteres
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              placeholder="Confirma tu nueva contraseña"
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Debe coincidir con la contraseña
            </p>
          </div>

          <button className="bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded-lg font-medium transition">
            <i className="bi bi-floppy-fill px-2"></i> 
            Guardar Cambios
          </button>
        </div>

        {/* DERECHA */}
        <div className="space-y-6">
          {/* Información personal */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <i className="bi bi-person-lines-fill text-green-500 text-xl"></i>
              Información Personal
            </h2>

            {[
              ["Nombre Completo", "Andrés López Martínez", "bi-person"],
              ["Correo Electrónico", "andres.lopez@sena.edu.co", "bi-envelope"],
              ["Documento", "1234567890", "bi-credit-card"],
              ["Sede", "Centro Agropecuario La Granja", "bi-geo-alt"],
            ].map(([label, value, icon], i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-emerald-50 p-3 rounded-lg mb-3"
              >
                <i className={`bi ${icon} text-green-700 text-lg`}></i>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="font-semibold text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Programa */}
          <div className="bg-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <i className="bi bi-book-fill text-xl"></i>
              <h3 className="font-semibold">Programa de Formación</h3>
            </div>
            <p className="mb-2">Tecnología en Analisis Y Desarrollo de Software</p>
            <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
              Ficha: 3140221
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
