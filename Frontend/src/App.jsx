import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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

/* SUPERVISOR */
import Inicio from "./Paginas/Supervisor/Inicio";
import PerfilSupervisor from "./Paginas/Supervisor/Perfil";
import Registrar from "./Paginas/Supervisor/Registrar";
import Reportes from "./Paginas/Supervisor/Reportes";

/* APRENDIZ EXTERNO */
import PerfilAprendiz from "./Paginas/AprendizExterno/Perfil.jsx";
import ReservasAprendiz from "./Paginas/AprendizExterno/ReservasAprendiz.jsx";

/* CRUD */
import CrudUsuarios from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma from "./Tablas/Programas/CrudPrograma.jsx";
import CrudReservas from "./Tablas/Reservas/CrudReservas.jsx";
import CrudRoles from "./Tablas/Roles/CrudRoles.jsx";

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);

  return (
    <>
      {/* Chatbot siempre visible */}
      <Chatbot />
      <NavBar/>
      <Routes>
        {/* ================= LOGIN ================= */}
        <Route path="/" element={<Login onLogin={setUsuarioLogeado} />} />
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* ================= SUPERVISOR ================= */}
        <Route path="/supervisor/*" element={
            <div className="flex min-h-screen bg-gray-100">
              <Sidebar />
              <div className="flex-1">
                <main className="p-6">
                  <Routes>
                    <Route index element={<Inicio />} />
                    <Route path="perfil" element={<PerfilSupervisor />} />
                    <Route path="registrar" element={<Registrar />} />
                    <Route path="reportes" element={<Reportes />} />
                    <Route path="*" element={<Navigate to="/supervisor" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />

        {/* ================= ADMINISTRADOR ================= */}
        <Route path="/Administrador/*" element={
            <div className="flex min-h-screen bg-gray-100">
              <Sidebar />
              <div className="flex-1">
                <main className="p-6">
                  <Routes>
                    <Route index element={<InicioAdministrador />} />
                    <Route path="perfil" element={<PerfilAdministrador />} />
                    <Route path="registrar" element={<RegistrarAdministrador />} />
                    <Route path="reportes" element={<ReportesAdministrador />} />
                    <Route path="*" element={<Navigate to="/supervisor" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />

        {/* ================= APRENDIZ EXTERNO (SIN NavBar) ================= */}
        <Route
          path="/aprendiz/*"
          element={
            <div className="min-h-screen bg-gray-50">
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <Routes>
                  <Route index element={<Navigate to="perfil" replace />} />
                  <Route path="perfil" element={<PerfilAprendiz />} />
                  <Route path="reservas" element={<ReservasAprendiz />} />
                  <Route path="*" element={<Navigate to="/aprendiz/perfil" replace />} />
                </Routes>
              </main>
            </div>
          }
        />

        {/* ================= CRUD (CON NavBar) ================= */}
        <Route
          path="/usuarios"
          element={
            <div className="min-h-screen bg-gray-50">
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <CrudUsuarios />
              </main>
            </div>
          }
        />
        <Route
          path="/fichas"
          element={
            <div className="min-h-screen bg-gray-50">
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <CrudFichas />
              </main>
            </div>
          }
        />
        <Route
          path="/programas"
          element={
            <div className="min-h-screen bg-gray-50">
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <CrudPrograma />
              </main>
            </div>
          }
        />
        <Route
          path="/reservas"
          element={
            <div className="min-h-screen bg-gray-50">
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <CrudReservas />
              </main>
            </div>
          }
        />
        <Route
          path="/roles"
          element={
            <div className="min-h-screen bg-gray-50">
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <CrudRoles />
              </main>
            </div>
          }
        />

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer/>
      {usuarioLogeado && (
        <h2 style={{ textAlign: "center", marginTop: "50px" }}>
          Bienvenido {usuarioLogeado.Nom_Usuario}
        </h2>
      )}
    </>
  );
}

export default App;