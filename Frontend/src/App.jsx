import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

/* LOGIN */
import Login from "./Paginas/Login/Login.jsx";

/* COMPONENTES */
import Chatbot from "./Components/Chatbot.jsx";
import Footer from "./Components/Footer.jsx";
import NavBar from "./Components/navBar.jsx";
import Sidebar from "./Components/Sidebar.jsx";

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
import PerfilExterno from "./Paginas/Externo/PerfilExterno.jsx";
import ReservasExterno from "./Paginas/Externo/ReservasExterno.jsx";

/* CRUD / TABLAS */
import CrudUsuarios from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudUsuariosRoles from "./Tablas/RolesUsuarios/CrudUsuariosRoles.jsx";
import CrudFichas from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma from "./Tablas/Programas/CrudPrograma.jsx";
import CrudReservas from "./Tablas/Reservas/CrudReservas.jsx";
import CrudRoles from "./Tablas/Roles/CrudRoles.jsx";

/* ─────────────────────────────────────────────────────── */

const RUTAS_POR_ROL = {
  Administrador:      "/Administrador",
  Supervisor:         "/supervisor",
  Coordinador:        "/coordinador",
  "Aprendiz Interno": "/interno",
  "Aprendiz Externo": "/Externo",
};

/* ── ProtectedRoute ──
   - Si no está autenticado → redirige a login "/"
   - Si su rol no está en allowedRoles → redirige a la ruta de su propio rol */
const ProtectedRoute = ({ children, allowedRoles, isAuth, rolActivo }) => {
  if (!isAuth) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(rolActivo)) {
    return <Navigate to={RUTAS_POR_ROL[rolActivo] || "/"} replace />;
  }
  return children;
};

/* Layout con Sidebar */
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

  const [usuarioLogeado, setUsuarioLogeado] = useState(null);
  const [isAuth, setIsAuth]       = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles]         = useState([]);
  const [rolActivo, setRolActivo] = useState(null);

  useEffect(() => {
    const syncAuthState = () => {
      const token           = localStorage.getItem("token");
      const usuario         = localStorage.getItem("usuario");
      const storedRoles     = JSON.parse(localStorage.getItem("roles")) || [];
      const storedRolActivo = localStorage.getItem("rolActivo");

      if (!token || !usuario) {
        setIsAuth(false);
        setIsLoading(false);
        return;
      }

      try {
        setUsuarioLogeado(JSON.parse(usuario));
        setIsAuth(true);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setIsAuth(false);
      }

      setRoles(storedRoles);
      setRolActivo(storedRolActivo);
      setIsLoading(false);
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  const authProps = { isAuth, rolActivo };

  if (isLoading) return <div className="text-center mt-20">Cargando...</div>;

  return (
    <>
      <Chatbot />

      <NavBar
        usuario={usuarioLogeado}
        roles={roles}
        rolActivo={rolActivo}
        onCambioRol={(nuevoRol) => {
          localStorage.setItem("rolActivo", nuevoRol);
          setRolActivo(nuevoRol);
          navigate(RUTAS_POR_ROL[nuevoRol] || "/");
        }}
        onCerrarSesion={() => {
          localStorage.clear();
          setUsuarioLogeado(null);
          setIsAuth(false);
          setRoles([]);
          setRolActivo(null);
          navigate("/");
        }}
      />

      <Routes>

        {/* ── LOGIN ─────────────────────────────────────────── */}
        <Route
          path="/"
          element={
            isAuth
              ? <Navigate to={RUTAS_POR_ROL[rolActivo] || "/"} replace />
              : <Login
                  onLogin={(user, rolesFromBackend, rolActivoFromLogin) => {
                    localStorage.setItem("usuario", JSON.stringify(user));
                    localStorage.setItem("roles", JSON.stringify(rolesFromBackend));
                    localStorage.setItem("rolActivo", rolActivoFromLogin);
                    localStorage.setItem("token", "ok");
                    setUsuarioLogeado(user);
                    setIsAuth(true);
                    setRoles(rolesFromBackend);
                    setRolActivo(rolActivoFromLogin);
                    navigate(RUTAS_POR_ROL[rolActivoFromLogin] || "/");
                  }}
                />
          }
        />

        {/* ── ADMINISTRADOR ─────────────────────────────────── */}
        <Route
          path="/Administrador/*"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador"]}>
              <LayoutConSidebar>
                <Routes>
                  <Route index            element={<InicioAdministrador />} />
                  <Route path="Perfil"    element={<PerfilAdministrador />} />
                  <Route path="Registrar" element={<RegistrarAdministrador />} />
                  <Route path="Reportes"  element={<ReportesAdministrador />} />
                  <Route path="Reservas"  element={<ReservasAdministrador />} />
                  <Route path="*"         element={<Navigate to="/Administrador" replace />} />
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

        {/* ── APRENDIZ EXTERNO ──────────────────────────────── */}
        <Route
          path="/Externo/*"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Aprendiz Externo"]}>
              <LayoutConSidebar>
                <Routes>
                  <Route index           element={<PerfilExterno />} />
                  <Route path="Perfil"   element={<PerfilExterno />} />
                  <Route path="Reservas" element={<ReservasExterno />} />
                  <Route path="*"        element={<Navigate to="/Externo" replace />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── TABLAS — solo Administrador ───────────────────── */}
        <Route
          path="/fichas"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador"]}>
              <LayoutConSidebar><CrudFichas /></LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/programas"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador"]}>
              <LayoutConSidebar><CrudPrograma /></LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador"]}>
              <LayoutConSidebar><CrudRoles /></LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/UsuariosRoles"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador"]}>
              <LayoutConSidebar><CrudUsuariosRoles /></LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador"]}>
              <LayoutConSidebar><CrudUsuarios /></LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── TABLA RESERVAS — Administrador y Supervisor ───── */}
        <Route
          path="/reservas"
          element={
            <ProtectedRoute {...authProps} allowedRoles={["Administrador", "Supervisor"]}>
              <LayoutConSidebar><CrudReservas /></LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* ── FALLBACK ──────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      <Footer />
    </>
  );
}

export default App;