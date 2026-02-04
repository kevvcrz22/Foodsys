import { useState } from "react";
import Login from "./Paginas/Login/Login.jsx";
import CrudUsuarios from "./Usuarios/CrudUsuarios.jsx";
import Chatbot from "./components/Chatbot.jsx";

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);

  return (
    <>
      {/* CHATBOT SIEMPRE VISIBLE */}
      <Chatbot />

      {/* CONTENIDO PRINCIPAL */}
      {!usuarioLogeado && <Login onLogin={setUsuarioLogeado} />}

      {usuarioLogeado?.Tip_Usuario === "Administrador" && <CrudUsuarios />}

      {usuarioLogeado &&
        usuarioLogeado?.Tip_Usuario !== "Administrador" && (
          <h2 style={{ textAlign: "center", marginTop: "50px" }}>
            Bienvenido {usuarioLogeado.Nom_Usuario}
          </h2>
        )}
    </>
  );
}

export default App;
