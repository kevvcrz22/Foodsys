import { useState, useEffect, useContext } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

/* LOGIN */
import Login from "./Paginas/Login/Login.jsx";

/* COMPONENTES */
import Chatbot from "./Components/Chatbot.jsx";
import Footer from "./Components/Footer.jsx";
import NavBar from "./Components/navBar.jsx";
import Sidebar from "./Components/Sidebar.jsx";

/*  Importaciones para el QR */
import { AuthContext } from "./context/authContext.jsx";
import GenerateQR from "./Tablas/Usuarios/GenerateQR.jsx";

/* ADMINISTRADOR */
import InicioAdministrador from "./Paginas/Administrador/InicioAdministrador";
import PerfilAdministrador from "./Paginas/Administrador/PerfilAdministrador";
import RegistrarAdministrador from "./Paginas/Administrador/RegistrarAdministrador";
import ReportesAdministrador from "./Paginas/Administrador/ReportesAdministrador";
import ReservasAdministrador from "./Paginas/Administrador/ReservasAdministrador.jsx";

/* SUPERVISOR */
import Inicio from "./Paginas/Supervisor/InicioSupervisor";
import PerfilSupervisor from "./Paginas/Supervisor/PerfilSupervisor";
import RegistrarSupervisor from "./Paginas/Supervisor/RegistrarSupervisor";
import ReportesSupervisor from "./Paginas/Supervisor/ReportesSupervisor";

/* APRENDIZ EXTERNO */
import InicioExterno from "./Paginas/Externo/InicioExterno.jsx";
import PerfilExterno from "./Paginas/Externo/PerfilExterno.jsx";
import ReservasExterno from "./Paginas/Externo/ReservasExterno.jsx";
import HistorialExterno from "./Paginas/Externo/HistorialExterno.jsx";

/* COORDINADOR */
import InicioCoordinador from "./Paginas/Coordinador/InicioCoordinador";
import NovedadesCoordinador from "./Paginas/Coordinador/NovedadesCoordinador";
import PerfilCoordinador from "./Paginas/Coordinador/PerfilCordinador.jsx";
import ReportesCoordinador from "./Paginas/Coordinador/ReportesCoorddinador.jsx";



/* CRUD EXISTENTES */
import CrudUsuarios from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudUsuariosRoles from "./Tablas/RolesUsuarios/CrudUsuariosRoles.jsx";
import CrudFichas from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma from "./Tablas/Programas/CrudPrograma.jsx";
import CrudReservas from "./Tablas/Reservas/CrudReservas.jsx";
import CrudRoles from "./Tablas/Roles/CrudRoles.jsx";
import CrudPlatos from "./Tablas/Platos/CrudPlatos.jsx";
import CrudMenus from "./Tablas/Menus/CrudMenus.jsx";
import CrudReservasMenu from "./Tablas/ReservasMenu/CrudReservasMenu.jsx";
import Aprendices from "./Tablas/Usuarios/Aprendices.jsx";

/* ─────────────────────────────────────────────────────── */

const RUTAS_POR_ROL = {
  Administrador: "/Administrador",
  Supervisor: "/supervisor",
  Coordinador: "/coordinador",
  "Aprendiz Interno": "/interno",
  "Aprendiz Externo": "/Externo",
};

/* PROTECCIÓN */
const ProtectedRoute = ({ children, allowedRoles, isAuth, rolActivo }) => {
  if (!isAuth) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(rolActivo)) {
    return <Navigate to={RUTAS_POR_ROL[rolActivo] || "/"} replace />;
  }
  return children;
};

/* LAYOUT */
const LayoutConSidebar = ({ children }) => (
  <div className="flex h-full bg-gray-100">
    <Sidebar />
    <div className="flex-1">
      <main className="p-6">{children}</main>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────── */

function App() {
  const navigate = useNavigate();
  const location = useLocation();

   const {user, setUser} = useContext(AuthContext)//estado context global
  
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);
  const [isAuth, setIsAuth]                 = useState(false);
  const [isLoading, setIsLoading]           = useState(true);
  const [roles, setRoles]                   = useState([]);
  const [rolActivo, setRolActivo]           = useState(null);

  /* ── Rehidratar sesión al recargar ── */
  useEffect(() => {
    const syncAuthState = () => {
      const token        = localStorage.getItem("token");
      const usuarioRaw   = localStorage.getItem("usuario");
      const storedRoles  = JSON.parse(localStorage.getItem("roles") || "[]");
      const storedRol    = localStorage.getItem("rolActivo");

      // ✅ Validación real: token debe existir y ser un JWT (3 partes separadas por punto)
      const tokenValido =
        token &&
        token !== "ok" &&          // descarta el placeholder incorrecto
        token.split(".").length === 3;

      if (!tokenValido || !usuarioRaw) {
        localStorage.clear();      // limpia datos inconsistentes
        setIsAuth(false);
        setUser(usuarioRaw)//Estado del context global
        setIsLoading(false);
        return;
      }

      try {
        setUsuarioLogeado(JSON.parse(usuarioRaw));
        setIsAuth(true);
        setRoles(storedRoles);
        setRolActivo(storedRol);
      } catch {
        localStorage.clear();
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  const authProps = { isAuth, rolActivo };

  if (isLoading) return <div className="text-center mt-20">Cargando...</div>;

  /* ── Manejador de login ── */
  const handleLogin = (user, rolesRecibidos, rolActivoRecibido, tokenJWT) => {
    // ✅ Guardar el JWT real que viene del backend
    localStorage.setItem("token",    tokenJWT);
    localStorage.setItem("usuario",  JSON.stringify(user));
    localStorage.setItem("roles",    JSON.stringify(rolesRecibidos));
    localStorage.setItem("rolActivo", rolActivoRecibido);

    setUsuarioLogeado(user);
    setIsAuth(true);
    setRoles(rolesRecibidos);
    setRolActivo(rolActivoRecibido);

    navigate(RUTAS_POR_ROL[rolActivoRecibido] || "/");
  };

  /* ── Manejador de cerrar sesión ── */
  const handleCerrarSesion = () => {
    localStorage.clear();
    setUsuarioLogeado(null);
    setIsAuth(false);
    setRoles([]);
    setRolActivo(null);
    navigate("/");
  };

  const ocultarChatbot = location.pathname.startsWith('/coordinador');
  return (
    <>
      {!ocultarChatbot && <Chatbot />}
      <NavBar
        usuario={usuarioLogeado}
        roles={roles}
        rolActivo={rolActivo}
        onCambioRol={(nuevoRol) => {
          localStorage.setItem("rolActivo", nuevoRol);
          setRolActivo(nuevoRol);
          navigate(RUTAS_POR_ROL[nuevoRol] || "/");
        }}
        onCerrarSesion={handleCerrarSesion}
      />
   
        
  

      <Routes>
               <Route
  path="/generate-qr"
  element={
    <ProtectedRoute {...authProps} allowedRoles={["Aprendiz Externo"]}>
      <GenerateQR />
    </ProtectedRoute>
  }
/>

        {/* ── LOGIN ── */}
        <Route
          path="/"
          element={
            isAuth
              ? <Navigate to={RUTAS_POR_ROL[rolActivo]} />
              : <Login onLogin={handleLogin} />
          }
        />

        {/* ── ADMIN ── */}
        <Route
          path="/Administrador/*"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador"]}>
              <LayoutConSidebar>
                <Routes>
                  <Route index                  element={<InicioAdministrador />}    />
                  <Route path="Perfil"          element={<PerfilAdministrador />}    />
                  <Route path="Registrar"       element={<RegistrarAdministrador />} />
                  <Route path="Reportes"        element={<ReportesAdministrador />}  />
                  <Route path="Reservas"        element={<ReservasAdministrador />}  />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── SUPERVISOR ────────────────────────────────────── */}
        <Route
          path="/supervisor/*"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Supervisor"]}>
              <LayoutConSidebar>
                <Routes>
                  <Route index            element={<Inicio />} />
                  <Route path="Perfil"    element={<PerfilSupervisor />} />
                  <Route path="Registrar" element={<RegistrarSupervisor />} />
                  <Route path="Reportes"  element={<ReportesSupervisor />} />
                  <Route path="*"         element={<Navigate to="/supervisor" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinador/*"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Coordinador"]}>
              <LayoutConSidebar>
                <Routes>
                  <Route index             element={<InicioCoordinador />} />
                  <Route path="Novedades"  element={<NovedadesCoordinador />} />
                  <Route path="Perfil"  element={<PerfilCoordinador />} />
                  <Route path="Aprendices"  element={<Aprendices />} />
                  <Route path="Reportes"  element={<ReportesCoordinador />} />

                  <Route path="*"          element={<Navigate to="/coordinador" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── CRUD ADMIN ── */}
        <Route path="/usuarios"     element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudUsuarios /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/UsuariosRoles" element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudUsuariosRoles /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/fichas"       element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudFichas /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/programas"    element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudPrograma /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/roles"        element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudRoles /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/platos"        element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudPlatos /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/menus"         element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudMenus /></LayoutConSidebar></ProtectedRoute>} />
        <Route path="/reservas-menu" element={<ProtectedRoute {...authProps} allowedRoles={["Administrador"]}><LayoutConSidebar><CrudReservasMenu /></LayoutConSidebar></ProtectedRoute>} />

        {/* ── RESERVAS ── */}
        <Route path="/reservas" element={<ProtectedRoute {...authProps} allowedRoles={["Administrador", "Supervisor"]}><LayoutConSidebar><CrudReservas /></LayoutConSidebar></ProtectedRoute>} />

        {/* ── EXTERNO ── */}
        <Route
          path="/Externo/*"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Aprendiz Externo"]}>
              <LayoutConSidebar>
                <Routes>
                  <Route index element={<InicioExterno />} />
                  <Route path="Perfil" element={<PerfilExterno />} />
                  <Route path="Reservas" element={<ReservasExterno />} />
                  <Route path="Historial" element={<HistorialExterno />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />
                   <Route
          path="/aprendices"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador", "Coordinador"]}>
              <LayoutConSidebar><Aprendices /></LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── FALLBACK ── */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

      <Footer />
    </>
  );
}

export default App;