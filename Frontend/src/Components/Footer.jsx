import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-fondo text-texto-principal lg:pl-64 border-t border-acento/10 relative overflow-hidden">
      {/* Orbes decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primario-suave/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-acento-suave/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xl font-extrabold texto-gradiente tracking-wide">
              Foodsys
            </h3>
            <p className="text-texto-secundario text-sm max-w-sm leading-relaxed">
              Sistema digital de gestión de reservas alimentarias para aprendices y pasantes del SENA, Centro Agropecuario La Granja.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-acento text-xs font-bold uppercase tracking-wider">Enlaces Rápidos</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/about" className="text-texto-secundario hover:text-primario text-sm font-medium transition-colors">¿Qué es Foodsys?</Link>
              <Link to="/contacto" className="text-texto-secundario hover:text-primario text-sm font-medium transition-colors">Centro de Soporte (PQRS)</Link>
            </nav>
          </div>

          {/* Contact & Social */}
          <div className="space-y-3">
            <h4 className="text-acento text-xs font-bold uppercase tracking-wider">Conéctate</h4>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primario/30 flex items-center justify-center transition-all text-texto-secundario hover:text-primario">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primario/30 flex items-center justify-center transition-all text-texto-secundario hover:text-primario">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="WhatsApp" className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primario/30 flex items-center justify-center transition-all text-texto-secundario hover:text-primario">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
          
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-acento/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-texto-secundario font-medium">
            © 2026 Foodsys. SENA Centro Agropecuario La Granja.
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