import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";
import "./Reservas.css";
import ReservasForm from "../../Tablas/Reservas/ReservaForm";

const Reservas = ({ localMode = true }) => {
  const [reservas, setReservas] = useState([]);
  const [fechaReserva, setFechaReserva] = useState([]);

  const [reservasDB, setReservasDB] = useState([]);

  const ahora = new Date();

  const [reloadList, setReloadList] = useState(false);

  const recargarReservas = () => {
  setReloadList(!reloadList);
};

  const puedeReservar = (fecha) => {
    const fechaSeleccionada = new Date(fecha);
    const limite = new Date(fechaSeleccionada);
    limite.setDate(limite.getDate() - 1);
    limite.setHours(18, 30, 0, 0);

    return ahora <= limite;
  };

  const generarReserva = () => {
    if (!fechaReserva) return alert("Seleccione una fecha");

    if (!puedeReservar(fechaReserva)) {
      return alert(
        "Solo puedes reservar hasta el día anterior a las 6:30 p.m."
      );
    }

    const nuevaReserva = {
      id: Date.now(),
      fecha: fechaReserva,
      comida: "Almuerzo",
      estado: "Pendiente",
      creada: new Date().toLocaleString(),
    };

    setReservas([nuevaReserva, ...reservas]);
    setFechaReserva("");
  };

  useEffect(() => {
    if (!localMode) {
      const fetchReservas = async () => {
        try {
          const { data } = await apiAxios.get("/api/Reservas");
          setReservasDB(data);
        } catch (error) {
          console.error("Error al cargar reservas desde backend", error);
        }
      };
      fetchReservas();
    }
  }, [localMode]);

  const listaMostrar = localMode ? reservas : reservasDB;

  return (
    <div className="reservas-layout">
      {localMode && (
      <section className="card-reserva formulario">
        <h2>Reservar almuerzo</h2>
        <ReservasForm
          hideModal={() => {}}
            reload={recargarReservas}
              Edit={false}
        />
      </section>

      )}

      <section className="card-reserva listado">
        <h2>Mis reservas</h2>

        {listaMostrar.length === 0 ? (
          <p className="sin-reservas">No tienes reservas registradas.</p>
        ) : (
          <ul className="lista-reservas">
            {listaMostrar.map((reserva) => (
              <li key={reserva.id} className="item-reserva">
                <div>
                  <strong> {reserva.fecha}</strong>
                  <p>{reserva.comida}</p>
                </div>

                <div className={`estado ${reserva.estado?.toLowerCase()}`}>
                  {reserva.estado}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Reservas;
