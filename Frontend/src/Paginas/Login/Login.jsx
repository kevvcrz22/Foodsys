// Frontend/src/Paginas/Login/Login.jsx
import React, { useState, useEffect, useRef, useContext} from 'react';
import Presentacion from '../../Components/Img/Casino.jpg';
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/authContext';


const LoginFoodsys = ({ onLogin }) => {

  const { setUser } = useContext(AuthContext);//Esatdo context global
  const navigate = useNavigate();

  /* ── Formulario ── */
  const [formData, setFormData] = useState({
    TipDoc_Usuario: '',
    NumDoc_Usuario: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [formErrors,   setFormErrors]   = useState({ TipDoc_Usuario: '', NumDoc_Usuario: '', password: '' });
  const [touched,      setTouched]      = useState({ TipDoc_Usuario: false, NumDoc_Usuario: false, password: false });

  /* ✅ Del segundo: error visual en lugar de alert() */
  const [errorGeneral, setErrorGeneral] = useState("");

  /* ✅ Del primero: modal de política */
  const [showPolitica,  setShowPolitica]  = useState(false);
  const [pendingLogin,  setPendingLogin]  = useState(null);

  const loginFormRef = useRef(null);

  /* ── Hover en cards ── */
  useEffect(() => {
    const cards = document.querySelectorAll('.card');
    const onEnter = function () { this.style.transform = 'translateY(-5px)'; };
    const onLeave = function () { this.style.transform = 'translateY(0)'; };
    cards.forEach((c) => { c.addEventListener('mouseenter', onEnter); c.addEventListener('mouseleave', onLeave); });
    return () => cards.forEach((c) => { c.removeEventListener('mouseenter', onEnter); c.removeEventListener('mouseleave', onLeave); });
  }, []);

  /* ── Validación ── */
  const validateField = (name, value) => {
    switch (name) {
      case 'TipDoc_Usuario': return !value ? 'Debe seleccionar un tipo de documento' : '';
      case 'NumDoc_Usuario':
        if (!value)               return 'El documento es requerido';
        if (!/^\d+$/.test(value)) return 'El documento debe contener solo números';
        return '';
      case 'password':
        if (!value)           return 'La contraseña es requerida';
        if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
        return '';
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (touched[name]) setFormErrors((p) => ({ ...p, [name]: validateField(name, value) }));
    if (errorGeneral)  setErrorGeneral("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((p)    => ({ ...p, [name]: true }));
    setFormErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const errors = {
      TipDoc_Usuario: validateField('TipDoc_Usuario', formData.TipDoc_Usuario),
      NumDoc_Usuario: validateField('NumDoc_Usuario', formData.NumDoc_Usuario),
      password:       validateField('password',       formData.password),
    };
    setFormErrors(errors);
    setTouched({ TipDoc_Usuario: true, NumDoc_Usuario: true, password: true });
    return !errors.TipDoc_Usuario && !errors.NumDoc_Usuario && !errors.password;
  };

  /* ✅ Del segundo: pasa token JWT real como 4.º argumento a onLogin */
  const finalizarLogin = (data, roles, rolActivo) => {
    if (onLogin) onLogin(data.usuario, roles, rolActivo, data.token);
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrorGeneral("");

      const response = await fetch("http://localhost:8000/api/Usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();


      if (!response.ok) throw new Error(data.message || "Error al iniciar sesión");

      /* ✅ Del segundo: validar que el token sea JWT real (3 partes) */
      if (!data.token || data.token.split(".").length !== 3) {
        throw new Error("El servidor no devolvió un token válido");
      }

      setUser(data.usuario) //Estado context global despues de iniciar sesion

      const roles     = data.roles;
      const rolActivo = roles.includes("Administrador") ? "Administrador" : roles[0];

      /* ✅ Del primero: verificar si ya aceptó la política antes de entrar */
      if (data.usuario.Pol_Usuario !== 'Si') {
        setPendingLogin({ data, roles, rolActivo });
        setShowPolitica(true);
        return;
      }

      finalizarLogin(data, roles, rolActivo);

    } catch (error) {
      /* ✅ Del segundo: error visual, no alert() */
      setErrorGeneral(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ✅ Del primero: aceptar política → PATCH al backend → entrar */
  const handleAceptarPolitica = async () => {
    try {
      const { data, roles, rolActivo } = pendingLogin;
      await fetch(`http://localhost:8000/api/Usuarios/${data.usuario.Id_Usuario}/politica`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      setShowPolitica(false);
      setPendingLogin(null);
      finalizarLogin(data, roles, rolActivo);
    } catch {
      setErrorGeneral("Error al registrar la aceptación de política. Intenta de nuevo.");
      setShowPolitica(false);
    }
  };

  /* ✅ Del primero: rechazar política → mostrar error, no alert() */
  const handleRechazarPolitica = () => {
    setShowPolitica(false);
    setPendingLogin(null);
    setErrorGeneral("Debes aceptar la política de tratamiento de datos para acceder al sistema.");
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7fb] font-['Poppins',Arial,sans-serif] text-[#222222]">

      {/* ══════════════════════════════════════════
          ✅ MODAL POLÍTICA (del primero)
      ══════════════════════════════════════════ */}
      {showPolitica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#1861c1] to-[#1a4f9e] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    Política de Protección de Datos
                  </h3>
                  <p className="text-blue-200 text-xs">SENA — GC-F-005 V.01</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pt-4 pb-2">
              <p className="text-[#555] text-sm mb-3">
                Antes de continuar, lee y acepta nuestra política de tratamiento de datos personales.
              </p>

              <div className="h-52 overflow-y-auto rounded-2xl bg-[#f6f8fc] border border-[#e2e8f0] p-4 text-sm text-[#444] leading-relaxed space-y-3">
                {[
                  {
                    titulo: "1. Política de tratamiento",
                    texto: "El SENA se compromete a garantizar la protección de los derechos fundamentales referidos al buen nombre y al derecho de información, en el tratamiento de los datos personales capturados a través de los sistemas digitales ubicados en las sedes del SENA, únicamente para los fines autorizados y conforme a la normatividad vigente.",
                  },
                  {
                    titulo: "2. Marco Legal",
                    texto: "Constitución Política Art. 15 · Ley 1581 de 2012 · Ley 1712 de 2014 · Decreto 1377 de 2013.",
                  },
                  {
                    titulo: "3. Responsable",
                    texto: "Servicio Nacional de Aprendizaje – SENA. Dirección: Calle 57 No. 8-69, Bogotá D.C. PBX: (57+1) 5461500. Línea gratuita: 018000 910270. Web: www.sena.edu.co",
                  },
                  {
                    titulo: "4. Finalidad",
                    texto: "Los datos serán usados para fines administrativos propios de la entidad, caracterización de usuarios, gestión de servicios de bienestar y alimentación, encuestas de satisfacción, y conformación de la base de datos del SENA. Todos los datos están almacenados en servidores del SENA en Colombia con mecanismos avanzados de seguridad informática.",
                  },
                  {
                    titulo: "5. Tus derechos",
                    texto: "Usted tiene derecho a: conocer, actualizar y rectificar sus datos personales; solicitar prueba de la autorización otorgada; ser informado sobre el uso dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y solicitar supresión de datos; acceder gratuitamente a sus datos.",
                  },
                  {
                    titulo: "6. Reclamaciones",
                    texto: "Para ejercer sus derechos puede escribir a: http://sciudadanos.sena.edu.co/SolicitudIndex.aspx o dirigirse a la Coordinación Nacional de Servicio al Cliente del SENA.",
                  },
                ].map(({ titulo, texto }) => (
                  <div key={titulo}>
                    <p className="font-semibold text-[#1861c1] mb-1">{titulo}</p>
                    <p>{texto}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex flex-col gap-2">
              <button
                onClick={handleAceptarPolitica}
                className="w-full py-3 rounded-2xl font-semibold text-sm bg-[#42b72a] text-white hover:bg-[#38a024] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
              >
                <i className="fas fa-check-circle"></i>
                Acepto la política de tratamiento de datos
              </button>
              <button
                onClick={handleRechazarPolitica}
                className="w-full py-2 rounded-2xl font-medium text-sm text-[#999] hover:text-[#e74c3c] hover:bg-red-50 active:scale-95 transition-all duration-150"
              >
                No Acepto
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PÁGINA PRINCIPAL
      ══════════════════════════════════════════ */}
      <main className="flex-1 py-5" role="main">
        <div className="max-w-[1150px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-[30px] items-start">

          {/* ── HERO ── */}
          <section
            className="relative overflow-hidden bg-gradient-to-br from-[#eef1f4] to-[#dce2e7] rounded-2xl p-[30px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] h-fit"
            aria-labelledby="bienvenido"
          >
            <h1 className="text-[#1861c1] text-[32px] mb-3 font-bold">
              Sistema de Gestión Alimentaria
            </h1>
            <p className="text-[#334] text-[15px] mb-[10px]">
              Foodsys es el sistema oficial del Centro Agropecuario La Granja (SENA Regional Tolima) para gestionar la alimentación de los aprendices.
            </p>
            <p className="text-[#334] text-[15px] mb-[10px]">
              Permite reservar desayuno, almuerzo o cena con un día de anticipación.
            </p>
            <p className="my-[15px] font-semibold text-[#1861c1]">
              Optimizamos el control de alimentación y reducimos el desperdicio de comida.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-5">
              {[
                "Reserva anticipada de alimentos",
                "Control de asistencia al comedor",
                "Gestión eficiente de raciones",
                "Reducción de desperdicios",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/70 px-3 py-[10px] rounded-lg text-sm shadow">
                  <i className="fas fa-check-circle text-[#42b72a]"></i>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-center">
              <img
                src={Presentacion}
                alt="Sistema Foodsys"
                className="w-full max-w-[350px] rounded-[14px] shadow-[0_5px_18px_rgba(0,0,0,0.15)] transition hover:scale-105"
              />
            </div>
          </section>

          {/* ── FORMULARIO DE LOGIN ── */}
          <aside className="bg-white rounded-2xl p-7 border-t-[6px] border-t-[#42b72a] shadow-[0_8px_30px_rgba(0,0,0,0.08)] h-fit">
            <h2 className="text-center text-[#42b72a] text-[26px] mb-[6px]">Iniciar sesión</h2>
            <p className="text-center mb-5 text-[#666] text-sm">Acceso exclusivo para el SENA</p>

            {/* ✅ Error general visible — sin alert() */}
            {errorGeneral && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <span>✕</span>
                <span>{errorGeneral}</span>
              </div>
            )}

            <form ref={loginFormRef} onSubmit={handleSubmit} noValidate>

              {/* Tipo documento */}
              <div className="mb-4">
                <label className="block text-sm mb-[6px] font-semibold">Tipo de documento</label>
                <select
                  name="TipDoc_Usuario"
                  value={formData.TipDoc_Usuario}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] focus:outline-none focus:border-[#1861c1] ${
                    touched.TipDoc_Usuario && formErrors.TipDoc_Usuario
                      ? "border-[#e74c3c]"
                      : touched.TipDoc_Usuario
                      ? "border-[#42b72a]"
                      : "border-black/10"
                  }`}
                >
                  <option value="">Seleccione su documento</option>
                  <option value="CC">Cedula de Ciudadania</option>
                  <option value="CE">Cedula de Extranjeria</option>
                  <option value="PEP">Permiso Especial de Permanencia</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="PPT">Permiso por Proteccion Temporal</option>
                </select>
                {touched.TipDoc_Usuario && formErrors.TipDoc_Usuario && (
                  <div className="text-[#e74c3c] text-xs mt-1">{formErrors.TipDoc_Usuario}</div>
                )}
              </div>

              {/* Número documento */}
              <div className="mb-4">
                <label className="block text-sm mb-[6px] font-semibold">Número de documento</label>
                <input
                  name="NumDoc_Usuario"
                  type="text"
                  value={formData.NumDoc_Usuario}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] focus:outline-none focus:border-[#1861c1] ${
                    touched.NumDoc_Usuario && formErrors.NumDoc_Usuario
                      ? "border-[#e74c3c]"
                      : touched.NumDoc_Usuario
                      ? "border-[#42b72a]"
                      : "border-black/10"
                  }`}
                />
                {touched.NumDoc_Usuario && formErrors.NumDoc_Usuario && (
                  <div className="text-[#e74c3c] text-xs mt-1">{formErrors.NumDoc_Usuario}</div>
                )}
              </div>

              {/* Contraseña */}
              <div className="mb-4">
                <label className="block text-sm mb-[6px] font-semibold">Contraseña</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] focus:outline-none focus:border-[#1861c1] ${
                      touched.password && formErrors.password
                        ? "border-[#e74c3c]"
                        : touched.password
                        ? "border-[#42b72a]"
                        : "border-black/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1861c1] hover:text-[#42b72a]"
                  >
                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
                {touched.password && formErrors.password && (
                  <div className="text-[#e74c3c] text-xs mt-1">{formErrors.password}</div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-[18px] py-3 rounded-[10px] font-bold bg-[#42b72a] text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                  {isLoading && (
                    <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                </button>
                <button
                  type="button"
                  className="px-[18px] py-3 rounded-[10px] font-bold bg-[#1861c1] text-white hover:brightness-110"
                >
                  Ayuda
                </button>
              </div>

            </form>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default LoginFoodsys;
