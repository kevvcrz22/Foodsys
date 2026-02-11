import React, { useState, useEffect, useRef } from 'react';

import Presentacion from './Img/Casino.jpg';
import './Login.css'; // Asegúrate de que esta ruta sea correcta

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
    
    // Retorna true si no hay errores
    return !errors.tipoDocumento && !errors.documento && !errors.password;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Efecto de shake en el formulario
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
    // Simular envío de formulario
    setIsLoading(true);
    
    // Simulación de petición asíncrona
setTimeout(() => {
  setIsLoading(false);
  onLogin({
    Nom_Usuario: "Admin",
    Tip_Usuario: "Administrador"
  });
}, 1000);
  };

  return (
    <div className="foodsys-app">
      {/* Header */}
      

      {/* Contenido principal */}
      <main role="main">
        <div className="wrap">
          {/* Sección Hero */}
          <section className="hero" aria-labelledby="bienvenido">
            <h1 id="bienvenido">Sistema de Gestión Alimentaria</h1>
            <p>Foodsys es el sistema oficial del Centro Agropecuario La Granja (SENA Regional Tolima) para gestionar la alimentación de los aprendices.</p>
            <p>Permite reservar desayuno, almuerzo o cena con un día de anticipación, ayudando a planificar las raciones y reduciendo el desperdicio de comida.</p>
            
            <p className="highlight">Optimizamos el control de alimentación y reducimos el desperdicio de comida.</p>

            <div className="features">
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>Reserva anticipada de alimentos</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>Control de asistencia al comedor</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>Gestión eficiente de raciones</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>Reducción de desperdicios</span>
              </div>
            </div>

            <div className="img-container">
              <img 
                id="destacada" 
                src={Presentacion}
                alt="Sistema de alimentación Foodsys" 
              />
            </div>
          </section>

          {/* Formulario de Login */}
          <aside className="card" aria-labelledby="login">
            <h2 id="login">Iniciar sesión</h2>
            <p className="sub">Acceso exclusivo para el SENA</p>

            <form 
              id="loginForm" 
              ref={loginFormRef}
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="field">
                <label htmlFor="tipo">Tipo de documento</label>
                <select 
                  id="tipo"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={touched.tipoDocumento && formErrors.tipoDocumento ? 'invalid' : touched.tipoDocumento ? 'valid' : ''}
                  required
                >
                  <option value="">Seleccione su documento</option>
                  <option value="cc">Cédula de ciudadanía</option>
                  <option value="ti">Tarjeta identidad</option>
                  <option value="ce">Cédula de extranjería</option>
                  <option value="passport">Pasaporte</option>
                </select>
                {touched.tipoDocumento && formErrors.tipoDocumento && (
                  <div className="error-message">{formErrors.tipoDocumento}</div>
                )}
              </div>

              <div className="field">
                <label htmlFor="documento">Número de documento</label>
                <input 
                  id="documento"
                  name="documento"
                  type="text" 
                  placeholder="Ej: 123456789" 
                  value={formData.documento}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={touched.documento && formErrors.documento ? 'invalid' : touched.documento && !formErrors.documento ? 'valid' : ''}
                  required 
                  inputMode="numeric"
                />
                {touched.documento && formErrors.documento && (
                  <div className="error-message">{formErrors.documento}</div>
                )}
              </div>

              <div className="field input-row">
                <label htmlFor="pass">Contraseña</label>
                <input 
                  id="pass"
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="Tu contraseña" 
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={touched.password && formErrors.password ? 'invalid' : touched.password && !formErrors.password ? 'valid' : ''}
                  required 
                  minLength="6"
                />
                <button 
                  type="button" 
                  className="show-pass" 
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
                {touched.password && formErrors.password && (
                  <div className="error-message">{formErrors.password}</div>
                )}
              </div>

              <div className="actions">
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={isLoading}
                >
                  <span className="btn-text">
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </span>
                  {isLoading && <div className="spinner"></div>}
                </button>
                <button type="button" className="btn btn-secondary">
                  <i className="fas fa-question-circle"></i> Ayuda
                </button>
              </div>

              <div className="extras">
                <a href="#">
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