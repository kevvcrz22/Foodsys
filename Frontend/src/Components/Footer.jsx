// Frontend/src/Components/Footer.jsx
// Pie de pagina general de la aplicacion Foodsys
// Diseno responsivo con estilo Liquid Glass y enlaces institucionales actualizados

import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-fondo text-texto-principal lg:pl-64 border-t border-acento/10 relative overflow-hidden">
      {/* Orbes decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primario-suave/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-acento-suave/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Informacion de la Marca */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xl font-extrabold texto-gradiente tracking-wide">
              Foodsys
            </h3>
            <p className="text-texto-secundario text-sm max-w-sm leading-relaxed">
              Sistema digital de gestion de reservas alimentarias para aprendices y pasantes del SENA, Centro Agropecuario &quot;La Granja&quot; del Espinal-Tolima.
            </p>
          </div>

          {/* Enlaces Rapidos */}
          <div className="space-y-3">
            <h4 className="text-acento text-xs font-bold uppercase tracking-wider">Enlaces Rapidos</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/about" className="text-texto-secundario hover:text-primario text-sm font-medium transition-colors">¿Que es Foodsys?</Link>
              <Link to="/manuales" className="text-texto-secundario hover:text-primario text-sm font-medium transition-colors">Manuales de Usuario</Link>
              <Link to="/contacto" className="text-texto-secundario hover:text-primario text-sm font-medium transition-colors">Oficina de Bienestar al Aprendiz (PQRS)</Link>
              <a
                href="https://bienesoftlagranja.com/user/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-texto-secundario hover:text-sky-600 text-sm font-medium transition-colors flex items-center gap-1.5"
                title="Abrir portal oficial BIENESOFT"
              >
                <img src="/LogoBienesoft.png" alt="BIENESOFT" className="w-3.5 h-3.5 object-contain" />
                <span>Portal BIENESOFT ↗</span>
              </a>
            </nav>
          </div>

          {/* Redes y Contacto Oficial */}
          <div className="space-y-3">
            <h4 className="text-acento text-xs font-bold uppercase tracking-wider">Redes Oficiales</h4>
            <div className="flex gap-3 items-center">
              <div
                title="Proximamente cuenta oficial de Instagram"
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-center text-texto-secundario/70 hover:text-pink-600 transition-colors cursor-pointer"
              >
                <Instagram className="w-5 h-5" />
              </div>
              <span className="text-xs text-texto-secundario font-medium">
                Centro Agropecuario &quot;La Granja&quot; del Espinal-Tolima
              </span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Franja de Derechos de Autor */}
      <div className="border-t border-acento/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-texto-secundario font-medium">
            © 2026 Foodsys. SENA Centro Agropecuario &quot;La Granja&quot; del Espinal-Tolima.
          </p>
          <p className="text-xs text-texto-secundario/70 font-medium">
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;