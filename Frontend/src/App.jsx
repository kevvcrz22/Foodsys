import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Paginas/Login/Login.jsx";

import Chatbot from "./Components/Chatbot.jsx";
import CrudUsuarios from "./Tablas/Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Tablas/Fichas/CrudFichas.jsx";
import CrudPrograma from "./Tablas/Programas/CrudPrograma.jsx";
import CrudReservas from "./Tablas/Reservas/CrudReservas.jsx";
import NavBar from "./Paginas/navBar.jsx";
import Footer from "./Paginas/Footer.jsx";
import Perfil from "./Components/AprendizExterno/Perfil.jsx";
import ReservasAprendiz from "./Components/AprendizExterno/ReservasAprendiz.jsx";


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
      <Chatbot />

      {/* NAVBAR CON USUARIO */}
      <NavBar usuarioLogeado={usuarioLogeado} />

      <Routes>
        {/* RUTA LOGIN */}
        <Route path="/" element={<Login onLogin={setUsuarioLogeado} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Login" element={<Login/>} />
        <Route path="/usuarios" element={<CrudUsuarios />} />
        <Route path="/fichas" element={<CrudFichas />} />
        <Route path="/programas" element={<CrudPrograma />} />
        <Route path="/reservas" element={<CrudReservas />} />
        <Route path="/Reservas" element={<ReservasAprendiz />} />
        <Route path="/perfilexterno" element={<Perfil />} />
      </Routes>

      <Footer />

      {usuarioLogeado && (
        <h2 style={{ textAlign: "center", marginTop: "50px" }}>
          Bienvenido {usuarioLogeado.Nom_Usuario}
        </h2>
      )}
    </>
  );
}

export default App;