import { useState } from "react";
import Login from "./Paginas/Login/Login.jsx";
import CrudUsuarios from "./Usuarios/CrudUsuarios.jsx";

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);

  // SI NO ESTÁ LOGEADO → login
  if (!usuarioLogeado) {
    return <Login onLogin={setUsuarioLogeado} />;
  }

  // SI EL USUARIO ES ADMINISTRADOR
  if (usuarioLogeado?.Tip_Usuario === "Administrador") {
    return <CrudUsuarios />;
  }

  // PARA OTROS TIPOS DE USUARIO
  return (
    <h2 style={{ textAlign: "center", marginTop: "50px" }}>
      Bienvenido {usuarioLogeado?.Nom_Usuario}
    </h2>
  );
}

export default App;
