import { useState, useEffect, useContext } from "react";
import {
  Routes, Route, Navigate,
  useNavigate, useLocation,
} from "react-router-dom";

/* LOGIN */
import Login from "./Paginas/Login/Login.jsx";
import Perfil from "./Paginas/Perfil/Perfil.jsx";
import Inicio from "./Paginas/Inicio/Inicio.jsx";

/* PAGINAS PUBLICAS */
import Contacto from "./Paginas/Contacto/Contacto.jsx";
import QueEsFoodsys from "./Paginas/About/QueEsFoodsys.jsx";

/* COMPONENTES */
import Chatbot from "./Components/Chatbot.jsx";
import Footer from "./Components/Footer.jsx";
import NavBar from "./Components/NavBar/Nav.jsx";
import Sidebar from "./Components/Sidebar.jsx";

/* Contexto de autenticacion */
import { AuthContext } from "./context/authContext.jsx";
import GenerateQR from "./Tablas/Usuarios/GenerateQR.jsx";

/* VISTAS COMPARTIDAS */
import Reportes from "./Paginas/Reportes/Reportes.jsx";
import Novedades from "./Paginas/Novedades/Novedades.jsx";
import RegistrarVista from "./Paginas/Registrar/Registro.jsx";

/* CRUD EXISTENTES */
import CrudUsuarios from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudUsuariosRoles from "./Tablas/RolesUsuarios/CrudUsuariosRoles.jsx";
import CrudFichas from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma from "./Tablas/Programas/CrudPrograma.jsx";
import CrudRoles from "./Tablas/Roles/CrudRoles.jsx";
import CrudPlatos from "./Tablas/Platos/CrudPlatos.jsx";
import CrudMenus from "./Tablas/Menus/CrudMenus.jsx";
import CrudReservas from "./Tablas/Reservas/ReservaForm.jsx";
import Aprendices from "./Tablas/Usuarios/Aprendices.jsx";

/* Mapa de rutas por rol para redirigir despues del login */
const RUTAS_POR_ROL = {
  Administrador: "/Administrador",
  Supervisor: "/supervisor",
  Coordinador: "/coordinador",
  "Aprendiz Interno": "/Interno",
  "Aprendiz Externo": "/Externo",
  "Pasante Interno": "/Pasante",
  "Pasante Externo": "/Pasante",
  Pasante: "/Pasante",
  Cocina: "/Cocina",
  Bienestar: "/Bienestar",
};

/* Protege rutas verificando autenticacion y rol */
const ProtectedRoute = ({
  children, allowedRoles, isAuth, rolActivo,
}) => {
  if (!isAuth) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(rolActivo)) {
    const Ruta = RUTAS_POR_ROL[rolActivo] || "/";
    return <Navigate to={Ruta} replace />;
  }
  return children;
};

/* Layout con sidebar para paginas internas.
   Recibe los datos del rol para pasarlos al Sidebar y al NavRolSelector dentro de el. */
const LayoutConSidebar = ({ children, roles, rolActivo, onCambioRol }) => (
  <div className="flex h-full bg-gray-100">
    <Sidebar
      roles={roles}
      rolActivo={rolActivo}
      onCambioRol={onCambioRol}
    />
    <div className="flex-1 min-w-0">
      <main className="p-4 md:p-6">{children}</main>
    </div>
  </div>
);

function App() {
  const Navegar = useNavigate();
  const Ubicacion = useLocation();
  const { setUser } = useContext(AuthContext);

  const [Usuario_Logeado, Set_UsuarioLogeado] = useState(null);
  const [Es_Auth, Set_EsAuth] = useState(false);
  const [Cargando, Set_Cargando] = useState(true);
  const [Roles, Set_Roles] = useState([]);
  const [Rol_Activo, Set_RolActivo] = useState(null);

  /* Rehidrata sesion al recargar la pagina */
  useEffect(() => {
    const Sincronizar = () => {
      const Token_Guardado = localStorage.getItem("token");
      const Usuario_Raw = localStorage.getItem("usuario");
      const Roles_Guardados = JSON.parse(
        localStorage.getItem("roles") || "[]"
      );
      const Rol_Guardado = localStorage.getItem("rolActivo");

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

  /* Props compartidos de layout para pasar al Sidebar desde cada ruta protegida */
  const Props_Layout = {
    roles: Roles,
    rolActivo: Rol_Activo,
    onCambioRol: (Nuevo_Rol) => {
      localStorage.setItem("rolActivo", Nuevo_Rol);
      Set_RolActivo(Nuevo_Rol);
    },
  };

  if (Cargando) {
    return (
      <div className="text-center mt-20">Cargando...</div>
    );
  }

  /* Manejador de login exitoso */
  const Manejar_Login = (
    Usr, Roles_Recibidos, Rol_Recibido, Token_JWT
  ) => {
    localStorage.setItem("token", Token_JWT);
    localStorage.setItem("usuario", JSON.stringify(Usr));
    localStorage.setItem("roles", JSON.stringify(Roles_Recibidos));
    localStorage.setItem("rolActivo", Rol_Recibido);

    Set_UsuarioLogeado(Usr);
    Set_EsAuth(true);
    Set_Roles(Roles_Recibidos);
    Set_RolActivo(Rol_Recibido);
    Navegar(RUTAS_POR_ROL[Rol_Recibido] || "/");
  };

  /* Manejador de cerrar sesion */
  const Manejar_CerrarSesion = () => {
    localStorage.clear();
    Set_UsuarioLogeado(null);
    Set_EsAuth(false);
    Set_Roles([]);
    Set_RolActivo(null);
    setUser(null);
    Navegar("/");
  };

  const Ocultar_Chatbot =
    Ubicacion.pathname.startsWith("/coordinador");

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
        {/* QR para aprendices y pasantes */}
        <Route
          path="/reservar/generateAlimentoqr"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={[
                "Aprendiz Interno",
                "Aprendiz Externo",
                "Pasante",
              ]}
            >
              <GenerateQR />
            </ProtectedRoute>
          }
        />

        {/* LOGIN */}
        <Route
          path="/"
          element={
            Es_Auth
              ? <Navigate to={RUTAS_POR_ROL[Rol_Activo]} />
              : <Login onLogin={Manejar_Login} />
          }
        />

        {/* RUTAS PUBLICAS */}
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/about" element={<QueEsFoodsys />} />

        {/* ADMINISTRADOR */}
        <Route
          path="/Administrador/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Reportes" element={<Reportes />} />
                  <Route path="Reservas" element={<CrudReservas />} />
                  <Route path="Novedades" element={<Novedades />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* SUPERVISOR */}
        <Route
          path="/supervisor/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Supervisor"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Registrar" element={<RegistrarVista />} />
                  <Route path="Reportes" element={<Reportes />} />
                  <Route
                    path="*"
                    element={<Navigate to="/supervisor" replace />}
                  />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* COORDINADOR */}
        <Route
          path="/coordinador/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Coordinador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Novedades" element={<Novedades />} />
                  <Route path="Reportes" element={<Reportes />} />
                  <Route path="Aprendices" element={<Aprendices />} />
                  <Route
                    path="*"
                    element={<Navigate to="/coordinador" replace />}
                  />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* APRENDIZ EXTERNO */}
        <Route
          path="/Externo/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Aprendiz Externo"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Reservas" element={<CrudReservas />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* APRENDIZ INTERNO */}
        <Route
          path="/Interno/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Aprendiz Interno"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Reservas" element={<CrudReservas />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* PASANTE */}
        <Route
          path="/Pasante/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Pasante"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Reservas" element={<CrudReservas />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* COCINA */}
        <Route
          path="/Cocina/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Cocina"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Reportes" element={<Reportes />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* BIENESTAR */}
        <Route
          path="/Bienestar/*"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Bienestar"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Routes>
                  <Route index element={<Inicio />} />
                  <Route path="Inicio" element={<Inicio />} />
                  <Route path="Perfil" element={<Perfil />} />
                  <Route path="Reportes" element={<Reportes />} />
                  <Route path="Novedades" element={<Novedades />} />
                </Routes>
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* CRUDs (solo Admin) */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudUsuarios />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/UsuariosRoles"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudUsuariosRoles />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fichas"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudFichas />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/programas"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudPrograma />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudRoles />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/platos"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudPlatos />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/menus"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudMenus />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* Reservas (Admin y Supervisor) */}
        <Route
          path="/reservas"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={["Administrador", "Supervisor"]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <CrudReservas />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* Aprendices (Admin, Coordinador y Bienestar) */}
        <Route
          path="/aprendices"
          element={
            <ProtectedRoute
              {...Props_Auth}
              allowedRoles={[
                "Administrador",
                "Coordinador",
                "Bienestar",
              ]}
            >
              <LayoutConSidebar {...Props_Layout}>
                <Aprendices />
              </LayoutConSidebar>
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;