import { useState, useEffect } from "react";
import apiAxios from "../api/axiosConfig.js";

const ReservasForm = ({ hideModal, reserva, reload, Edit }) => {

    const [Id_Reserva, setId_Reserva] = useState("");
    const [Fec_Reserva, setFec_Reserva] = useState("");
    const [Vencimiento, setVencimiento] = useState("");
    const [Est_Reserva, setEst_Reserva] = useState("Generada");
    const [Id_Usuario, setId_Usuario] = useState("");
    const [Usuarios, setUsuarios] = useState([]);
    const [Tipo, setTipo] = useState("");
    const [Tex_Qr, setTex_Qr] = useState("");

    const [textFormButton, setTextFormButton] = useState("Enviar");

    // 🔹 Cargar todos los usuarios
    const getUsuarios = async () => {
        try {
            const response = await apiAxios.get("/api/Usuarios");
            setUsuarios(response.data);  // <-- debe ser array
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        }
    };

    useEffect(() => {
        getUsuarios();
    }, []);

    // 🔹 Configurar formulario según modo (Nuevo o Editar)
    useEffect(() => {
        if (Edit && reserva) {
            setId_Reserva(reserva.Id_Reserva);
            setFec_Reserva(reserva.Fec_Reserva);
            setVencimiento(reserva.Vencimiento);
            setEst_Reserva(reserva.Est_Reserva);
            setId_Usuario(reserva.Id_Usuario);
            setTipo(reserva.Tipo);
            setTex_Qr(reserva.Tex_Qr);
            setTextFormButton("Actualizar");

        } else {
            setId_Reserva("");
            setFec_Reserva("");
            setVencimiento("");
            setEst_Reserva("Generada");
            setId_Usuario("");
            setTipo("");
            setTex_Qr("");
            setTextFormButton("Enviar");
        }
    }, [reserva, Edit]);

    // 🔹 Obtener un usuario por Id
    const getUsuarioById = async (id) => {
        const response = await apiAxios.get(`/api/Usuarios/${id}`);
        return response.data;
    };

    // 🔹 Generar QR automáticamente
    useEffect(() => {
        const generarQR = async () => {
            if (Id_Usuario && Fec_Reserva) {
                const usuario = await getUsuarioById(Id_Usuario);
                setTex_Qr(`${usuario.NumDoc_Usuario}_${Fec_Reserva}`);
            }
        };
        generarQR();
    }, [Id_Usuario, Fec_Reserva]);

    // 🔹 Enviar formulario
    const gestionarForm = async (e) => {
        e.preventDefault();

        if (textFormButton === "Enviar") {
            try {
                await apiAxios.post("/api/Reservas/", {
                    Fec_Reserva,
                    Vencimiento,
                    Est_Reserva,
                    Tipo,
                    Tex_Qr,
                    Id_Usuario
                });

                alert("Reserva Creada Correctamente");
                hideModal();
                reload();

            } catch (error) {
                console.error("Error Creando Reserva", error);
                alert(error.message);
            }

        } else if (textFormButton === "Actualizar") {
            try {
                await apiAxios.put(`/api/Reservas/${Id_Reserva}`, {
                    Fec_Reserva,
                    Vencimiento,
                    Est_Reserva,
                    Tipo,
                    Tex_Qr,
                    Id_Usuario
                });

                alert("Reserva Actualizada Correctamente");
                reload();
                hideModal();

            } catch (error) {
                console.error(error);
                alert("Error Actualizando Reserva");
            }
        }
    };

    return (
        <>
            <form onSubmit={gestionarForm} className="col-12 col-md-6">

                <div className="mb-3">
                    <label className="form-label">Fec_Reserva</label>
                    <input
                        type="date"
                        className="form-control"
                        value={Fec_Reserva}
                        onChange={(e) => setFec_Reserva(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Vencimiento</label>
                    <input
                        type="datetime-local"
                        className="form-control"
                        value={Vencimiento}
                        onChange={(e) => setVencimiento(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Tipo</label>
                    <select
                        className="form-control"
                        value={Tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <option value="">Selecciona uno...</option>
                        <option value="Desayuno">Desayuno</option>
                        <option value="Almuerzo">Almuerzo</option>
                        <option value="Cena">Cena</option>
                    </select>
                </div>

                {/* 🔹 SELECT DE USUARIOS CORRECTO */}
                <div className="mb-3">
                    <label htmlFor="Id_Usuario" className="form-label">Usuario</label>

                    <select
                        id="Id_Usuario"
                        className="form-control"
                        value={Id_Usuario}
                        onChange={(e) => setId_Usuario(e.target.value)}
                    >
                        <option value="">Seleccione un usuario</option>

                        {Usuarios.map((u) => (
                            <option key={u.Id_Usuario} value={u.Id_Usuario}>
                                {u.Nom_Usuario} {/* Nombre visible */}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Tex_Qr</label>
                    <input
                        type="text"
                        className="form-control"
                        value={Tex_Qr}
                        readOnly
                    />
                </div>

                <button type="submit" className="btn btn-primary">
                    {textFormButton}
                </button>

            </form>
        </>
    );
};

export default ReservasForm