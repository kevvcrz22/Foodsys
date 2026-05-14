// App.jsx
//
// Archivo principal del enrutador de FoodSys.
//
// RESPONSABILIDADES:
//   1. Rehidratar la sesion del usuario al recargar la pagina desde localStorage.
//   2. Proteger cada ruta verificando autenticacion (isAuth) y el rol activo.
//   3. Redirigir al usuario al dashboard correcto segun su rol despues del login.
//   4. Proveer el layout con sidebar para todas las rutas internas.
//
// REGLA DE ACCESO POR ROL:
//   Cada ruta solo acepta el rol listado en allowedRoles.
//   Si un usuario tiene dos roles (ej: Coordinador y Aprendiz Externo),
//   no puede ejecutar funciones de Aprendiz Externo mientras el rol activo
//   sea Coordinador. El sistema respeta el rol que este seleccionado,
//   no todos los roles que tenga el usuario.
//
// ROLES Y SUS RUTAS BASE:
//   Administrador      -> /Administrador   (todas las tablas CRUD, sin modulo Reservar personal)
//   Supervisor         -> /supervisor      (Registrar consumos, Reportes)
//   Coordinador        -> /coordinador     (Novedades, Reportes, Aprendices)
//   Aprendiz Interno   -> /Interno         (Reservar, Historial)
//   Aprendiz Externo   -> /Externo         (Reservar, Historial)
//   Pasante Interno    -> /PasanteInterno  (Reservar, Historial)
//   Pasante Externo    -> /PasanteExterno  (Reservar, Historial)
//   Cocina             -> /Cocina          (Verificar reservas de externos, Plan del dia, Reportes)
//   Bienestar          -> /Bienestar       (Novedades, Reportes)

import { useState, useEffect, useContext } from "react";
import {
  Routes, Route, Navigate,
  useNavigate, useLocation,
} from "react-router-dom";

// ── Paginas de autenticacion y publicas ──────────────────────────────────────
import Login        from "./Paginas/Login/Login.jsx";
import Perfil       from "./Paginas/Perfil/Perfil.jsx";
import Inicio       from "./Paginas/Inicio/Inicio.jsx";
import Contacto     from "./Paginas/Contacto/Contacto.jsx";
import QueEsFoodsys from "./Paginas/About/QueEsFoodsys.jsx";

// ── Componentes de layout ────────────────────────────────────────────────────
import Chatbot  from "./Components/Chatbot.jsx";
import Footer   from "./Components/Footer.jsx";
import NavBar   from "./Components/NavBar/Nav.jsx";
import Sidebar  from "./Components/Sidebar.jsx";

// ── Contexto de autenticacion ────────────────────────────────────────────────
import { AuthContext } from "./context/authContext.jsx";

// ── Vistas compartidas entre roles ───────────────────────────────────────────
import Reportes        from "./Paginas/Reportes/Reportes.jsx";
import Novedades       from "./Paginas/Novedades/Novedades.jsx";
import RegistrarVista  from "./Paginas/Registrar/Registro.jsx";
import ReservasPag     from "./Tablas/Reservas/Reservas.jsx";

// Modulo exclusivo del rol Cocina: verificar reservas de externos
import ValidarReservasCocina from "./Paginas/Validar/ValidarReservas.jsx";
// Plan del dia de Cocina: cuantos platos preparar, excepcionales, balance del turno
import PlanCocina from "./Paginas/Cocina/PlanCocina.jsx";

// ── Tablas CRUD (uso administrativo) ─────────────────────────────────────────
import CrudUsuarios       from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudUsuariosRoles  from "./Tablas/RolesUsuarios/CrudUsuariosRoles.jsx";
import CrudFichas         from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma       from "./Tablas/Programas/CrudPrograma.jsx";
import CrudRoles          from "./Tablas/Roles/CrudRoles.jsx";
import CrudPlatos         from "./Tablas/Platos/CrudPlatos.jsx";
import CrudMenus          from "./Tablas/Menus/CrudMenus.jsx";
import CrudReservas       from "./Tablas/Reservas/CrudReservas.jsx";
import Aprendices         from "./Tablas/Usuarios/Aprendices.jsx";
import ReservaForm        from "./Tablas/Reservas/ReservaForm.jsx";

// ── Mapa de redireccion despues del login por rol ────────────────────────────
// Cada rol tiene su propia ruta base. Si un usuario tiene dos roles,
// la redireccion depende del rol que haya sido seleccionado como activo.
const RUTAS_POR_ROL = {
  Administrador:     "/Administrador",
  Supervisor:        "/supervisor",
  Coordinador:       "/coordinador",
  "Aprendiz Interno": "/Interno",
  "Aprendiz Externo": "/Externo",
  "Pasante Interno":  "/PasanteInterno",
  "Pasante Externo":  "/PasanteExterno",
  Cocina:            "/Cocina",
  Bienestar:         "/Bienestar",
};

// ── Componente ProtectedRoute ────────────────────────────────────────────────
// Verifica dos condiciones antes de mostrar el contenido:
//   1. El usuario esta autenticado (tiene token valido).
//   2. El rol activo esta en la lista de roles permitidos para esa ruta.
// Si falla alguna condicion, redirige al lugar correcto.
const ProtectedRoute = ({ children, allowedRoles, isAuth, rolActivo }) => {
  // Si no esta autenticado, va al login
  if (!isAuth) return <Navigate to="/" replace />;
  // Si el rol activo no tiene permiso para esta ruta, lo manda a su dashboard
  if (!allowedRoles.includes(rolActivo)) {
    const Ruta = RUTAS_POR_ROL[rolActivo] || "/";
    return <Navigate to={Ruta} replace />;
  }
  return children;
};

// ── Layout con Sidebar ───────────────────────────────────────────────────────
// Envuelve el contenido de cada ruta interna con la barra lateral de navegacion.
const LayoutConSidebar = ({ children, roles, rolActivo, onCambioRol, onCerrarSesion }) => (
  <div className="flex h-full bg-gray-100">
    <Sidebar
      roles={roles}
      rolActivo={rolActivo}
      onCambioRol={onCambioRol}
      onCerrarSesion={onCerrarSesion}
    />
    <div className="flex-1 min-w-0">
      <main className="p-4 md:p-6">{children}</main>
    </div>
  </div>
);

// ── Componente principal App ──────────────────────────────────────────────────
function App() {
  const Navegar   = useNavigate();
  const Ubicacion = useLocation();
  const { setUser } = useContext(AuthContext);

  const [Usuario_Logeado, Set_UsuarioLogeado] = useState(null);
  const [Es_Auth,         Set_EsAuth]         = useState(false);
  const [Cargando,        Set_Cargando]        = useState(true);
  const [Roles,           Set_Roles]           = useState([]);
  const [Rol_Activo,      Set_RolActivo]       = useState(null);

  // Rehidrata la sesion al recargar la pagina.
  // Lee el token y el usuario de localStorage para no pedir el login de nuevo.
  useEffect(() => {
    const Sincronizar = () => {
      const Token_Guardado  = localStorage.getItem("token");
      const Usuario_Raw     = localStorage.getItem("usuario");
      const Roles_Guardados = JSON.parse(localStorage.getItem("roles") || "[]");
      const Rol_Guardado    = localStorage.getItem("rolActivo");

      // Un token valido tiene exactamente 3 partes separadas por puntos
      const Token_Valido =
        Token_Guardado &&
        Token_Guardado !== "ok" &&
        Token_Guardado.split(".").length === 3;

      if (!Token_Valido || !Usuario_Raw) {
        localStorage.clear();
        Set_EsAuth(false);
        setUser(null);
        Set_Cargando(false);
        return;
      }

      try {
        const Obj_Usuario = JSON.parse(Usuario_Raw);
        Set_UsuarioLogeado(Obj_Usuario);
        setUser(Obj_Usuario);
        Set_EsAuth(true);
        Set_Roles(Roles_Guardados);
        Set_RolActivo(Rol_Guardado);
      } catch {
        localStorage.clear();
        Set_EsAuth(false);
        setUser(null);
      } finally {
        Set_Cargando(false);
      }
    };

    Sincronizar();
    window.addEventListener("storage", Sincronizar);
    return () => window.removeEventListener("storage", Sincronizar);
  }, [setUser]);

  const Props_Auth = { isAuth: Es_Auth, rolActivo: Rol_Activo };

  // Limpia el estado local y redirige al login
  const Manejar_CerrarSesion = () => {
    localStorage.clear();
    Set_UsuarioLogeado(null);
    Set_EsAuth(false);
    Set_Roles([]);
    Set_RolActivo(null);
    setUser(null);
    Navegar("/");
  };

  // Props del layout compartidos entre todas las rutas protegidas
  const Props_Layout = {
    roles: Roles,
    rolActivo: Rol_Activo,
    onCambioRol: (Nuevo_Rol) => {
      localStorage.setItem("rolActivo", Nuevo_Rol);
      Set_RolActivo(Nuevo_Rol);
    },
    onCerrarSesion: Manejar_CerrarSesion,
  };

  if (Cargando) {
    return <div className="text-center mt-20">Cargando...</div>;
  }

  // Registra el login exitoso: guarda token, usuario y roles en localStorage
  const Manejar_Login = (Usr, Roles_Recibidos, Rol_Recibido, Token_JWT) => {
    localStorage.setItem("token",    Token_JWT);
    localStorage.setItem("usuario",  JSON.stringify(Usr));
    localStorage.setItem("roles",    JSON.stringify(Roles_Recibidos));
    localStorage.setItem("rolActivo", Rol_Recibido);

    Set_UsuarioLogeado(Usr);
    Set_EsAuth(true);
    Set_Roles(Roles_Recibidos);
    Set_RolActivo(Rol_Recibido);
    Navegar(RUTAS_POR_ROL[Rol_Recibido] || "/");
  };

  // El chatbot no aparece en la vista del coordinador por diseno
  const Ocultar_Chatbot = Ubicacion.pathname.startsWith("/coordinador");

  return (
    <>
      {!Ocultar_Chatbot && <Chatbot />}
      <NavBar
        usuario={Usuario_Logeado}
        roles={Roles}
        rolActivo={Rol_Activo}
        onCambioRol={(Nuevo_Rol) => {
          localStorage.setItem("rolActivo", Nuevo_Rol);
          Set_RolActivo(Nuevo_Rol);
          Navegar(RUTAS_POR_ROL[Nuevo_Rol] || "/");
        }}
        onCerrarSesion={Manejar_CerrarSesion}
      />

      <Routes>

        {/* ── LOGIN ──────────────────────────────────────────────────────── */}
        <Route
          path="/"
          element={
            Es_Auth
              ? <Navigate to={RUTAS_POR_ROL[Rol_Activo]} />
              : <Login onLogin={Manejar_Login} />
          }
        />

        {/* ── RUTAS PUBLICAS ─────────────────────────────────────────────── */}
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/about"    element={<QueEsFoodsys />} />

        {/* ── ADMINISTRADOR ──────────────────────────────────────────────── */}
        {/* El Administrador tiene acceso a todos los CRUD y modulos          */}
        {/* EXCEPTO al modulo personal de Reservar (ese es de aprendices).    */}
        <Route
          path="/Administrador/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Administrador"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index             element={<Inicio />} />
                  <Route path="Inicio"     element={<Inicio />} />
                  <Route path="Perfil"     element={<Perfil />} />
                  <Route path="Reportes"   element={<Reportes />} />
                  <Route path="Novedades"  element={<Novedades />} />
                  {/* Redirigir cualquier subruta desconocida al inicio */}
                  <Route path="*" element={<Navigate to="/Administrador" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── SUPERVISOR ─────────────────────────────────────────────────── */}
        {/* El Supervisor registra el consumo de reservas escaneando el QR    */}
        {/* del aprendiz. Este es su modulo principal.                         */}
        <Route
          path="/supervisor/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Supervisor"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index               element={<Inicio />} />
                  <Route path="Inicio"       element={<Inicio />} />
                  <Route path="Perfil"       element={<Perfil />} />
                  <Route path="Registrar"    element={<RegistrarVista />} />
                  <Route path="Reportes"     element={<Reportes />} />
                  <Route path="*" element={<Navigate to="/supervisor" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── COORDINADOR ────────────────────────────────────────────────── */}
        <Route
          path="/coordinador/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Coordinador"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index               element={<Inicio />} />
                  <Route path="Inicio"       element={<Inicio />} />
                  <Route path="Perfil"       element={<Perfil />} />
                  <Route path="Novedades"    element={<Novedades />} />
                  <Route path="Reportes"     element={<Reportes />} />
                  <Route path="Aprendices"   element={<Aprendices />} />
                  <Route path="*" element={<Navigate to="/coordinador" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── APRENDIZ EXTERNO ───────────────────────────────────────────── */}
        {/* Solo puede reservar almuerzo segun las reglas de negocio.          */}
        <Route
          path="/Externo/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Aprendiz Externo"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index             element={<Inicio />} />
                  <Route path="Inicio"     element={<Inicio />} />
                  <Route path="Perfil"     element={<Perfil />} />
                  <Route path="Reservar"   element={<ReservasPag />} />
                  <Route path="*" element={<Navigate to="/Externo" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── APRENDIZ INTERNO ───────────────────────────────────────────── */}
        {/* Puede reservar desayuno, almuerzo y cena.                          */}
        {/* Su flujo de consumo va directo de Generado a Consumido (sin pasar  */}
        {/* por el area de cocina).                                             */}
        <Route
          path="/Interno/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Aprendiz Interno"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index             element={<Inicio />} />
                  <Route path="Inicio"     element={<Inicio />} />
                  <Route path="Perfil"     element={<Perfil />} />
                  <Route path="Reservar"   element={<ReservasPag />} />
                  <Route path="*" element={<Navigate to="/Interno" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── PASANTE INTERNO ────────────────────────────────────────────── */}
        {/* Igual que Aprendiz Interno: accede a las 3 comidas y no pasa por  */}
        {/* el area de cocina. Flujo directo Generado -> Consumido.            */}
        <Route
          path="/PasanteInterno/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Pasante Interno"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index             element={<Inicio />} />
                  <Route path="Inicio"     element={<Inicio />} />
                  <Route path="Perfil"     element={<Perfil />} />
                  <Route path="Reservar"   element={<ReservasPag />} />
                  <Route path="*" element={<Navigate to="/PasanteInterno" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── PASANTE EXTERNO ────────────────────────────────────────────── */}
        {/* Igual que Aprendiz Externo: solo almuerzo y debe pasar por cocina  */}
        {/* antes de que el supervisor pueda consumir su reserva.              */}
        <Route
          path="/PasanteExterno/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Pasante Externo"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index             element={<Inicio />} />
                  <Route path="Inicio"     element={<Inicio />} />
                  <Route path="Perfil"     element={<Perfil />} />
                  <Route path="Reservar"   element={<ReservasPag />} />
                  <Route path="*" element={<Navigate to="/PasanteExterno" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── COCINA ─────────────────────────────────────────────────────── */}
        {/* El personal de cocina verifica la presencia de los aprendices     */}
        {/* externos antes de que puedan usar su QR con el supervisor.        */}
        {/* Endpoint usado: PATCH /api/Reservas/verificar/:id/cocina           */}
        <Route
          path="/Cocina/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Cocina"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index                element={<Inicio />} />
                  <Route path="Inicio"        element={<Inicio />} />
                  <Route path="Perfil"        element={<Perfil />} />
                  {/* Verificar: cambia estado de la reserva de Generado a Verificado */}
                  <Route path="Verificar"     element={<ValidarReservasCocina />} />
                  {/* Plan del dia: cuantos platos preparar, excepcionales, balance */}
                  <Route path="Plan"          element={<PlanCocina />} />
                  <Route path="Reportes"      element={<Reportes />} />
                  <Route path="*" element={<Navigate to="/Cocina" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── BIENESTAR ──────────────────────────────────────────────────── */}
        <Route
          path="/Bienestar/*"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Bienestar"]}>
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index               element={<Inicio />} />
                  <Route path="Inicio"       element={<Inicio />} />
                  <Route path="Perfil"       element={<Perfil />} />
                  <Route path="Reportes"     element={<Reportes />} />
                  <Route path="Novedades"    element={<Novedades />} />
                  <Route path="*" element={<Navigate to="/Bienestar" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── CRUDs ADMINISTRATIVOS (solo Administrador) ─────────────────── */}
        {/* Cada tabla tiene su propia ruta plana para facilitar la navegacion */}
        <Route path="/usuarios"     element={<ProtectedRoute {...Props_Auth} allowedRoles={["Administrador"]}><LayoutConSidebar {...Props_Layout}><CrudUsuarios /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/UsuariosRoles" element={<ProtectedRoute {...Props_Auth} allowedRoles={["Administrador"]}><LayoutConSidebar {...Props_Layout}><CrudUsuariosRoles /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/fichas"       element={<ProtectedRoute {...Props_Auth} allowedRoles={["Administrador"]}><LayoutConSidebar {...Props_Layout}><CrudFichas /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/programas"    element={<ProtectedRoute {...Props_Auth} allowedRoles={["Administrador"]}><LayoutConSidebar {...Props_Layout}><CrudPrograma /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/roles"        element={<ProtectedRoute {...Props_Auth} allowedRoles={["Administrador"]}><LayoutConSidebar {...Props_Layout}><CrudRoles /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/platos" element={
          <ProtectedRoute {...Props_Auth} allowedRoles={['Administrador', 'Cocina']}>
            <LayoutConSidebar {...Props_Layout}>
              {/* soloLectura para Cocina: puede ver platos pero no crear/editar/eliminar */}
              <CrudPlatos soloLectura={Rol_Activo === 'Cocina'} />
            </LayoutConSidebar>
          </ProtectedRoute>
        } />
        <Route path="/menus" element={
          <ProtectedRoute {...Props_Auth} allowedRoles={['Administrador', 'Cocina']}>
            <LayoutConSidebar {...Props_Layout}>
              {/* soloLectura para Cocina: puede ver menus pero no crear/editar/eliminar */}
              <CrudMenus soloLectura={Rol_Activo === 'Cocina'} />
            </LayoutConSidebar>
          </ProtectedRoute>
        } />

        {/* Reservas: visible para Administrador (vista de tabla, no el formulario personal) */}
        <Route
          path="/reservas"
          element={
            <ProtectedRoute {...Props_Auth} allowedRoles={["Administrador"]}>
              <LayoutConSidebar {...Props_Layout}>
                <CrudReservas />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* Aprendices: accesible para Administrador, Coordinador y Bienestar */}
        <Route
          path="/aprendices"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador", "Coordinador", "Bienestar"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Aprendices />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── FALLBACK ──────────────────────────────────────────────────── */}
        {/* Cualquier ruta que no coincida redirige al login o al dashboard   */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;