import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Paginas/Login/Login.jsx";
import Chatbot from "./components/Chatbot.jsx";
import CrudUsuarios from "./Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Fichas/CrudFichas.jsx";
import CrudPrograma from "./Programas/CrudPrograma.jsx";
import CrudReservas from "./Reservas/CrudReservas.jsx";
import NavBar from "./navBar.jsx";
import Perfil from "./Components/AprendizExterno/Perfil.jsx";
import ReservasAprendiz from "./Components/AprendizExterno/ReservasAprendiz.jsx";

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);

  return (
    <>
      {/* CHATBOT SIEMPRE VISIBLE */}
      <Chatbot />

      {/* NAVBAR CON USUARIO */}
      <NavBar usuarioLogeado={usuarioLogeado} />

      <Routes>
        {/* RUTA LOGIN */}
        <Route path="/" element={<Login onLogin={setUsuarioLogeado} />} />
        <Route path="/login" element={<Login />} />

        <Route path="/usuarios" element={<CrudUsuarios />} />
        <Route path="/fichas" element={<CrudFichas />} />
        <Route path="/programas" element={<CrudPrograma />} />
        <Route path="/reservas" element={<CrudReservas />} />
        <Route path="/Reservas" element={<ReservasAprendiz />} />
        <Route path="/perfilexterno" element={<Perfil />} />
      </Routes>
    </>
  );
}

export default App;
