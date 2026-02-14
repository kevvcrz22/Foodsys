import { useState, useEffect, useMemo } from "react";
import apiAxios from "../../api/axiosConfig.js";
import { QRCodeCanvas } from "qrcode.react";

const ReservasForm = ({ hideModal, reserva, reload, Edit, mostrarQR = () => {} }) => {

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
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrGenerado, setQrGenerado] = useState("");

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
        return {
            'fecha': Fec_Reserva || '-',
            'vencimiento': Vencimiento || '-',
            'estado': Est_Reserva || '-',
            'tipo': Tipo || '-',
            'usuario': Id_Usuario || '-'
        }
    }, [Fec_Reserva, Vencimiento, Est_Reserva, Tipo, Id_Usuario]);

    // 🔹 Mantener Tex_Qr sincronizado con lo que va dentro del QR (opcional)
    useEffect(() => {
        setTex_Qr(JSON.stringify(qrData));
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
            const fecha = new Date(Fec_Reserva + 'T00:00:00');

            switch (Tipo) {
                case "Desayuno":
                    fecha.setHours(7, 0, 0);
                    break;
                case "Almuerzo":
                    fecha.setHours(14, 0, 0);
                    break;
                case "Cena":
                    fecha.setHours(19, 0, 0);
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

    const generarQRFinal = async () => {
        if (!Id_Usuario || !Vencimiento) return null;

        const usuario = await getUsuarioById(Id_Usuario);
        return `${Id_Reserva} // ${usuario.Nom_Usuario} //  ${Tipo}`;
    };

    //Enviar formulario
    const gestionarForm = async (e) => {
        e.preventDefault();

        if (textFormButton === "Enviar") {
            try {

                const QRFinal = await generarQRFinal();

                await apiAxios.post("/api/Reservas/", {
                    Fec_Reserva,
                    Vencimiento,
                    Est_Reserva,
                    Tipo,
                    Tex_Qr: JSON.stringify(qrData),
                    Id_Usuario
                });

                alert("Reserva creada correctamente");
                reload();

                // 🔥 Mostrar QR en modal padre
                mostrarQR(QRFinal);

                hideModal();

                // 🔥 Limpiar formulario
                setId_Reserva("");
                setVencimiento("");
                setEst_Reserva("Generada");
                setTipo("");
                setTex_Qr("");

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
                    Tex_Qr: JSON.stringify(qrData),
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
            <form onSubmit={gestionarForm} className="space-y-4">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Reserva
                    </label>
                    <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        value={Fec_Reserva}
                        onChange={(e) => setFec_Reserva(e.target.value)}
                        readOnly
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Comida
                    </label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={Tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <option value="">Selecciona uno...</option>
                        <option value="Desayuno">Desayuno</option>
                        <option value="Almuerzo">Almuerzo</option>
                        <option value="Cena">Cena</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vencimiento
                    </label>
                    <input
                        type="datetime-local"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        value={Vencimiento}
                        readOnly
                    />
                </div>

                <div>
                    <label htmlFor="Id_Usuario" className="block text-sm font-medium text-gray-700 mb-2">
                        Usuario
                    </label>
                    <select
                        id="Id_Usuario"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        value={Id_Usuario}
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código QR
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        value={Tex_Qr}
                        readOnly
                    />
                </div>

                {/* 🔥 Vista previa del QR en vivo */}
                {Fec_Reserva && Id_Usuario && (
                    <div className="flex justify-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                        <QRCodeCanvas value={JSON.stringify(qrData)} size={200} />
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={hideModal}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                    >
                        {textFormButton}
                    </button>
                </div>

            </form>
        </>
    );
};

export default ReservasForm;