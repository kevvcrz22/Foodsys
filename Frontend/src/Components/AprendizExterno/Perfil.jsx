import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiAxios from "../../api/axiosConfig";
import "./Perfil.css";
import ReservasAprendiz from "./ReservasAprendiz";

const Perfil = () => {

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [menuAbierto, setMenuAbierto] = useState(true);
  const [actividadAbierta, setActividadAbierta] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState("informacion");


  const [telefono, setTelefono] = useState(usuario?.Tel_Usuario || "");
  const [correo, setCorreo] = useState(usuario?.Cor_Usuario || "");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const guardarDatos = async () => {
    if (!usuario?.Id_Usuario) {
      alert("Usuario no disponible");
      return;
    }

    try {
      await apiAxios.put(`/api/Usuarios/${usuario.Id_Usuario}`, {
        Tel_Usuario: telefono,
        Cor_Usuario: correo,
      });
      alert("Datos actualizados correctamente");
    } catch (error) {
      alert("Error al actualizar la información");
    }
  };

  const cambiarPassword = () => {
    if (!password) return alert("Ingrese una contraseña");
    alert("Contraseña actualizada");
    setPassword("");
  };

  const salir = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="perfil-layout">

      <aside className={`sidebar-aprendiz ${!menuAbierto ? "cerrado" : ""}`}>
        <button
          className="toggle-menu"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? "<" : ">"}
        </button>

        {menuAbierto && (
          <>
            <div className="sidebar-header">
              <h3>Aprendiz Externo</h3>
            </div>

            <nav className="sidebar-menu">
              <button
                className="menu-item desplegable"
                onClick={() => setPerfilAbierto(!perfilAbierto)}
              >
                Mi Perfil ▾
              </button>

              {perfilAbierto && (
                <div className="submenu">
                  <button
                    className="submenu-item"
                    onClick={() => setSeccionActiva("informacion")}
                  >
                    Información personal
                  </button>
                </div>
              )}

              <button
                className="menu-item desplegable"
                onClick={() => setActividadAbierta(!actividadAbierta)}
              >
                Actividad ▾
              </button>

              {actividadAbierta && (
                <div className="submenu">
                  <button
                    className="submenu-item"
                    onClick={() => setSeccionActiva("reservas")}
                  >
                    Gestionar Reservas
                  </button>
                </div>
              )}

              <button className="menu-item salir" onClick={salir}>
                Cerrar sesión
              </button>
            </nav>
          </>
        )}
      </aside>

      <main className="perfil-contenido">
        {seccionActiva === "informacion" && (
          <>
            <h1>Mi Perfil</h1>
            <p className="subtitulo">
              Gestiona tu información personal y seguridad
            </p>

            <section className="card card-principal">
              <h2>Información personal</h2>

              <div className="bloque">
                <h3>Datos del aprendiz</h3>
                <div className="info-grid">
                  <div>
                    <label>Programa de formación</label>
                    <input
                      value={usuario?.Programa || "No asignado"}
                      readOnly
                    />
                  </div>
                  <div>
                    <label>Ficha</label>
                    <input
                      value={usuario?.ficha?.Num_Ficha || "Sin ficha"}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="bloque">
                <h3>Datos de contacto</h3>
                <div className="form-grid">
                  <div>
                    <label>Correo</label>
                    <input
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Teléfono</label>
                    <input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                </div>

                <button className="btn-primary" onClick={guardarDatos}>
                  Guardar cambios
                </button>
              </div>
            </section>

            <section className="card card-seguridad">
              <h2>Seguridad</h2>
              <div className="form-grid">
                <div>
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn-secondary" onClick={cambiarPassword}>
                Cambiar contraseña
              </button>
            </section>
          </>
        )}

        {seccionActiva === "reservas" && (
          <>
            <h1>Mis Reservas</h1>
            <ReservasAprendiz localMode={true} />
          </>
        )}
      </main>
    </div>
  );
};

export default Perfil;
