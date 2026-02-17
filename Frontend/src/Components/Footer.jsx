import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-blue-700 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1 - Foodsys */}
          <div className="flex flex-col gap-4">
            <h3 className="text-green-400 font-bold text-lg tracking-wide">
              Foodsys
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Sistema de gestión alimentaria del Centro Agropecuario La Granja - SENA Regional Tolima.
            </p>
            <div className="flex gap-3 mt-1">
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-4 h-4 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="white"/>
                </svg>
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9 9 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03C7.69 5.37 4.07 3.58 1.64.9a4.52 4.52 0 0 0-.61 2.27c0 1.57.8 2.95 2.01 3.76a4.49 4.49 0 0 1-2.05-.57v.06c0 2.19 1.56 4.02 3.63 4.43a4.52 4.52 0 0 1-2.04.08 4.53 4.53 0 0 0 4.22 3.14A9.07 9.07 0 0 1 0 19.54a12.8 12.8 0 0 0 6.92 2.03c8.3 0 12.85-6.88 12.85-12.85 0-.2 0-.39-.01-.58A9.17 9.17 0 0 0 23 3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2 - Enlaces rápidos */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold text-lg tracking-wide">
              Enlaces rápidos
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                className="text-blue-100 hover:text-white text-sm transition-colors duration-200 w-fit"
              >
                Inicio
              </Link>
              <Link
                to="/contacto"
                className="text-blue-100 hover:text-white text-sm transition-colors duration-200 w-fit"
              >
                Contacto
              </Link>
              <Link
                to="/que-es-foodsys"
                className="text-blue-100 hover:text-white text-sm transition-colors duration-200 w-fit"
              >
                ¿Qué es foodsys?
              </Link>
            </nav>
          </div>

          {/* Column 3 - Recursos */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold text-lg tracking-wide">
              Recursos
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/preguntas-frecuentes"
                className="text-blue-100 hover:text-white text-sm transition-colors duration-200 w-fit"
              >
                Preguntas frecuentes
              </Link>
              <Link
                to="/politica-de-privacidad"
                className="text-blue-100 hover:text-white text-sm transition-colors duration-200 w-fit"
              >
                Política de privacidad
              </Link>
              <Link
                to="/terminos-de-uso"
                className="text-blue-100 hover:text-white text-sm transition-colors duration-200 w-fit"
              >
                Términos de uso
              </Link>
              <Link
                to="/soporte-tecnico"
                className="text-blue-100 hover:text-white text-sm transition-colors duration-200 w-fit"
              >
                Soporte técnico
              </Link>
            </nav>
          </div>

          {/* Column 4 - Contacto */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-bold text-lg tracking-wide">
              Contacto
            </h3>
            <div className="flex flex-col gap-3">
              <p className="text-blue-100 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 fill-blue-200 shrink-0 mt-0.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Centro Agropecuario La Granja, Tolima
              </p>
              <p className="text-blue-100 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 fill-blue-200 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                +57 (322) 947-3491
              </p>
              <p className="text-blue-100 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 fill-blue-200 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                foodsys.edu.co
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer bottom */}
      <div className="border-t border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-blue-200 text-sm text-center">
            © 2026 Foodsys - Sistema de Gestión Alimentaria. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;