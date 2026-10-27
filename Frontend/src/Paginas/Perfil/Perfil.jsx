// Perfil.jsx
// Modulo de perfil de usuario del sistema Foodsys
// Permite al usuario ver sus datos, editar contacto y cambiar contraseña con flujo seguro

import { useState, useEffect } from "react";
import {
  Eye, EyeOff, User, Mail, Phone, Lock,
  CreditCard, Shield, BookOpen, Building2, CheckCircle
} from "lucide-react";
import apiAxios from "../../api/axiosConfig";

// Roles del sistema que corresponden a aprendices o pasantes
const ROLES_APRENDIZ = [
  "Aprendiz Interno",
  "Aprendiz Externo",
  "Pasante Interno",
  "Pasante Externo",
];

// Componente reutilizable: campo de texto con icono a la izquierda
// Acepta modo deshabilitado para campos de solo lectura
const CampoEntrada = ({
  // eslint-disable-next-line no-unused-vars
  Icono,
  Etiqueta,
  Valor,
  onChange,
  Deshabilitado = false,
  Tipo = "text",
  Placeholder = "",
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {Etiqueta}
    </label>
    <div className="relative">
      <Icono
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type={Tipo}
        value={Valor}
        disabled={Deshabilitado}
        onChange={onChange}
        placeholder={Placeholder}
        className={[
          "w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border outline-none transition-all duration-150",
          Deshabilitado
            ? "bg-slate-100 border-transparent text-slate-500 cursor-not-allowed"
            : "bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
        ].join(" ")}
      />
    </div>
  </div>
);

// Componente reutilizable: campo de contraseña con icono de ojo para alternar visibilidad
const Campocontraseña = ({
  Etiqueta,
  Valor,
  onChange,
  Visible,
  OnToggle,
  Placeholder,
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {Etiqueta}
    </label>
    <div className="relative">
      <Lock
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type={Visible ? "text" : "password"}
        value={Valor}
        onChange={onChange}
        placeholder={Placeholder}
        autoComplete="new-password"
        name="sec_pwd_field"
        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150"
      />
      {/* Boton para mostrar u ocultar el texto de la contraseña */}
      <button
        type="button"
        onClick={OnToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent"
      >
        {Visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

// Componente reutilizable: mensaje de retroalimentacion con estilo segun el tipo
// Tipo "exito" = verde, Tipo "error" = rojo
const AlertaMensaje = ({ Mensaje, Tipo }) => {
  if (!Mensaje) return null;
  return (
    <p
      className={[
        "text-xs px-3 py-2 rounded-lg border",
        Tipo === "exito"
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-red-50 border-red-200 text-red-700",
      ].join(" ")}
    >
      {Mensaje}
    </p>
  );
};

// Componente: cabecera de tarjeta con icono de color y titulo
// eslint-disable-next-line no-unused-vars
const CabeceraTarjeta = ({ Color, Icono, Titulo }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div
      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${Color}`}
    >
      <Icono size={13} className="text-white" />
    </div>
    <h2 className="font-semibold text-slate-700 text-sm">{Titulo}</h2>
  </div>
);

const Perfil = () => {
  // Datos del usuario cargados desde la API y sincronizados con localStorage
  const [Usuario, setUsuario] = useState(null);
  const [Roles, setRoles] = useState([]);

  // Campos editables del bloque de contacto
  const [Correo, setCorreo] = useState("");
  const [Telefono, setTelefono] = useState("");
  const [GuardandoContacto, setGuardandoContacto] = useState(false);
  const [MensajeContacto, setMensajeContacto] = useState({ Texto: "", Tipo: "" });

  // Estado del flujo de cambio de contraseña
  // Paso 1 = ingresar contraseña actual | Paso 2 = nueva contraseña | Paso 3 = exito
  const [Paso, setPaso] = useState(1);
  const [contraseñaActual, setcontraseñaActual] = useState("");
  const [contraseñaNueva, setcontraseñaNueva] = useState("");
  const [contraseñaConfirmar, setcontraseñaConfirmar] = useState("");
  const [VisActual, setVisActual] = useState(false);
  const [VisNueva, setVisNueva] = useState(false);
  const [VisConfirmar, setVisConfirmar] = useState(false);
  const [Guardandocontraseña, setGuardandocontraseña] = useState(false);
  const [Mensajecontraseña, setMensajecontraseña] = useState({ Texto: "", Tipo: "" });

  // Al montar el componente: carga datos desde localStorage para respuesta instantanea y sincroniza con API
  useEffect(() => {
    const UsuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
    const RolesGuardados = JSON.parse(localStorage.getItem("roles") || "[]");
    const RolesFinales = RolesGuardados.length > 0 ? RolesGuardados : (UsuarioLocal?.roles || []);

    if (RolesFinales.length > 0) {
      setRoles(RolesFinales);
    }

    if (UsuarioLocal && (UsuarioLocal.Nom_Usuario || UsuarioLocal.nombreCompleto)) {
      setUsuario(UsuarioLocal);
      setCorreo(UsuarioLocal.Cor_Usuario || "");
      setTelefono(UsuarioLocal.Tel_Usuario || "");
    }

    CargarUsuario();
  }, []);

  // Sincroniza los campos del formulario de contacto cuando el usuario se actualiza
  useEffect(() => {
    if (Usuario) {
      setCorreo(Usuario.Cor_Usuario || "");
      setTelefono(Usuario.Tel_Usuario || "");
    }
  }, [Usuario]);

  // Obtiene datos actualizados del usuario autenticado (sirve para cualquier rol: Admin, Cocina, Aprendiz)
  const CargarUsuario = async () => {
    try {
      const Res = await apiAxios.get("/api/Usuarios/perfil/me");
      if (Res.data) {
        setUsuario(Res.data);
        if (Res.data.roles && Res.data.roles.length > 0) {
          setRoles(Res.data.roles);
        }
        setCorreo(Res.data.Cor_Usuario || "");
        setTelefono(Res.data.Tel_Usuario || "");
        localStorage.setItem("usuario", JSON.stringify(Res.data));
      }
    } catch (Err) {
      console.warn("Fallo /api/Usuarios/perfil/me, intentando endpoint por ID:", Err?.message);
      const UsuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
      const id = UsuarioLocal?.Id_Usuario || UsuarioLocal?.id;
      if (id) {
        try {
          const ResId = await apiAxios.get(`/api/Usuarios/${id}`);
          setUsuario(ResId.data);
          localStorage.setItem("usuario", JSON.stringify(ResId.data));
        } catch (e) {
          console.error("Error en fallback:", e);
        }
      }
    }
  };

  // El usuario es aprendiz o pasante si alguno de sus roles aparece en la lista ROLES_APRENDIZ
  const EsAprendiz = Roles.some((Rol) => ROLES_APRENDIZ.includes(Rol));

  // La cuenta se considera activa cuando San_Usuario es distinto de "Si"
  const CuentaActiva = Usuario?.San_Usuario !== "Si";

  // Envia los cambios de correo y telefono al endpoint dedicado /api/Usuarios/perfil/contacto
  const GuardarContacto = async () => {
    if (!Correo.trim() && !Telefono.trim()) {
      setMensajeContacto({
        Texto: "Debe ingresar al menos un campo para actualizar",
        Tipo: "error",
      });
      return;
    }
    setGuardandoContacto(true);
    try {
      await apiAxios.put("/api/Usuarios/perfil/contacto", {
        Cor_Usuario: Correo,
        Tel_Usuario: Telefono,
      });
      await CargarUsuario();
      setMensajeContacto({
        Texto: "Informacion de contacto actualizada correctamente",
        Tipo: "exito",
      });
      setTimeout(() => setMensajeContacto({ Texto: "", Tipo: "" }), 4000);
    } catch (err) {
      setMensajeContacto({
        Texto: err.response?.data?.message || "Error al guardar los cambios. Intente nuevamente",
        Tipo: "error",
      });
    } finally {
      setGuardandoContacto(false);
    }
  };

  // Paso 1 del flujo: valida la contraseña actual contra la base de datos
  const ValidarcontraseñaActual = async () => {
    if (!contraseñaActual.trim()) {
      setMensajecontraseña({
        Texto: "Ingrese su contraseña actual para continuar",
        Tipo: "error",
      });
      return;
    }
    setGuardandocontraseña(true);
    try {
      const idUser = Usuario?.Id_Usuario || Usuario?.id;
      await apiAxios.post(
        `/api/Usuarios/${idUser}/validar-password`,
        { currentPassword: contraseñaActual }
      );
      setPaso(2);
      setMensajecontraseña({ Texto: "", Tipo: "" });
    } catch {
      setMensajecontraseña({
        Texto: "La contraseña actual es incorrecta",
        Tipo: "error",
      });
    } finally {
      setGuardandocontraseña(false);
    }
  };

  // Paso 2 del flujo: envia la nueva contraseña al backend (/api/Usuarios/perfil/password)
  const Guardarcontraseña = async () => {
    if (!contraseñaNueva.trim()) {
      setMensajecontraseña({ Texto: "Ingrese la nueva contraseña", Tipo: "error" });
      return;
    }
    if (contraseñaNueva.length < 8) {
      setMensajecontraseña({
        Texto: "La contraseña debe tener minimo 8 caracteres",
        Tipo: "error",
      });
      return;
    }
    if (contraseñaNueva !== contraseñaConfirmar) {
      setMensajecontraseña({
        Texto: "Las contrasenas no coinciden",
        Tipo: "error",
      });
      return;
    }
    setGuardandocontraseña(true);
    try {
      await apiAxios.put("/api/Usuarios/perfil/password", {
        currentPassword: contraseñaActual,
        newPassword: contraseñaNueva,
        confirmPassword: contraseñaConfirmar
      });
      setPaso(3);
      setMensajecontraseña({
        Texto: "Contraseña actualizada correctamente",
        Tipo: "exito",
      });
    } catch (err) {
      setMensajecontraseña({
        Texto: err.response?.data?.message || "Error al actualizar la contraseña",
        Tipo: "error",
      });
    } finally {
      setGuardandocontraseña(false);
    }
  };

  // Reinicia el formulario de contraseña a su estado inicial (paso 1)
  const Reiniciarcontraseña = () => {
    setPaso(1);
    setcontraseñaActual("");
    setcontraseñaNueva("");
    setcontraseñaConfirmar("");
    setVisActual(false);
    setVisNueva(false);
    setVisConfirmar(false);
    setMensajecontraseña({ Texto: "", Tipo: "" });
  };

  // Pantalla de espera mientras se obtienen los datos desde la API
  if (!Usuario) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Genera las iniciales del usuario combinando la primera letra del nombre y apellido
  const Iniciales = [Usuario.Nom_Usuario?.charAt(0), Usuario.Ape_Usuario?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  // Convierte el codigo de genero almacenado en base de datos a texto legible
  const TextoGenero =
    Usuario.Gen_Usuario === "M"
      ? "Masculino"
      : Usuario.Gen_Usuario === "F"
        ? "Femenino"
        : "Prefiero no decirlo";

  // Configuracion de los pasos del indicador de progreso de cambio de contraseña
  const ConfigPasos = [
    { Numero: 1, Titulo: "Verificar" },
    { Numero: 2, Titulo: "Nueva clave" },
    { Numero: 3, Titulo: "Completado" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 xl:p-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Encabezado: avatar con iniciales, nombre completo, roles y estado de cuenta */}
        <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

            {/* Avatar generado dinamicamente con las iniciales del nombre y apellido */}
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
              {Iniciales || "U"}
            </div>

            {/* Bloque central: nombre y badges de estado */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-800">
                {Usuario.Nom_Usuario} {Usuario.Ape_Usuario}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Badge de estado activo o inactivo basado en San_Usuario */}
                <span
                  className={[
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                    CuentaActiva
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700",
                  ].join(" ")}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${CuentaActiva ? "bg-green-500" : "bg-red-500"
                      }`}
                  />
                  {CuentaActiva ? "Cuenta Activa" : "Cuenta Inactiva"}
                </span>

                {/* Badge de sancion visible cuando San_Usuario es "Si" */}
                {Usuario.San_Usuario === "Si" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-700">
                    <Shield size={10} />
                    Sancionado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid responsivo: una columna en movil, dos columnas en md en adelante */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Tarjeta 1: informacion personal — todos los campos son de solo lectura */}
          <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
            <CabeceraTarjeta
              Color="bg-blue-600"
              Icono={User}
              Titulo="Informacion Personal"
            />
            <div className="space-y-3">
              <CampoEntrada
                Icono={User}
                Etiqueta="Nombres"
                Valor={Usuario.Nom_Usuario || ""}
                Deshabilitado
              />
              <CampoEntrada
                Icono={User}
                Etiqueta="Apellidos"
                Valor={Usuario.Ape_Usuario || ""}
                Deshabilitado
              />
              <div className="grid grid-cols-2 gap-3">
                <CampoEntrada
                  Icono={CreditCard}
                  Etiqueta="Tipo Doc."
                  Valor={Usuario.TipDoc_Usuario || ""}
                  Deshabilitado
                />
                <CampoEntrada
                  Icono={CreditCard}
                  Etiqueta="Num. Doc."
                  Valor={String(Usuario.NumDoc_Usuario || "")}
                  Deshabilitado
                />
              </div>
              <CampoEntrada
                Icono={User}
                Etiqueta="Genero"
                Valor={TextoGenero}
                Deshabilitado
              />
            </div>
          </div>

          {/* Tarjeta 2: contacto — correo y telefono son editables por el propio usuario */}
          <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
            <CabeceraTarjeta
              Color="bg-indigo-600"
              Icono={Mail}
              Titulo="Informacion de Contacto"
            />
            <div className="space-y-3">
              <CampoEntrada
                Icono={Mail}
                Etiqueta="Correo Electronico"
                Valor={Correo}
                onChange={(E) => setCorreo(E.target.value)}
                Tipo="email"
                Placeholder="correo@ejemplo.com"
              />
              <CampoEntrada
                Icono={Phone}
                Etiqueta="Telefono"
                Valor={Telefono}
                onChange={(E) => setTelefono(E.target.value)}
                Placeholder="Ej. 3247433621"
              />
              <AlertaMensaje
                Mensaje={MensajeContacto.Texto}
                Tipo={MensajeContacto.Tipo}
              />
              <button
                onClick={GuardarContacto}
                disabled={GuardandoContacto}
                className={[
                  "w-full py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150",
                  GuardandoContacto
                    ? "bg-blue-400 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm",
                ].join(" ")}
              >
                {GuardandoContacto ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          {/* Tarjeta 3: Vinculacion y Roles en el Sistema (visible para todos los roles) */}
          <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
            <CabeceraTarjeta
              Color="bg-violet-600"
              Icono={BookOpen}
              Titulo="Roles y Vinculacion"
            />
            <div className="space-y-3">
              <CampoEntrada
                Icono={Shield}
                Etiqueta="Rol(es) Asignados"
                Valor={Roles.length > 0 ? Roles.join(", ") : "Sin rol asignado"}
                Deshabilitado
              />
              {EsAprendiz && (
                <>
                  <CampoEntrada
                    Icono={Building2}
                    Etiqueta="Ficha de Formacion"
                    Valor={Usuario.ficha?.Num_Ficha || Usuario.numeroFicha || "No asignada"}
                    Deshabilitado
                  />
                  <CampoEntrada
                    Icono={BookOpen}
                    Etiqueta="Programa de Formacion"
                    Valor={Usuario.ficha?.programas?.Nom_Programa || Usuario.nombrePrograma || "No asignado"}
                    Deshabilitado
                  />
                </>
              )}
              <CampoEntrada
                Icono={CheckCircle}
                Etiqueta="Estado de la Cuenta"
                Valor={Usuario.Est_Usuario || "Activo"}
                Deshabilitado
              />
            </div>
          </div>

          {/* Tarjeta 4: seguridad — flujo de 3 pasos para cambio seguro de contraseña */}
          <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
            <CabeceraTarjeta
              Color="bg-slate-700"
              Icono={Lock}
              Titulo="Seguridad"
            />

            {/* Indicador visual del paso actual: muestra progreso del flujo */}
            <div className="flex items-center gap-1.5 mb-5">
              {ConfigPasos.map(({ Numero, Titulo }, Indice) => {
                const EsActivo = Paso === Numero;
                const EsCompletado = Paso > Numero;
                return (
                  <div key={Numero} className="flex items-center gap-1.5">
                    <div
                      className={[
                        "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all duration-200",
                        EsCompletado
                          ? "bg-green-500 text-white"
                          : EsActivo
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-400",
                      ].join(" ")}
                    >
                      {EsCompletado ? (
                        <CheckCircle size={12} />
                      ) : (
                        Numero
                      )}
                    </div>
                    {/* Titulo del paso visible solo en pantallas sm en adelante */}
                    <span
                      className={[
                        "text-[11px] font-medium hidden sm:block",
                        EsActivo ? "text-blue-600" : "text-slate-400",
                      ].join(" ")}
                    >
                      {Titulo}
                    </span>
                    {Indice < 2 && (
                      <div className="w-5 h-px bg-slate-200 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">

              {/* Paso 1: el usuario escribe su contraseña actual para ser validada en el backend */}
              {Paso === 1 && (
                <>
                  <Campocontraseña
                    Etiqueta="contraseña Actual"
                    Valor={contraseñaActual}
                    onChange={(E) => setcontraseñaActual(E.target.value)}
                    Visible={VisActual}
                    OnToggle={() => setVisActual(!VisActual)}
                    Placeholder="Ingrese su contraseña actual"
                  />
                  <AlertaMensaje
                    Mensaje={Mensajecontraseña.Texto}
                    Tipo={Mensajecontraseña.Tipo}
                  />
                  <button
                    onClick={ValidarcontraseñaActual}
                    disabled={Guardandocontraseña}
                    className={[
                      "w-full py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150",
                      Guardandocontraseña
                        ? "bg-slate-400 cursor-wait"
                        : "bg-slate-700 hover:bg-slate-800 cursor-pointer",
                    ].join(" ")}
                  >
                    {Guardandocontraseña ? "Verificando..." : "Verificar contraseña"}
                  </button>
                </>
              )}

              {/* Paso 2: el usuario ingresa y confirma la nueva contraseña con indicador de fortaleza */}
              {Paso === 2 && (
                <>
                  <Campocontraseña
                    Etiqueta="Nueva contraseña"
                    Valor={contraseñaNueva}
                    onChange={(E) => setcontraseñaNueva(E.target.value)}
                    Visible={VisNueva}
                    OnToggle={() => setVisNueva(!VisNueva)}
                    Placeholder="Minimo 8 caracteres"
                  />
                  {/* Indicador de fortaleza visual de la contraseña */}
                  {contraseñaNueva.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Fortaleza:</span>
                        <span className={
                          contraseñaNueva.length < 8
                            ? "font-bold text-rose-500"
                            : (/[0-9]/.test(contraseñaNueva) && /[A-Z]/.test(contraseñaNueva) && /[^A-Za-z0-9]/.test(contraseñaNueva))
                            ? "font-bold text-emerald-600"
                            : "font-bold text-amber-500"
                        }>
                          {contraseñaNueva.length < 8
                            ? "Débil (< 8 caracteres)"
                            : (/[0-9]/.test(contraseñaNueva) && /[A-Z]/.test(contraseñaNueva) && /[^A-Za-z0-9]/.test(contraseñaNueva))
                            ? "Fuerte (Segura)"
                            : "Media"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            contraseñaNueva.length < 8
                              ? "w-1/3 bg-rose-500"
                              : (/[0-9]/.test(contraseñaNueva) && /[A-Z]/.test(contraseñaNueva) && /[^A-Za-z0-9]/.test(contraseñaNueva))
                              ? "w-full bg-emerald-500"
                              : "w-2/3 bg-amber-500"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  <Campocontraseña
                    Etiqueta="Confirmar contraseña"
                    Valor={contraseñaConfirmar}
                    onChange={(E) => setcontraseñaConfirmar(E.target.value)}
                    Visible={VisConfirmar}
                    OnToggle={() => setVisConfirmar(!VisConfirmar)}
                    Placeholder="Repita la nueva contraseña"
                  />
                  <AlertaMensaje
                    Mensaje={Mensajecontraseña.Texto}
                    Tipo={Mensajecontraseña.Tipo}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={Reiniciarcontraseña}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all duration-150"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={Guardarcontraseña}
                      disabled={Guardandocontraseña}
                      className={[
                        "flex-2 py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150",
                        Guardandocontraseña
                          ? "bg-slate-400 cursor-wait"
                          : "bg-slate-700 hover:bg-slate-800 cursor-pointer",
                      ].join(" ")}
                    >
                      {Guardandocontraseña ? "Guardando..." : "Guardar contraseña"}
                    </button>
                  </div>
                </>
              )}

              {/* Paso 3: pantalla de confirmacion exitosa del cambio de contraseña */}
              {Paso === 3 && (
                <div className="text-center py-5">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    contraseña Actualizada
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    La contraseña fue cambiada correctamente en el sistema
                  </p>
                  <button
                    onClick={Reiniciarcontraseña}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer bg-transparent border-0 underline transition-colors"
                  >
                    Cambiar nuevamente
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Perfil;