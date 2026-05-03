import { useState, useEffect, useRef } from "react";
import apiAxios from "../../api/axiosConfig.js";

const UsuariosRolForm = ({ hideModal, data, Edit, reload }) => {

    const [Id_UsuarioRol, setId_UsuarioRol]   = useState("");
    const [Id_Usuario, setId_Usuario]         = useState("");
    const [Id_Rol, setId_Rol]                 = useState("");

    const [usuarios, setUsuarios]             = useState([]);
    const [roles, setRoles]                   = useState([]);

    // ── Autocomplete ──
    const [busqueda, setBusqueda]             = useState("");
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
    const [mostrarDropdown, setMostrarDropdown]     = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    const [textFormButton, setTextFormButton] = useState("Guardar");

    // Cargar datos
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resUsuarios, resRoles] = await Promise.all([
                    apiAxios.get("/api/Usuarios"),
                    apiAxios.get("/api/Roles")
                ]);
                setUsuarios(resUsuarios.data);
                setRoles(resRoles.data);
            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        };
        cargarDatos();
    }, []);

    // Si viene data para editar, precargar
    useEffect(() => {
        if (data) {
            setId_UsuarioRol(data.Id_UsuariosRol);
            setId_Usuario(data.Id_Usuario);
            setId_Rol(data.Id_Rol);
            // Mostrar nombre en el input de búsqueda
            if (data.usuario) {
                setBusqueda(`${data.usuario.Nom_Usuario} ${data.usuario.Ape_Usuario}`);
                setUsuarioSeleccionado(data.usuario);
            }
            setTextFormButton("Actualizar");
        } else {
            setId_UsuarioRol("");
            setId_Usuario("");
            setId_Rol("");
            setBusqueda("");
            setUsuarioSeleccionado(null);
            setTextFormButton("Guardar");
        }
    }, [data]);

    // Filtrar usuarios mientras escribe
    const handleBusqueda = (e) => {
        const texto = e.target.value;
        setBusqueda(texto);
        setUsuarioSeleccionado(null);
        setId_Usuario("");

        if (texto.length < 1) {
            setUsuariosFiltrados([]);
            setMostrarDropdown(false);
            return;
        }

        const filtrados = usuarios.filter((u) => {
            const textoLower = texto.toLowerCase();
            return (
                (u.NumDoc_Usuario || "").toString().includes(texto) ||
                (u.Nom_Usuario || "").toLowerCase().includes(textoLower) ||
                (u.Ape_Usuario  || "").toLowerCase().includes(textoLower) ||
                (`${u.Nom_Usuario} ${u.Ape_Usuario}`).toLowerCase().includes(textoLower)
            );
        }).slice(0, 8); // máximo 8 resultados

        setUsuariosFiltrados(filtrados);
        setMostrarDropdown(true);
    };

    const seleccionarUsuario = (u) => {
        setUsuarioSeleccionado(u);
        setId_Usuario(u.Id_Usuario);
        setBusqueda(`${u.Nom_Usuario} ${u.Ape_Usuario} — ${u.NumDoc_Usuario}`);
        setMostrarDropdown(false);
    };

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickFuera = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current   && !inputRef.current.contains(e.target)
            ) {
                setMostrarDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const gestionarForm = async (e) => {
        e.preventDefault();

        if (!Id_Usuario || !Id_Rol) {
            alert("Por favor selecciona usuario y rol");
            return;
        }

        const payload = {
            Id_Usuario: Number(Id_Usuario),
            Id_Rol:     Number(Id_Rol),
        };

        try {
            if (!Edit) {
                await apiAxios.post("/api/UsuariosRoles", payload);
                alert("Registro creado correctamente");
            } else {
                await apiAxios.put(`/api/UsuariosRoles/${Id_UsuarioRol}`, payload);
                alert("Registro actualizado correctamente");
            }
            reload();
            hideModal();
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            alert(`Error: ${msg}`);
        }
    };

    return (
        <form onSubmit={gestionarForm} className="space-y-4">

            <h2 className="text-lg font-bold text-gray-700">
                {Edit ? "Editar Usuario - Rol" : "Nuevo Usuario - Rol"}
            </h2>

            {/* ── AUTOCOMPLETE USUARIO ── */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Buscar Usuario (nombre o número de documento)
                </label>

                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ej: Kevin Cruz o 1234567890"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400
                            ${usuarioSeleccionado ? "border-green-500 bg-green-50" : "border-gray-300"}`}
                        value={busqueda}
                        onChange={handleBusqueda}
                        onFocus={() => usuariosFiltrados.length > 0 && setMostrarDropdown(true)}
                        autoComplete="off"
                        required
                    />

                    {/* ✅ Icono verde si ya está seleccionado */}
                    {usuarioSeleccionado && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                    )}

                    {/* ✅ Dropdown de resultados */}
                    {mostrarDropdown && usuariosFiltrados.length > 0 && (
                        <ul
                            ref={dropdownRef}
                            className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto"
                        >
                            {usuariosFiltrados.map((u) => (
                                <li
                                    key={u.Id_Usuario}
                                    onClick={() => seleccionarUsuario(u)}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between items-center"
                                >
                                    <span className="font-medium text-gray-800">
                                        {u.Nom_Usuario} {u.Ape_Usuario}
                                    </span>
                                    <span className="text-gray-400 text-xs">{u.NumDoc_Usuario}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Sin resultados */}
                    {mostrarDropdown && usuariosFiltrados.length === 0 && busqueda.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow mt-1 px-4 py-3 text-sm text-gray-400">
                            No se encontraron usuarios
                        </div>
                    )}
                </div>
            </div>

            {/* ── DROPDOWN ROL ── */}
            <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <select
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                    value={Id_Rol}
                    onChange={(e) => setId_Rol(e.target.value)}
                    required
                >
                    <option value="">-- Selecciona un rol --</option>
                    {roles.map((r) => (
                        <option key={r.Id_Rol} value={r.Id_Rol}>
                            {r.Nom_Rol}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={hideModal}
                    className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                    {textFormButton}
                </button>
            </div>

        </form>
    );
};

export default UsuariosRolForm;