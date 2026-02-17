import React, { useState, useEffect, useRef } from 'react';

import Presentacion from '../../Components/Img/Casino.jpg';

const LoginFoodsys = ({ onLogin }) => {
  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    TipDoc_Usuario: '',
    NumDoc_Usuario: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    TipDoc_Usuario: '',
    NumDoc_Usuario: '',
    password: '',
  });
  const [touched, setTouched] = useState({
    TipDoc_Usuario: false,
    NumDoc_Usuario: false,
    password: false,
  });

  // Referencia para el formulario
  const loginFormRef = useRef(null);

  // Efecto para agregar efecto hover a las tarjetas
  useEffect(() => {
    const cards = document.querySelectorAll('.card');
    
    const handleMouseEnter = function() {
      this.style.transform = 'translateY(-5px)';
    };
    
    const handleMouseLeave = function() {
      this.style.transform = 'translateY(0)';
    };
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
    });
    
    return () => {
      cards.forEach(card => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  // Validación de campos
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'TipDoc_Usuario':
        if (!value) error = 'Debe seleccionar un tipo de documento';
        break;
      case 'NumDoc_Usuario':
        if (!value) {
          error = 'El documento es requerido';
        } else if (!/^\d+$/.test(value)) {
          error = 'El documento debe contener solo números';
        }
        break;
      case 'password':
        if (!value) {
          error = 'La contraseña es requerida';
        } else if (value.length < 8) {
          error = 'La contraseña debe tener al menos 8 caracteres';
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
    
    // Si el campo ha sido tocado, validarlo inmediatamente
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
      TipDoc_Usuario: validateField('TipDoc_Usuario', formData.TipDoc_Usuario),
      NumDoc_Usuario: validateField('NumDoc_Usuario', formData.NumDoc_Usuario),
      password: validateField('password', formData.password),
    };
    
    setFormErrors(errors);
    setTouched({
      TipDoc_Usuario: true,
      NumDoc_Usuario: true,
      password: true,
    });
    
    // Retorna true si no hay errores
    return !errors.TipDoc_Usuario && !errors.NumDoc_Usuario && !errors.password;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    if (loginFormRef.current) {
      loginFormRef.current.classList.add('invalid');
      setTimeout(() => {
        if (loginFormRef.current) {
          loginFormRef.current.classList.remove('invalid');
        }
      }, 600);
    }
    return;
  }

  try {
    setIsLoading(true);

    const response = await fetch("http://localhost:8000/api/Usuarios/login", {

      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }

    // Guardar token en localStorage
    localStorage.setItem("token", data.usuarios.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuarios));

    // Enviar datos al componente padre
    onLogin(data.usuarios);

  } catch (error) {
    alert(error.message);
  } finally {
    setIsLoading(false);
  }
};


  return (
  <div className="min-h-screen flex flex-col bg-[#f6f7fb] font-['Poppins',Arial,sans-serif] text-[#222222]">

    <main className="flex-1 py-5" role="main">
      <div className="max-w-[1150px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-[30px] items-start">

        {/* HERO */}
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
              "Reducción de desperdicios"
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

        {/* LOGIN */}
        <aside 
          className="bg-white rounded-2xl p-7 border-t-[6px] border-t-[#42b72a] shadow-[0_8px_30px_rgba(0,0,0,0.08)] h-fit"
        >
          <h2 className="text-center text-[#42b72a] text-[26px] mb-[6px]">
            Iniciar sesión
          </h2>

          <p className="text-center mb-5 text-[#666] text-sm">
            Acceso exclusivo para el SENA
          </p>

          <form
            ref={loginFormRef}
            onSubmit={handleSubmit}
            noValidate
          >

            {/* TIPO DOCUMENTO */}
            <div className="mb-4">
              <label className="block text-sm mb-[6px] font-semibold">
                Tipo de documento
              </label>

              <select
                name="TipDoc_Usuario"
                value={formData.TipDoc_Usuario}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] focus:outline-none focus:border-[#1861c1]
                ${
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
                <div className="text-[#e74c3c] text-xs mt-1">
                  {formErrors.TipDoc_Usuario}
                </div>
              )}
            </div>

            {/* DOCUMENTO */}
            <div className="mb-4">
              <label className="block text-sm mb-[6px] font-semibold">
                Número de documento
              </label>

              <input
                name="NumDoc_Usuario"
                type="text"
                value={formData.NumDoc_Usuario}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] focus:outline-none focus:border-[#1861c1]
                ${
                  touched.NumDoc_Usuario && formErrors.NumDoc_Usuario
                    ? "border-[#e74c3c]"
                    : touched.NumDoc_Usuario
                    ? "border-[#42b72a]"
                    : "border-black/10"
                }`}
              />

              {touched.NumDoc_Usuario && formErrors.NumDoc_Usuario && (
                <div className="text-[#e74c3c] text-xs mt-1">
                  {formErrors.NumDoc_Usuario}
                </div>
              )}
            </div>

            {/* PASSWORD */}
            <div className="mb-4">
              <label className="block text-sm mb-[6px] font-semibold">
                Contraseña
              </label>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-[14px] py-3 rounded-lg border text-[15px] bg-[#fbfbfb] focus:outline-none focus:border-[#1861c1]
                  ${
                    touched.password && formErrors.password
                      ? "border-[#e74c3c]"
                      : touched.password
                      ? "border-[#42b72a]"
                      : "border-black/10"
                  }`}
                />

                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1861c1] hover:text-[#42b72a]"
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>

              {touched.password && formErrors.password && (
                <div className="text-[#e74c3c] text-xs mt-1">
                  {formErrors.password}
                </div>
              )}
            </div>

            {/* BOTONES */}
            <div className="flex gap-3 mt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-[18px] py-3 rounded-[10px] font-bold bg-[#42b72a] text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                {isLoading && (
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
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