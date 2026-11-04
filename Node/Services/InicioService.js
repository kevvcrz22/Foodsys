// Services/InicioService.js
// Servicio que genera las tarjetas de vistas disponibles
// para un rol especifico del usuario autenticado

import Permisos_Vista from "../Middleware/PermisosConfig.js";

// Descripciones de cada vista del sistema
// Cada vista tiene un nombre visible y una descripcion
const Descripciones_Vista = {
  Registrar: {
    Nombre: "Registrar",
    Descripcion: "Registra la asistencia de aprendices",
    Icono: "Edit",
    Ruta: "/Registrar",
  },
  Reservar: {
    Nombre: "Reservar",
    Descripcion: "Genera tu reserva de alimentos",
    Icono: "CalendarCheck",
    Ruta: "/Reservar",
  },
  Usuarios: {
    Nombre: "Usuarios",
    Descripcion: "Gestiona los usuarios del sistema",
    Icono: "Users",
    Ruta: "/usuarios",
  },
  Ficha: {
    Nombre: "Fichas",
    Descripcion: "Administra las fichas de formacion",
    Icono: "FileText",
    Ruta: "/fichas",
  },
  Reporte: {
    Nombre: "Reportes",
    Descripcion: "Consulta estadisticas y reportes",
    Icono: "BarChart3",
    Ruta: "/Reportes",
  },
  Novedad: {
    Nombre: "Novedades",
    Descripcion: "Gestiona reservas excepcionales",
    Icono: "ClipboardList",
    Ruta: "/Novedades",
  },
  Menu: {
    Nombre: "Menu",
    Descripcion: "Configura los menus del comedor",
    Icono: "UtensilsCrossed",
    Ruta: "/menus",
  },
  Programas: {
    Nombre: "Programas",
    Descripcion: "Administra programas de formacion",
    Icono: "GraduationCap",
    Ruta: "/programas",
  },
};

class InicioService {
  // Retorna las vistas a las que el rol tiene acceso
  ObtenerVistasPorRol(Rol_Activo) {
    const Vistas_Disponibles = [];

    // Recorre cada vista y verifica si el rol tiene acceso
    for (const [Clave, Roles] of Object.entries(Permisos_Vista)) {
      if (Roles.includes(Rol_Activo)) {
        const Info = Descripciones_Vista[Clave];
        if (Info) {
          Vistas_Disponibles.push({
            Clave_Vista: Clave,
            ...Info,
          });
        }
      }
    }

    return Vistas_Disponibles;
  }
}

export default new InicioService();
