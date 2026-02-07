import { useState, useEffect, useMemo } from "react";
import apiAxios from "../api/axiosConfig.js";
import { QRCodeCanvas } from "qrcode.react"; 

const ReservasForm = ({ hideModal, reserva, reload, Edit }) => {

    const [Id_Reserva, setId_Reserva] = useState("");
    const [Fec_Reserva, setFec_Reserva] = useState(() => {
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        return mañana.toISOString().split('T')[0];
    });
    const [Vencimiento, setVencimiento] = useState("");
    const [Est_Reserva, setEst_Reserva] = useState("Generada");
    const [Id_Usuario, setId_Usuario] = useState("");
    const [Usuarios, setUsuarios] = useState([]);
    const [Tipo, setTipo] = useState("");
    const [Tex_Qr, setTex_Qr] = useState("");

    const [textFormButton, setTextFormButton] = useState("Enviar");

    //Cargar todos los usuarios
    const getUsuarios = async () => {
        try {
            const response = await apiAxios.get("/api/Usuarios");
            setUsuarios(response.data);
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        }
    };

    useEffect(() => {
        getUsuarios();
    }, []);

    //Configurar formulario según modo (Nuevo o Editar)
    useEffect(() => {
        if (Edit && reserva) {
            setId_Reserva(reserva.Id_Reserva);
            setFec_Reserva(reserva.Fec_Reserva);
            setVencimiento(reserva.Vencimiento);
            setEst_Reserva(reserva.Est_Reserva);
            setId_Usuario(reserva.Id_Usuario);
            setTipo(reserva.Tipo);
            setTex_Qr(reserva.Tex_Qr || "");
            setTextFormButton("Actualizar");
        } else {
            setId_Reserva("");
            setVencimiento("");
            setEst_Reserva("Generada");
            setId_Usuario("");
            setTipo("");
            setTex_Qr("");
            setTextFormButton("Enviar");
        }
    }, [reserva, Edit]);


    
    const qrData = useMemo(() => {
        
        return `RESERVA
Fecha: ${Fec_Reserva || "-"}
Vencimiento: ${Vencimiento || "-"}
Estado: ${Est_Reserva || "-"}
Tipo: ${Tipo || "-"}
Usuario: ${Id_Usuario || "-"}`;
    }, [Fec_Reserva, Vencimiento, Est_Reserva, Tipo, Id_Usuario]);

    // 🔹 Mantener Tex_Qr sincronizado con lo que va dentro del QR (opcional)
    useEffect(() => {
        setTex_Qr(qrData);
    }, [qrData]);

    // Obtener un usuario por Id
    const getUsuarioById = async (id) => {
        const response = await apiAxios.get(`/api/Usuarios/${id}`);
        return response.data;
    };


    useEffect(() => {
        if (Usuarios.length > 0 && !Edit) {
            const usuarioKevin = Usuarios.find(
                (u) => u.Nom_Usuario.toLowerCase() === "kevin"
            );

            if (usuarioKevin) {
                setId_Usuario(usuarioKevin.Id_Usuario);
            }
        }
    }, [Usuarios, Edit]);



    // Establecer Vencimiento automático según Tipo de comida
    useEffect(() => {
        if (Tipo && Fec_Reserva) {
            const fecha = new Date(Fec_Reserva + 'T00:00:00'); // Crear fecha base

            fecha.setDate(fecha.getDate());

            // Establecer hora según tipo de comida
            switch (Tipo) {
                case "Desayuno":
                    fecha.setHours(7, 0, 0); // 7:00 AM del día siguiente
                    break;
                case "Almuerzo":
                    fecha.setHours(14, 0, 0); // 2:00 PM del día siguiente
                    break;
                case "Cena":
                    fecha.setHours(19, 0, 0); // 7:00 PM del día siguiente
                    break;
                default:
                    return;
            }


            const pad = (n) => n.toString().padStart(2, '0');

            const vencimiento =
                fecha.getFullYear() + '-' +
                pad(fecha.getMonth() + 1) + '-' +
                pad(fecha.getDate()) + 'T' +
                pad(fecha.getHours()) + ':' +
                pad(fecha.getMinutes());

            setVencimiento(vencimiento);

        }
    }, [Tipo, Fec_Reserva]);


    //Generar QR automáticamente
    useEffect(() => {
        const generarQR = async () => {
            if (Id_Usuario && Vencimiento) {
                const usuario = await getUsuarioById(Id_Usuario);
                setTex_Qr(`${usuario.NumDoc_Usuario}_${Vencimiento}`);
            }
        };
        generarQR();
    }, [Id_Usuario, Vencimiento]);

    //Enviar formulario
    const gestionarForm = async (e) => {
        e.preventDefault();

        if (textFormButton === "Enviar") {
            try {
                await apiAxios.post("/api/Reservas/", {
                    Fec_Reserva,
                    Vencimiento,
                    Est_Reserva,
                    Tipo,
                    Tex_Qr: qrData, 
                    Id_Usuario
                });

                alert("Reserva creada correctamente");
                reload();
                hideModal();

            } catch (error) {
                console.error("Error creando reserva", error);
                alert(error?.response?.data?.message || "Error creando reserva");
            }

        } else if (textFormButton === "Actualizar") {
            try {
                await apiAxios.put(`/api/Reservas/${Id_Reserva}`, {
                    Fec_Reserva,
                    Vencimiento,
                    Est_Reserva,
                    Tipo,
                    Tex_Qr: qrData,
                    Id_Usuario
                });

                alert("Reserva actualizada correctamente");
                reload();
                hideModal();

            } catch (error) {
                console.error(error);
                alert("Error actualizando reserva");
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
                        readOnly
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


                <div className="mb-3">
                    <label className="form-label">Vencimiento</label>
                    <input
                        type="datetime-local"
                        className="form-control"
                        value={Vencimiento}
                        onChange={(e) => setVencimiento(e.target.value)}
                        readOnly
                    />
                </div>

                {/* 🔹 SELECT DE USUARIOS CORRECTO */}
                <div className="mb-3">
                    <label htmlFor="Id_Usuario" className="form-label">Usuario</label>
                    <select
                        id="Id_Usuario"
                        className="form-control"
                        value={Id_Usuario}
                        onChange={(e) => setId_Usuario(e.target.value)}
                        disabled
                    >

                    
                        <option value="">Seleccione un usuario</option>
                        {Usuarios.map((u) => (
                            <option key={u.Id_Usuario} value={u.Id_Usuario}>
                                {u.Nom_Usuario}
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

                {/* 🔥 Vista previa del QR en vivo */}
                {Fec_Reserva && Id_Usuario && (
                    <div className="mt-3 text-center">
                        <QRCodeCanvas value={qrData} size={200} />
                    </div>
                )}

                <button type="submit" className="btn btn-primary mt-3">
                    {textFormButton}
                </button>

            </form>
        </>
    );
};

export default ReservasForm;
