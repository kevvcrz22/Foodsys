// Perfil.jsx
// Modulo de perfil de usuario del sistema FoodSys
// Permite al usuario ver sus datos, editar contacto y cambiar contrasena con flujo seguro

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

// Componente reutilizable: campo de contrasena con icono de ojo para alternar visibilidad
const CampoContrasena = ({
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
        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-150"
      />
      {/* Boton para mostrar u ocultar el texto de la contrasena */}
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

  // Estado del flujo de cambio de contrasena
  // Paso 1 = ingresar contrasena actual | Paso 2 = nueva contrasena | Paso 3 = exito
  const [Paso, setPaso] = useState(1);
  const [ContrasenaActual, setContrasenaActual] = useState("");
  const [ContrasenaNueva, setContrasenaNueva] = useState("");
  const [ContrasenaConfirmar, setContrasenaConfirmar] = useState("");
  const [VisActual, setVisActual] = useState(false);
  const [VisNueva, setVisNueva] = useState(false);
  const [VisConfirmar, setVisConfirmar] = useState(false);
  const [GuardandoContrasena, setGuardandoContrasena] = useState(false);
  const [MensajeContrasena, setMensajeContrasena] = useState({ Texto: "", Tipo: "" });

  // Al montar el componente: lee el ID del localStorage y carga datos frescos de la API
  useEffect(() => {
    const UsuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");

    // Los roles pueden estar guardados en clave "roles" o dentro del objeto usuario
    const RolesGuardados = JSON.parse(localStorage.getItem("roles") || "[]");
    const RolesFinales =
      RolesGuardados.length > 0
        ? RolesGuardados
        : UsuarioLocal?.roles || [];

    setRoles(RolesFinales);

    if (UsuarioLocal?.Id_Usuario) {
      CargarUsuario(UsuarioLocal.Id_Usuario);
    }
  }, []);

  // Sincroniza los campos del formulario de contacto cuando el usuario se actualiza
  useEffect(() => {
    if (Usuario) {
      setCorreo(Usuario.Cor_Usuario || "");
      setTelefono(Usuario.Tel_Usuario || "");
    }
  }, [Usuario]);

  // Obtiene datos actualizados del usuario desde la base de datos y guarda en localStorage
  const CargarUsuario = async (Id) => {
    try {
      const Res = await apiAxios.get(`/api/Usuarios/${Id}`);
      setUsuario(Res.data);
      localStorage.setItem("usuario", JSON.stringify(Res.data));
    } catch (Err) {
      console.error("Error al cargar el perfil del usuario:", Err);
    }
  };

  // El usuario es aprendiz o pasante si alguno de sus roles aparece en la lista ROLES_APRENDIZ
  const EsAprendiz = Roles.some((Rol) => ROLES_APRENDIZ.includes(Rol));

  // La cuenta se considera activa cuando San_Usuario es distinto de "Si"
  const CuentaActiva = Usuario?.San_Usuario !== "Si";

  // Envia los cambios de correo y telefono al backend con validacion previa
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
      await apiAxios.put(`/api/Usuarios/${Usuario.Id_Usuario}`, {
        Cor_Usuario: Correo,
        Tel_Usuario: Telefono,
      });
      // Recarga los datos desde la API para reflejar el cambio en tiempo real
      await CargarUsuario(Usuario.Id_Usuario);
      setMensajeContacto({
        Texto: "Informacion de contacto actualizada correctamente",
        Tipo: "exito",
      });
      // El mensaje desaparece automaticamente despues de 4 segundos
      setTimeout(() => setMensajeContacto({ Texto: "", Tipo: "" }), 4000);
    } catch {
      setMensajeContacto({
        Texto: "Error al guardar los cambios. Intente nuevamente",
        Tipo: "error",
      });
    } finally {
      setGuardandoContacto(false);
    }
  };

  // Paso 1 del flujo: valida la contrasena actual contra la base de datos
  // Solo si es correcta se avanza al paso 2
  const ValidarContrasenaActual = async () => {
    if (!ContrasenaActual.trim()) {
      setMensajeContrasena({
        Texto: "Ingrese su contrasena actual para continuar",
        Tipo: "error",
      });
      return;
    }
    setGuardandoContrasena(true);
    try {
      await apiAxios.post(
        `/api/Usuarios/${Usuario.Id_Usuario}/validar-password`,
        { currentPassword: ContrasenaActual }
      );
      setPaso(2);
      setMensajeContrasena({ Texto: "", Tipo: "" });
    } catch {
      setMensajeContrasena({
        Texto: "La contrasena actual es incorrecta",
        Tipo: "error",
      });
    } finally {
      setGuardandoContrasena(false);
    }
  };

  // Paso 2 del flujo: envia la nueva contrasena al backend donde se encripta con bcrypt
  const GuardarContrasena = async () => {
    if (!ContrasenaNueva.trim()) {
      setMensajeContrasena({ Texto: "Ingrese la nueva contrasena", Tipo: "error" });
      return;
    }
    if (ContrasenaNueva.length < 8) {
      setMensajeContrasena({
        Texto: "La contrasena debe tener minimo 8 caracteres",
        Tipo: "error",
      });
      return;
    }
    if (ContrasenaNueva !== ContrasenaConfirmar) {
      setMensajeContrasena({
        Texto: "Las contrasenias no coinciden",
        Tipo: "error",
      });
      return;
    }
    setGuardandoContrasena(true);
    try {
      // El backend recibe ambas contrasenias: la actual para verificar y la nueva para guardar
      await apiAxios.put(`/api/Usuarios/${Usuario.Id_Usuario}/password`, {
        currentPassword: ContrasenaActual,
        newPassword: ContrasenaNueva,
      });
      setPaso(3);
      setMensajeContrasena({
        Texto: "Contrasena actualizada correctamente",
        Tipo: "exito",
      });
    } catch {
      setMensajeContrasena({
        Texto: "Error al actualizar la contrasena",
        Tipo: "error",
      });
    } finally {
      setGuardandoContrasena(false);
    }
  };

  // Reinicia el formulario de contrasena a su estado inicial (paso 1)
  const ReiniciarContrasena = () => {
    setPaso(1);
    setContrasenaActual("");
    setContrasenaNueva("");
    setContrasenaConfirmar("");
    setVisActual(false);
    setVisNueva(false);
    setVisConfirmar(false);
    setMensajeContrasena({ Texto: "", Tipo: "" });
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

  // Configuracion de los pasos del indicador de progreso de cambio de contrasena
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

            {/* Bloque central: nombre, roles y badges de estado */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-800">
                {Usuario.Nom_Usuario} {Usuario.Ape_Usuario}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {Roles.length > 0 ? Roles.join(" - ") : "Sin rol asignado"}
              </p>
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

            {/* Documento: visible solo en pantallas medianas o mayores */}
            <div className="text-right hidden sm:block shrink-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {Usuario.TipDoc_Usuario}
              </p>
              <p className="text-base font-bold text-slate-700 font-mono">
                {Usuario.NumDoc_Usuario}
              </p>
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

          {/* Tarjeta 3: datos de vinculacion — visible exclusivamente para aprendices y pasantes */}
          {EsAprendiz && (
            <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
              <CabeceraTarjeta
                Color="bg-violet-600"
                Icono={BookOpen}
                Titulo="Datos de Vinculacion"
              />
              <div className="space-y-3">
                <CampoEntrada
                  Icono={Building2}
                  Etiqueta="Ficha"
                  Valor={Usuario.ficha?.Num_Ficha || "No asignada"}
                  Deshabilitado
                />
                <CampoEntrada
                  Icono={BookOpen}
                  Etiqueta="Programa"
                  Valor={Usuario.ficha?.programas?.Nom_Programa || "No asignado"}
                  Deshabilitado
                />
                <CampoEntrada
                  Icono={Shield}
                  Etiqueta="Estado del Usuario"
                  Valor={Usuario.Est_Usuario || "Sin estado registrado"}
                  Deshabilitado
                />
              </div>
            </div>
          )}

          {/* Tarjeta 4: seguridad — flujo de 3 pasos para cambio seguro de contrasena */}
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

              {/* Paso 1: el usuario escribe su contrasena actual para ser validada en el backend */}
              {Paso === 1 && (
                <>
                  <CampoContrasena
                    Etiqueta="Contrasena Actual"
                    Valor={ContrasenaActual}
                    onChange={(E) => setContrasenaActual(E.target.value)}
                    Visible={VisActual}
                    OnToggle={() => setVisActual(!VisActual)}
                    Placeholder="Ingrese su contrasena actual"
                  />
                  <AlertaMensaje
                    Mensaje={MensajeContrasena.Texto}
                    Tipo={MensajeContrasena.Tipo}
                  />
                  <button
                    onClick={ValidarContrasenaActual}
                    disabled={GuardandoContrasena}
                    className={[
                      "w-full py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150",
                      GuardandoContrasena
                        ? "bg-slate-400 cursor-wait"
                        : "bg-slate-700 hover:bg-slate-800 cursor-pointer",
                    ].join(" ")}
                  >
                    {GuardandoContrasena ? "Verificando..." : "Verificar Contrasena"}
                  </button>
                </>
              )}

              {/* Paso 2: el usuario ingresa y confirma la nueva contrasena */}
              {Paso === 2 && (
                <>
                  <CampoContrasena
                    Etiqueta="Nueva Contrasena"
                    Valor={ContrasenaNueva}
                    onChange={(E) => setContrasenaNueva(E.target.value)}
                    Visible={VisNueva}
                    OnToggle={() => setVisNueva(!VisNueva)}
                    Placeholder="Minimo 8 caracteres"
                  />
                  <CampoContrasena
                    Etiqueta="Confirmar Contrasena"
                    Valor={ContrasenaConfirmar}
                    onChange={(E) => setContrasenaConfirmar(E.target.value)}
                    Visible={VisConfirmar}
                    OnToggle={() => setVisConfirmar(!VisConfirmar)}
                    Placeholder="Repita la nueva contrasena"
                  />
                  <AlertaMensaje
                    Mensaje={MensajeContrasena.Texto}
                    Tipo={MensajeContrasena.Tipo}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={ReiniciarContrasena}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all duration-150"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={GuardarContrasena}
                      disabled={GuardandoContrasena}
                      className={[
                        "flex-2 py-2.5 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-150",
                        GuardandoContrasena
                          ? "bg-slate-400 cursor-wait"
                          : "bg-slate-700 hover:bg-slate-800 cursor-pointer",
                      ].join(" ")}
                    >
                      {GuardandoContrasena ? "Guardando..." : "Guardar Contrasena"}
                    </button>
                  </div>
                </>
              )}

              {/* Paso 3: pantalla de confirmacion exitosa del cambio de contrasena */}
              {Paso === 3 && (
                <div className="text-center py-5">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Contrasena Actualizada
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    La contrasena fue cambiada correctamente en el sistema
                  </p>
                  <button
                    onClick={ReiniciarContrasena}
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