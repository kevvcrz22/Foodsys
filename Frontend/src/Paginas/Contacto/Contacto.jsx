// Paginas/Contacto/Contacto.jsx
// Pagina de informacion de contacto de FoodSys
// Muestra los canales de comunicacion del centro

import { Mail, Phone, MapPin, Clock } from "lucide-react";

// Tarjeta reutilizable para cada canal de contacto
const Tarjeta_Contacto = ({ Icono, Titulo, Linea1, Linea2 }) => {
  const Icono_Comp = Icono;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
      <div className="w-10 h-10 rounded-lg bg-[#0f3f80]/10 flex items-center justify-center flex-shrink-0">
        <Icono_Comp className="w-5 h-5 text-[#0f3f80]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{Titulo}</p>
        <p className="text-sm text-gray-500 mt-0.5">{Linea1}</p>
        {Linea2 && (
          <p className="text-sm text-gray-500">{Linea2}</p>
        )}
      </div>
    </div>
  );
};

const Contacto = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Encabezado de la pagina */}
    <div className="bg-[#0f3f80] text-white px-6 py-12 text-center">
      <h1 className="text-3xl font-bold">Contactanos</h1>
      <p className="mt-2 text-blue-200 text-sm max-w-xl mx-auto">
        Si tienes dudas, sugerencias o necesitas ayuda con el sistema FoodSys,
        ponte en contacto con el equipo de Bienestar del centro.
      </p>
    </div>

    {/* Cuerpo con tarjetas de contacto */}
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tarjeta_Contacto
          Icono={Mail}
          Titulo="Correo Electronico"
          Linea1="bienestar@sena.edu.co"
          Linea2="soporte.foodsys@sena.edu.co"
        />
        <Tarjeta_Contacto
          Icono={Phone}
          Titulo="Telefono"
          Linea1="+57 (604) 123-4567"
          Linea2="Extension: 201 - Bienestar"
        />
        <Tarjeta_Contacto
          Icono={MapPin}
          Titulo="Direccion"
          Linea1="Centro Agropecuario - SENA"
          Linea2="La Salada, Caldas, Antioquia"
        />
        <Tarjeta_Contacto
          Icono={Clock}
          Titulo="Horario de Atencion"
          Linea1="Lunes a Viernes: 7:00am - 5:00pm"
          Linea2="Sabados: 8:00am - 12:00pm"
        />
      </div>

      {/* Formulario de contacto rapido */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Enviar un Mensaje
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Asunto
            </label>
            <input
              type="text"
              placeholder="Ej. Problema con mi reserva"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 outline-none focus:border-[#0f3f80] focus:ring-2 focus:ring-[#0f3f80]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mensaje
            </label>
            <textarea
              rows={4}
              placeholder="Describe tu consulta o problema..."
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 outline-none focus:border-[#0f3f80] focus:ring-2 focus:ring-[#0f3f80]/10 transition-all resize-none"
            />
          </div>
          <button
            type="button"
            className="px-5 py-2.5 bg-[#0f3f80] text-white text-sm font-semibold rounded-lg hover:bg-[#0d3570] transition-colors duration-200"
          >
            Enviar Mensaje
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default Contacto;
