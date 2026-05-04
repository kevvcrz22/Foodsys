// Paginas/About/QueEsFoodsys.jsx
// Pagina informativa sobre el sistema FoodSys
// Explica el proposito, los modulos y los roles del sistema

import { Utensils, ShieldCheck, CalendarCheck, BarChart3, Users, QrCode } from "lucide-react";
import logo from "../../Components/Img/LogoFoodsys.png";

// Dato de una caracteristica del sistema para mostrar en tarjeta
const Tarjeta_Caracteristica = ({ Icono, Titulo, Descripcion }) => {
  const Icono_Comp = Icono;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="w-9 h-9 rounded-lg bg-[#0f3f80]/10 flex items-center justify-center mb-3">
        <Icono_Comp className="w-5 h-5 text-[#0f3f80]" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">{Titulo}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{Descripcion}</p>
    </div>
  );
};

// Lista de roles con su descripcion
const ROLES = [
  { Nom_Rol: "Administrador", Descripcion: "Gestiona usuarios, fichas, menus, platos y toda la configuracion del sistema." },
  { Nom_Rol: "Supervisor", Descripcion: "Controla los turnos de comida, escanea codigos QR y genera reportes de asistencia." },
  { Nom_Rol: "Coordinador", Descripcion: "Gestiona novedades y supervisa el estado de los aprendices de su ficha." },
  { Nom_Rol: "Aprendiz Interno", Descripcion: "Puede reservar desayuno, almuerzo y cena. Genera su codigo QR desde la aplicacion." },
  { Nom_Rol: "Aprendiz Externo", Descripcion: "Puede reservar unicamente el almuerzo y usar su codigo QR para ingresar." },
  { Nom_Rol: "Pasante Interno / Externo", Descripcion: "Accede al sistema con estado Especial aprobado por el coordinador." },
  { Nom_Rol: "Bienestar", Descripcion: "Monitorea novedades y el estado general de los aprendices." },
  { Nom_Rol: "Cocina", Descripcion: "Consulta los menus del dia y los reportes de comidas por turno." },
];

const QueEsFoodsys = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Encabezado hero */}
    <div className="bg-[#0f3f80] text-white px-6 py-14 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
      <img src={logo} alt="Logo Foodsys" className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold">Que es Foodsys</h1>
      <p className="mt-3 text-blue-200 text-sm max-w-2xl mx-auto leading-relaxed">
        Foodsys es el sistema digital de gestion de reservas de comida del
        Centro Agropecuario del SENA. Permite a los aprendices, pasantes y
        personal del centro gestionar sus reservas de manera eficiente y segura
        mediante codigos QR.
      </p>
    </div>

    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Caracteristicas principales */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Caracteristicas del Sistema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tarjeta_Caracteristica
            Icono={CalendarCheck}
            Titulo="Reservas Digitales"
            Descripcion="Los aprendices realizan sus reservas de comida desde cualquier dispositivo antes del turno."
          />
          <Tarjeta_Caracteristica
            Icono={QrCode}
            Titulo="Codigo QR Seguro"
            Descripcion="Cada reserva genera un codigo QR unico encriptado que se escanea al momento de recibir la comida."
          />
          <Tarjeta_Caracteristica
            Icono={BarChart3}
            Titulo="Reportes en Tiempo Real"
            Descripcion="Los supervisores y administradores acceden a estadisticas diarias, semanales y mensuales."
          />
          <Tarjeta_Caracteristica
            Icono={Users}
            Titulo="Gestion de Usuarios"
            Descripcion="El administrador puede crear, editar y gestionar todos los usuarios del sistema."
          />
          <Tarjeta_Caracteristica
            Icono={ShieldCheck}
            Titulo="Control por Roles"
            Descripcion="Cada usuario accede unicamente a los modulos y funciones que corresponden a su rol."
          />
          <Tarjeta_Caracteristica
            Icono={Utensils}
            Titulo="Menus Diarios"
            Descripcion="El equipo de cocina registra los platos disponibles cada dia para que los aprendices elijan."
          />
        </div>
      </section>

      {/* Roles del sistema */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Roles del Sistema
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {ROLES.map((Rol) => (
            <div key={Rol.Nom_Rol} className="flex items-start gap-4 px-5 py-4">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-[#0f3f80] flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{Rol.Nom_Rol}</p>
                <p className="text-xs text-gray-500 mt-0.5">{Rol.Descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default QueEsFoodsys;
