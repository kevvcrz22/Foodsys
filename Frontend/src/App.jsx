import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import CrudUsuarios from "./Usuarios/CrudUsuarios.jsx";
import CrudFichas from "./Fichas/CrudFichas.jsx";
import CrudPrograma from "./Programas/CrudPrograma.jsx";
import CrudReservas from "./Reservas/CrudReservas.jsx";

import MiPerfil from "./Aprendiz/MiPerfil.jsx";
import ConfirmarBoleta from "./Aprendiz/ConfirmarBoleta.jsx";
import Historial from "./Aprendiz/Historial.jsx";
import MisReservas from "./Aprendiz/MisReservas.jsx";
import CambiarPassword from "./Aprendiz/CambiarPassword.jsx";
import MostrarQR from "./Aprendiz/MostrarQR.jsx";
import Navbar from "./Aprendiz/Navbar.jsx";

function AppContent() {
  const location = useLocation();

  
  const hideNavbar = location.pathname === "/aprendiz";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<h2>Bienvenido a Foodsys</h2>} />

        <Route path="/reservas" element={<CrudReservas />} />
        <Route path="/usuarios" element={<CrudUsuarios />} />
        <Route path="/fichas" element={<CrudFichas />} />
        <Route path="/programa" element={<CrudPrograma />} />

        
        <Route path="/aprendiz" element={<MiPerfil />} />
        <Route path="/aprendiz/confirmar-boleta" element={<ConfirmarBoleta />} />
        <Route path="/aprendiz/historial" element={<Historial />} />
        <Route path="/aprendiz/reservas" element={<MisReservas />} />
        <Route path="/aprendiz/password" element={<CambiarPassword />} />
        <Route path="/aprendiz/qr" element={<MostrarQR />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
