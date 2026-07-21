// Paginas/Recuperar/Recuperar.jsx
// Flujo de recuperación de contraseña en 3 pasos con diseño Liquid Glass

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, Lock, Loader2, CheckCircle } from "lucide-react";
import apiNode from "../../api/axiosConfig";

const Recuperar = () => {
  const navegar = useNavigate();
  // Estado del flujo: 1 = Documento, 2 = Código OTP, 3 = Nueva Contraseña, 4 = Éxito
  const [pasoActual, setPasoActual] = useState(1);
  
  const [documento, setDocumento] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [correoOculto, setCorreoOculto] = useState('');
  
  const [estadoCarga, setEstadoCarga] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const manejarEnvioDocumento = async (e) => {
    e.preventDefault();
    if (!documento) return setMensajeError("Ingresa tu número de documento.");
    
    setEstadoCarga(true);
    setMensajeError('');
    try {
      const respuesta = await apiNode.post("/Auth/recuperar/generar-otp", { documento });
      const data = respuesta.data;
      
      setCorreoOculto(data.correoOculto);
      setPasoActual(2);
    } catch (error) {
      setMensajeError(error.response?.data?.mensaje || "Error de conexión. Inténtalo más tarde.");
    } finally {
      setEstadoCarga(false);
    }
  };

  const manejarEnvioCodigo = async (e) => {
    e.preventDefault();
    if (!codigoOtp) return setMensajeError("Ingresa el código de 6 dígitos.");
    
    setEstadoCarga(true);
    setMensajeError('');
    try {
      await apiNode.post("/Auth/recuperar/validar-otp", { documento, codigo: codigoOtp });
      setPasoActual(3);
    } catch (error) {
      setMensajeError(error.response?.data?.mensaje || "Error de conexión.");
    } finally {
      setEstadoCarga(false);
    }
  };

  const manejarCambioContrasena = async (e) => {
    e.preventDefault();
    if (nuevaContrasena.length < 8) return setMensajeError("La contraseña debe tener mínimo 8 caracteres.");
    
    setEstadoCarga(true);
    setMensajeError('');
    try {
      await apiNode.post("/Auth/recuperar/cambiar-contrasena", { documento, nuevaContrasena });
      setPasoActual(4);
    } catch (error) {
      setMensajeError(error.response?.data?.mensaje || "Error de conexión.");
    } finally {
      setEstadoCarga(false);
    }
  };

  return (
    <div className="min-h-screen bg-fondo flex flex-col justify-center relative overflow-hidden p-4">
      {/* Orbes Liquid Glass de Fondo */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] bg-primario-suave/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-acento-suave/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10 animar-entrada">
        <Link to="/" className="inline-flex items-center gap-2 text-texto-secundario hover:text-primario font-semibold mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>

        <div className="panel-glass p-8">
          <h2 className="text-2xl font-extrabold texto-gradiente mb-2">Recuperar Contraseña</h2>
          
          {pasoActual === 1 && (
            <div className="animar-entrada">
              <p className="text-texto-secundario text-sm mb-6">
                Ingresa tu número de documento. Te enviaremos un código de seguridad a tu correo institucional registrado.
              </p>
              <form onSubmit={manejarEnvioDocumento} className="space-y-4">
                <div>
                  <label className="etiqueta-campo">Número de Documento</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      placeholder="Ej. 1000222333"
                      className="campo-glass w-full pl-10"
                      autoFocus
                    />
                    <Lock className="w-5 h-5 text-texto-secundario/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                {mensajeError && <p className="error-texto">{mensajeError}</p>}
                <button type="submit" disabled={estadoCarga} className="boton-primario w-full py-3">
                  {estadoCarga ? <div className="spinner" /> : "Enviar Código"}
                </button>
              </form>
            </div>
          )}

          {pasoActual === 2 && (
            <div className="animar-entrada">
              <p className="text-texto-secundario text-sm mb-6">
                Hemos enviado un código de 6 dígitos al correo: <strong className="text-texto-principal">{correoOculto}</strong>
              </p>
              <form onSubmit={manejarEnvioCodigo} className="space-y-4">
                <div>
                  <label className="etiqueta-campo">Código de Seguridad</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={codigoOtp}
                      onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="campo-glass w-full pl-10 tracking-[0.5em] font-bold text-lg text-center"
                      autoFocus
                    />
                    <KeyRound className="w-5 h-5 text-texto-secundario/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                {mensajeError && <p className="error-texto">{mensajeError}</p>}
                <button type="submit" disabled={estadoCarga} className="boton-primario w-full py-3">
                  {estadoCarga ? <div className="spinner" /> : "Verificar Código"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setPasoActual(1)} 
                  className="w-full text-sm font-semibold text-acento mt-3 hover:underline text-center"
                >
                  ¿No recibiste el código? Volver
                </button>
              </form>
            </div>
          )}

          {pasoActual === 3 && (
            <div className="animar-entrada">
              <p className="text-texto-secundario text-sm mb-6">
                Código verificado exitosamente. Ingresa tu nueva contraseña (mínimo 8 caracteres).
              </p>
              <form onSubmit={manejarCambioContrasena} className="space-y-4">
                <div>
                  <label className="etiqueta-campo">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={nuevaContrasena}
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      placeholder="••••••••"
                      className="campo-glass w-full pl-10"
                      autoFocus
                    />
                    <Lock className="w-5 h-5 text-texto-secundario/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                {mensajeError && <p className="error-texto">{mensajeError}</p>}
                <button type="submit" disabled={estadoCarga} className="boton-primario w-full py-3">
                  {estadoCarga ? <div className="spinner" /> : "Actualizar Contraseña"}
                </button>
              </form>
            </div>
          )}

          {pasoActual === 4 && (
            <div className="animar-entrada flex flex-col items-center justify-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-exito/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-exito" />
              </div>
              <h3 className="text-xl font-bold text-texto-principal mb-2">¡Contraseña Actualizada!</h3>
              <p className="text-texto-secundario text-sm mb-6">
                Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva credencial.
              </p>
              <button onClick={() => navegar('/')} className="boton-primario w-full py-3">
                Ir al Inicio de Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recuperar;
