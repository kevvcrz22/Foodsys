import React, { useState, useEffect, useRef } from 'react';
import Presentacion from './Img/Casino.jpg';

const LoginFoodsys = ({ onLogin }) => {
  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    tipoDocumento: '',
    documento: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    tipoDocumento: '',
    documento: '',
    password: '',
  });
  const [touched, setTouched] = useState({
    tipoDocumento: false,
    documento: false,
    password: false,
  });

  // Referencia para el formulario
  const loginFormRef = useRef(null);

  // Validación de campos
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'tipoDocumento':
        if (!value) error = 'Debe seleccionar un tipo de documento';
        break;
      case 'documento':
        if (!value) {
          error = 'El documento es requerido';
        } else if (!/^\d+$/.test(value)) {
          error = 'El documento debe contener solo números';
        }
        break;
      case 'password':
        if (!value) {
          error = 'La contraseña es requerida';
        } else if (value.length < 6) {
          error = 'La contraseña debe tener al menos 6 caracteres';
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // Manejar blur (perder foco) de campos
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Alternar visibilidad de contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validar todo el formulario
  const validateForm = () => {
    const errors = {
      tipoDocumento: validateField('tipoDocumento', formData.tipoDocumento),
      documento: validateField('documento', formData.documento),
      password: validateField('password', formData.password),
    };
    
    setFormErrors(errors);
    setTouched({
      tipoDocumento: true,
      documento: true,
      password: true,
    });
    
    return !errors.tipoDocumento && !errors.documento && !errors.password;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      if (loginFormRef.current) {
        loginFormRef.current.classList.add('animate-shake');
        setTimeout(() => {
          if (loginFormRef.current) {
            loginFormRef.current.classList.remove('animate-shake');
          }
        }, 600);
      }
      return;
    }
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        Nom_Usuario: "Admin",
        Tip_Usuario: "Administrador"
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7fb] font-['Poppins',Arial,sans-serif] text-[#222222]">
      {/* Header */}
      <header className="sticky top-0 z-[1000] bg-[#1861c1] text-white px-[22px] py-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1150px] mx-auto flex items-center gap-5">
          <a href="#" className="flex items-center gap-3 no-underline text-white group">
            <img 
              src="/api/placeholder/56/56" 
              alt="Logo Foodsys" 
              className="w-14 h-14 transition-all duration-[350ms] ease-in-out group-hover:rotate-[5deg] group-hover:scale-105"
            />
            <span className="font-bold text-[26px] uppercase tracking-[0.5px]">
              Foodsys
            </span>
          </a>
          
          <nav className="ml-auto hidden md:flex gap-[10px]">
            <a href="#" className="relative text-white no-underline font-semibold px-[14px] py-[10px] rounded-lg transition-all duration-[350ms] ease-in-out hover:bg-white/15 hover:-translate-y-[2px] bg-white/20 after:content-[''] after:absolute after:bottom-0 after:left-[10%] after:w-[80%] after:h-[2px] after:bg-[#42b72a]">
              Inicio
            </a>
            <a href="#" className="text-white no-underline font-semibold px-[14px] py-[10px] rounded-lg transition-all duration-[350ms] ease-in-out hover:bg-white/15 hover:-translate-y-[2px]">
              Contacto
            </a>
            <a href="#" className="text-white no-underline font-semibold px-[14px] py-[10px] rounded-lg transition-all duration-[350ms] ease-in-out hover:bg-white/15 hover:-translate-y-[2px]">
              ¿Qué es foodsys?
            </a>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 py-5" role="main">
        <div className="max-w-[1150px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-[30px] items-start">
          {/* Sección Hero */}
          <section 
            className="relative overflow-hidden bg-gradient-to-br from-[#eef1f4] to-[#dce2e7] rounded-2xl p-[30px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] animate-[fadeIn_0.6s_ease] h-fit before:content-[''] before:absolute before:top-0 before:right-0 before:w-[100px] before:h-[100px] before:bg-[#1861c1] before:opacity-5 before:rounded-full before:translate-x-[30px] before:-translate-y-[30px] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-[150px] after:h-[150px] after:bg-[#42b72a] after:opacity-5 after:rounded-full after:-translate-x-[50px] after:translate-y-[50px]"
            aria-labelledby="bienvenido"
          >
            <h1 id="bienvenido" className="relative z-[1] text-[#1861c1] text-[32px] md:text-[28px] mb-3 font-bold">
              Sistema de Gestión Alimentaria
            </h1>
            <p className="relative z-[1] text-[#334] text-[15px] mb-[10px]">
              Foodsys es el sistema oficial del Centro Agropecuario La Granja (SENA Regional Tolima) para gestionar la alimentación de los aprendices.
            </p>
            <p className="relative z-[1] text-[#334] text-[15px] mb-[10px]">
              Permite reservar desayuno, almuerzo o cena con un día de anticipación, ayudando a planificar las raciones y reduciendo el desperdicio de comida.
            </p>
            
            <p className="relative z-[1] my-[15px] font-semibold text-[#1861c1] text-base">
              Optimizamos el control de alimentación y reducimos el desperdicio de comida.
            </p>

            <div className="relative z-[1] grid grid-cols-1 md:grid-cols-2 gap-3 my-5">
              <div className="flex items-center gap-2 bg-white/70 px-3 py-[10px] rounded-lg text-sm shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <i className="fas fa-check-circle text-[#42b72a] text-base"></i>
                <span>Reserva anticipada de alimentos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 px-3 py-[10px] rounded-lg text-sm shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <i className="fas fa-check-circle text-[#42b72a] text-base"></i>
                <span>Control de asistencia al comedor</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 px-3 py-[10px] rounded-lg text-sm shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <i className="fas fa-check-circle text-[#42b72a] text-base"></i>
                <span>Gestión eficiente de raciones</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 px-3 py-[10px] rounded-lg text-sm shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <i className="fas fa-check-circle text-[#42b72a] text-base"></i>
                <span>Reducción de desperdicios</span>
              </div>
            </div>

            <div className="relative z-[1] mt-5 flex justify-center">
              <img 
                id="destacada" 
                src={Presentacion}
                alt="Sistema de alimentación Foodsys" 
                className="w-full max-w-[350px] md:max-w-[280px] h-auto rounded-[14px] shadow-[0_5px_18px_rgba(0,0,0,0.15)] transition-all duration-[350ms] ease-in-out hover:scale-105 hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)]"
              />
            </div>
          </section>

          {/* Formulario de Login */}
          <aside 
            className="bg-white rounded-2xl p-7 border-t-[6px] border-t-[#42b72a] shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] animate-[slideUp_0.6s_ease] h-fit"
            aria-labelledby="login"
          >
            <h2 id="login" className="text-center text-[#42b72a] text-[26px] mb-[6px]">
              Iniciar sesión
            </h2>
            <p className="text-center mb-5 text-[#666] text-sm">
              Acceso exclusivo para el SENA
            </p>

            <form 
              id="loginForm" 
              ref={loginFormRef}
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="mb-4 relative">
                <label htmlFor="tipo" className="block text-sm mb-[6px] font-semibold">
                  Tipo de documento
                </label>
                <select 
                  id="tipo"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] transition-all duration-[350ms] ease-in-out focus:border-[#1861c1] focus:shadow-[0_4px_16px_rgba(24,97,193,0.08)] focus:bg-white focus:outline-none ${
                    touched.tipoDocumento && formErrors.tipoDocumento 
                      ? 'border-[#e74c3c]' 
                      : touched.tipoDocumento 
                      ? 'border-[#42b72a]' 
                      : 'border-black/10'
                  }`}
                  required
                >
                  <option value="">Seleccione su documento</option>
                  <option value="cc">Cédula de ciudadanía</option>
                  <option value="ti">Tarjeta identidad</option>
                  <option value="ce">Cédula de extranjería</option>
                  <option value="passport">Pasaporte</option>
                </select>
                {touched.tipoDocumento && formErrors.tipoDocumento && (
                  <div className="text-[#e74c3c] text-xs mt-[5px]">
                    {formErrors.tipoDocumento}
                  </div>
                )}
              </div>

              <div className="mb-4 relative">
                <label htmlFor="documento" className="block text-sm mb-[6px] font-semibold">
                  Número de documento
                </label>
                <input 
                  id="documento"
                  name="documento"
                  type="text" 
                  placeholder="Ej: 123456789" 
                  value={formData.documento}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] transition-all duration-[350ms] ease-in-out focus:border-[#1861c1] focus:shadow-[0_4px_16px_rgba(24,97,193,0.08)] focus:bg-white focus:outline-none ${
                    touched.documento && formErrors.documento 
                      ? 'border-[#e74c3c]' 
                      : touched.documento && !formErrors.documento 
                      ? 'border-[#42b72a]' 
                      : 'border-black/10'
                  }`}
                  required 
                  inputMode="numeric"
                />
                {touched.documento && formErrors.documento && (
                  <div className="text-[#e74c3c] text-xs mt-[5px]">
                    {formErrors.documento}
                  </div>
                )}
              </div>

              <div className="mb-4 relative">
                <label htmlFor="pass" className="block text-sm mb-[6px] font-semibold">
                  Contraseña
                </label>
                <div className="relative">
                  <input 
                    id="pass"
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Tu contraseña" 
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] transition-all duration-[350ms] ease-in-out focus:border-[#1861c1] focus:shadow-[0_4px_16px_rgba(24,97,193,0.08)] focus:bg-white focus:outline-none ${
                      touched.password && formErrors.password 
                        ? 'border-[#e74c3c]' 
                        : touched.password && !formErrors.password 
                        ? 'border-[#42b72a]' 
                        : 'border-black/10'
                    }`}
                    required 
                    minLength="6"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#1861c1] font-semibold transition-all duration-[350ms] ease-in-out hover:text-[#42b72a]"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
                {touched.password && formErrors.password && (
                  <div className="text-[#e74c3c] text-xs mt-[5px]">
                    {formErrors.password}
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-[10px] mt-[10px]">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 px-[18px] py-3 rounded-[10px] cursor-pointer border-none font-bold text-[15px] bg-[#42b72a] text-white transition-all duration-[350ms] ease-in-out hover:brightness-110 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                  type="submit"
                  disabled={isLoading}
                >
                  <span>
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </span>
                  {isLoading && (
                    <div className="inline-block w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                </button>
                <button 
                  type="button" 
                  className="flex items-center justify-center gap-2 px-[18px] py-3 rounded-[10px] cursor-pointer border-none font-bold text-[15px] bg-[#1861c1] text-white transition-all duration-[350ms] ease-in-out hover:brightness-110 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                >
                  <i className="fas fa-question-circle"></i> Ayuda
                </button>
              </div>

              <div className="mt-4 flex justify-center text-sm">
                <a 
                  href="#" 
                  className="text-[#1861c1] no-underline transition-all duration-[350ms] ease-in-out hover:underline hover:text-[#42b72a]"
                >
                  <i className="fas fa-key"></i> Olvidé mi contraseña
                </a>
              </div>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default LoginFoodsys;