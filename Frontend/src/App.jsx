import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
/* PÚBLICO */
import Login from "./Paginas/Login/Login.jsx";

import Chatbot from "./Components/Chatbot.jsx";

import CrudUsuarios from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma from "./Tablas/Programas/CrudPrograma.jsx";
import CrudReservas from "./Tablas/Reservas/CrudReservas.jsx";
import NavBar from "./Paginas/navBar.jsx";


import Chatbot from "./Components/Chatbot.jsx";
/* CRUD */
import CrudUsuarios from "./Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Fichas/CrudFichas.jsx";
import CrudPrograma from "./Programas/CrudPrograma.jsx";
import CrudReservas from "./Reservas/CrudReservas.jsx";
/* LAYOUT */
import NavBar from "./navBar.jsx";
import Sidebar from "./Components/Sidebar.jsx";
/* SUPERVISOR */
import Inicio from "./Paginas/Login/Supervisor/Inicio";
import Perfil from "./Paginas/Login/Supervisor/Perfil";
import Registrar from "./Paginas/Login/Supervisor/Registrar";
import Reportes from "./Paginas/Login/Supervisor/Reportes";

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);
  return (
    <>
      {/* Chatbot siempre visible */}
      <Chatbot />
      <Routes>
        {/* ================= LOGIN ================= */}
        <Route
          path="/"
          element={<Login onLogin={setUsuarioLogeado} />}
        />
        {/* alias /login → / */}
        <Route path="/login" element={<Navigate to="/" />} />

        {/* ================= SUPERVISOR (SIN NavBar) ================= */}
        <Route
          path="/supervisor/*"
          element={
            <div className="flex min-h-screen bg-gray-100">
              <Sidebar />
              <div className="flex-1">
                {/* SIN NavBar aquí */}
                <main className="p-6">
                  <Routes>
                    <Route index element={<Inicio />} />
                    <Route path="perfil" element={<Perfil />} />
                    <Route path="registrar" element={<Registrar />} />
                    <Route path="reportes" element={<Reportes />} />
                    {/* fallback interno */}
                    <Route path="*" element={<Navigate to="/supervisor" />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />

        {/* ================= CRUD (CON NavBar) ================= */}
        <Route
          path="/usuarios"
          element={
            <>
              <NavBar />
              <CrudUsuarios />
            </>
          }
        />
        <Route
          path="/fichas"
          element={
            <>
              <NavBar />
              <CrudFichas />
            </>
          }
        />
        <Route
          path="/programas"
          element={
            <>
              <NavBar />
              <CrudPrograma />
            </>
          }
        />
        <Route
          path="/reservas"
          element={
            <>
              <NavBar />
              <CrudReservas />
            </>
          }
        />

        {/* fallback general */}
        <Route path="*" element={<Navigate to="/" />} />
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