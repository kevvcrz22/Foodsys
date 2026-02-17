import logoFoodsys from "../../Components/Img/LogoFoodsys.png";
export default function Inicio() {
  return (
    <div className="min-h-screen lg:pl-64">
      <div className="w-full h-full px-6 py-6">

      {/* BIENVENIDA */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <img
            src={logoFoodsys}
            alt="FoodSys Logo"
            className="w-20 h-20 border-5 rounded-full border-green-100 shadow-md"

          />
        </div>

        <h2 className="text-blue-600 font-medium mb-1">
          Bienvenido a FoodSys
        </h2>

        <p className="text-gray-500 max-w-2xl text-sm">
          Sistema integral de gestión de alimentación para centros de formación.
          Controla, registra y analiza el servicio de alimentación de manera
          eficiente y moderna.
        </p>
      </div>

      {/* CARDS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          {
            icon: "bi-people",
            title: "Gestión de Aprendices",
            desc: "Registra y controla la asistencia de aprendices al servicio de alimentación de manera eficiente.",
          },
          {
            icon: "bi-graph-up-arrow",
            title: "Reportes Detallados",
            desc: "Genera reportes diarios, semanales y mensuales para analizar patrones de asistencia.",
          },
          {
            icon: "bi-shield-check",
            title: "Seguro y Confiable",
            desc: "Sistema seguro con control de acceso para proteger la información de los usuarios.",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm p-5"
          >
            <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <i className={`bi ${card.icon} text-green-600 text-lg`}></i>
            </div>

            <h3 className="font-semibold text-gray-800 mb-1 text-sm">
              {card.title}
            </h3>

            <p className="text-sm text-gray-500 leading-snug">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* SOBRE EL PROYECTO */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">

        <h3 className="font-semibold text-gray-800 mb-2 text-sm">
          Sobre el Proyecto
        </h3>

        <p className="text-gray-600 mb-5 max-w-4xl text-sm leading-snug">
          FoodSys es una solución desarrollada para optimizar el proceso de
          alimentación en centros de formación, facilitando el registro de
          aprendices, el control de turnos y la generación de reportes
          estadísticos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              title: "Registro Rápido",
              desc: "Utiliza códigos QR para registrar la asistencia de aprendices de forma ágil y sin errores.",
            },
            {
              title: "Control de Turnos",
              desc: "Turnos de alimentación con apertura y cierre automático para mejor control.",
            },
            {
              title: "Análisis de Datos",
              desc: "Obtén insights valiosos sobre patrones de asistencia con reportes personalizados.",
            },
            {
              title: "Gestión de Usuarios",
              desc: "Administra perfiles de usuario con información completa y segura.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm p-5"
            >
              <h4 className="text-green-600 font-semibold mb-1 text-sm">
                {item.title}
              </h4>
              <p className="text-sm text-gray-500 leading-snug">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
      </div>

    </div>
  );
}
