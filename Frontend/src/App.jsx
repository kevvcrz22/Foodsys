import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* PÁGINAS */
import Login from "./Paginas/Login/Login.jsx";

/* COMPONENTES */
import Chatbot from "./Components/Chatbot.jsx";
import Sidebar from "./Components/Sidebar.jsx";

/* LAYOUT */
import NavBar from "./Paginas/navBar.jsx";

/* SUPERVISOR */
import Inicio from "./Paginas/Login/Supervisor/Inicio";
import PerfilSupervisor from "./Paginas/Login/Supervisor/Perfil";
import Registrar from "./Paginas/Login/Supervisor/Registrar";
import Reportes from "./Paginas/Login/Supervisor/Reportes";

/* APRENDIZ EXTERNO */
import PerfilAprendiz from "./Components/AprendizExterno/Perfil.jsx";
import ReservasAprendiz from "./Components/AprendizExterno/ReservasAprendiz.jsx";

/* CRUD */
import CrudUsuarios from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma from "./Tablas/Programas/CrudPrograma.jsx";
import CrudReservas from "./Tablas/Reservas/CrudReservas.jsx";

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);

  return (
    <>
      {/* Chatbot siempre visible */}
      <Chatbot />

      <Routes>
        {/* ================= LOGIN ================= */}
        <Route path="/" element={<Login onLogin={setUsuarioLogeado} />} />
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* ================= SUPERVISOR ================= */}
        <Route
          path="/supervisor/*"
          element={
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
              <NavBar />
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
              <NavBar />
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
              <NavBar />
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
              <NavBar />
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <CrudReservas />
              </main>
            </div>
          }
        />

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {usuarioLogeado && (
        <h2 style={{ textAlign: "center", marginTop: "50px" }}>
          Bienvenido {usuarioLogeado.Nom_Usuario}
        </h2>
      )}
    </>
  );
}

export default App;