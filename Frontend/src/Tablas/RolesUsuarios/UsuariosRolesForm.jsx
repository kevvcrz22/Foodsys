import { useState, useEffect, useRef } from "react";
import apiAxios from "../../api/axiosConfig.js";
import toast from "react-hot-toast";

const UsuariosRolForm = ({ hideModal, data, Edit, reload }) => {

    const [Id_UsuarioRol, setId_UsuarioRol] = useState("");
    const [Id_Usuario, setId_Usuario] = useState("");
    const [Id_Rol, setId_Rol] = useState("");

    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);

    // ── Autocomplete ──
    const [busqueda, setBusqueda] = useState("");
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [enviando, setEnviando] = useState(false);

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
                setUsuarios(Array.isArray(resUsuarios.data) ? resUsuarios.data : []);
                setRoles(Array.isArray(resRoles.data) ? resRoles.data : []);
            } catch (error) {
                console.error("Error cargando datos:", error);
                toast.error("Error al cargar la lista de usuarios o roles");
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
                (u.Ape_Usuario || "").toLowerCase().includes(textoLower) ||
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
                inputRef.current && !inputRef.current.contains(e.target)
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
            toast.error("Por favor selecciona un usuario y un rol");
            return;
        }

        setEnviando(true);
        const payload = {
            Id_Usuario: Number(Id_Usuario),
            Id_Rol: Number(Id_Rol),
        };

        try {
            if (!Edit) {
                await apiAxios.post("/api/UsuariosRoles", payload);
                toast.success("Rol asignado al usuario correctamente");
            } else {
                await apiAxios.put(`/api/UsuariosRoles/${Id_UsuarioRol}`, payload);
                toast.success("Asignación de rol actualizada correctamente");
            }
            reload();
            hideModal();
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Error al procesar la solicitud";
            toast.error(msg);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={gestionarForm} className="space-y-4">

            {/* ── AUTOCOMPLETE USUARIO ── */}
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Buscar Usuario (nombre o número de documento) *
                </label>

                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ej: Kevin Cruz o 1234567890"
                        className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all duration-150
                            ${usuarioSeleccionado 
                                ? "border-emerald-500 bg-emerald-50/50 text-slate-800 ring-2 ring-emerald-500/10" 
                                : "border-slate-200 bg-white text-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"}`}
                        value={busqueda}
                        onChange={handleBusqueda}
                        onFocus={() => usuariosFiltrados.length > 0 && setMostrarDropdown(true)}
                        autoComplete="off"
                        required
                    />

                    {/* ✅ Icono verde si ya está seleccionado */}
                    {usuarioSeleccionado && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">✓</span>
                    )}

                    {/* ✅ Dropdown de resultados */}
                    {mostrarDropdown && usuariosFiltrados.length > 0 && (
                        <ul
                            ref={dropdownRef}
                            className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-52 overflow-y-auto divide-y divide-slate-100"
                        >
                            {usuariosFiltrados.map((u) => (
                                <li
                                    key={u.Id_Usuario}
                                    onClick={() => seleccionarUsuario(u)}
                                    className="px-3.5 py-2.5 hover:bg-violet-50 cursor-pointer text-sm flex justify-between items-center transition-colors"
                                >
                                    <span className="font-medium text-slate-800">
                                        {u.Nom_Usuario} {u.Ape_Usuario}
                                    </span>
                                    <span className="text-slate-400 text-xs font-mono">{u.NumDoc_Usuario}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Sin resultados */}
                    {mostrarDropdown && usuariosFiltrados.length === 0 && busqueda.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow mt-1 px-4 py-3 text-sm text-slate-400">
                            No se encontraron usuarios
                        </div>
                    )}
                </div>
            </div>

            {/* ── DROPDOWN ROL ── */}
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Rol *</label>
                <select
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    value={Id_Rol}
                    onChange={(e) => setId_Rol(e.target.value)}
                    required
                >
                    <option value="">Selecciona un rol...</option>
                    {roles.map((r) => (
                        <option key={r.Id_Rol} value={r.Id_Rol}>
                            {r.Nom_Rol}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                    type="button"
                    onClick={hideModal}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={enviando}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                >
                    {enviando ? "Guardando..." : textFormButton}
                </button>
            </div>

        </form>
    );
};

export default UsuariosRolForm;