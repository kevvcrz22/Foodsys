import React, { useState, useEffect, useRef } from 'react';

import Presentacion from './Img/Casino.jpg';
import './Login.css'; // Asegúrate de que esta ruta sea correcta

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
                  name="TipDoc_Usuario"
                  value={formData.TipDoc_Usuario}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={touched.TipDoc_Usuario && formErrors.TipDoc_Usuario ? 'invalid' : touched.TipDoc_Usuario ? 'valid' : ''}
                  required
                >
                  <option value="">Seleccione su documento</option>
                  <option value="CC">Cedula de Ciudadania</option>
                  <option value="CE">Cedula de Extranjeria</option>
                  <option value="PEP">Permiso Especial de Permanencia</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="PPT">Permiso por Proteccion Temporal</option>
                </select>
                {touched.TipDoc_Usuario && formErrors.TipDoc_Usuario && (
                  <div className="error-message">{formErrors.TipDoc_Usuario}</div>
                )}
              </div>

              <div className="field">
                <label htmlFor="NumDoc_Usuario">Número de documento</label>
                <input 
                  id="documento"
                  name="NumDoc_Usuario"
                  type="text" 
                  placeholder="Ej: 123456789" 
                  value={formData.NumDoc_Usuario}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={touched.NumDoc_Usuario && formErrors.NumDoc_Usuario ? 'invalid' : touched.NumDoc_Usuario && !formErrors.NumDoc_Usuario ? 'valid' : ''}
                  required 
                  inputMode="numeric"
                />
                {touched.NumDoc_Usuario && formErrors.NumDoc_Usuario && (
                  <div className="error-message">{formErrors.NumDoc_Usuario}</div>
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

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-column">
            <h3>Foodsys</h3>
            <p>Sistema de gestión alimentaria del Centro Agropecuario La Granja - SENA Regional Tolima.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            </div>
          </div>
          
          <div className="footer-column">
            <h3>Enlaces rápidos</h3>
            <a href="Index.html">Inicio</a>
            <a href="#">Contacto</a>
            <a href="#">¿Qué es foodsys?</a>
          </div>
          
          <div className="footer-column">
            <h3>Recursos</h3>
            <a href="#">Preguntas frecuentes</a>
            <a href="#">Política de privacidad</a>
            <a href="#">Términos de uso</a>
            <a href="#">Soporte técnico</a>
          </div>
          
          <div className="footer-column">
            <h3>Contacto</h3>
            <p><i className="fas fa-map-marker-alt"></i> Centro Agropecuario La Granja, Tolima</p>
            <p><i className="fas fa-phone"></i> +57 (322) 947-3491</p>
            <p><i className="fas fa-envelope"></i> foodsys.edu.co</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Foodsys - Sistema de Gestión Alimentaria. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LoginFoodsys;