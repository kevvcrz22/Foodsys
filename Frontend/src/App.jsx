import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./Paginas/Login/Login.jsx";
import Chatbot from "./components/Chatbot.jsx";

import CrudUsuarios from "./Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Fichas/CrudFichas.jsx";
import CrudPrograma from "./Programas/CrudPrograma.jsx";
import CrudReservas from "./Reservas/CrudReservas.jsx";
import NavBar from "./navBar.jsx";

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);

  return (
    <>
      {/* CHATBOT SIEMPRE VISIBLE */}
      <Chatbot />
      <NavBar />
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/" element={<Login onLogin={setUsuarioLogeado} />} />

        {/* RUTAS PÚBLICAS (SIN LOGIN) */}
        <Route path="/Login" element={<Login/>} />
        <Route path="/usuarios" element={<CrudUsuarios />} />
        <Route path="/fichas" element={<CrudFichas />} />
        <Route path="/programas" element={<CrudPrograma />} />
        <Route path="/reservas" element={<CrudReservas />} />
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
