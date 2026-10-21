// Paginas/Contacto/Contacto.jsx
// Formulario de Contacto y PQRS integrado con Nodemailer y diseno Liquid Glass
// Envia mensajes y evidencias directamente al correo institucional oficial fierrokkevin@gmail.com

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Paperclip, Send, CheckCircle, ArrowLeft, Instagram, HelpCircle, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import apiNode from "../../api/axiosConfig";

const Tarjeta_Contacto = ({ Icono, Titulo, Linea1, Linea2 }) => {
  return (
    <div className="tarjeta-clay p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-acento/10 flex items-center justify-center flex-shrink-0">
        <Icono className="w-5 h-5 text-acento" />
      </div>
      <div>
        <p className="text-sm font-bold text-texto-principal">{Titulo}</p>
        <p className="text-sm text-texto-secundario mt-0.5">{Linea1}</p>
        {Linea2 && <p className="text-sm text-texto-secundario">{Linea2}</p>}
      </div>
    </div>
  );
};

const Contacto = () => {
  const [datosFormulario, setDatosFormulario] = useState({ nombre: '', correo: '', tipoPqrs: 'Peticion', mensaje: '' });
  const [archivo, setArchivo] = useState(null);
  const [estadoCarga, setEstadoCarga] = useState('ocioso'); // ocioso | cargando | exito | error
  const [mensajeError, setMensajeError] = useState('');
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setDatosFormulario(prev => ({ ...prev, [name]: value }));
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMensajeError("El archivo supera el limite maximo permitido de 2MB.");
        setArchivo(null);
        e.target.value = '';
      } else {
        setMensajeError('');
        setArchivo(file);
      }
    }
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();
    if (!datosFormulario.nombre || !datosFormulario.correo || !datosFormulario.mensaje) {
      setMensajeError("Por favor completa los campos obligatorios marcados con asterisco (*).");
      return;
    }

    setEstadoCarga('cargando');
    setMensajeError('');

    try {
      const formData = new FormData();
      formData.append('nombre', datosFormulario.nombre);
      formData.append('correo', datosFormulario.correo);
      formData.append('tipoPqrs', datosFormulario.tipoPqrs);
      formData.append('mensaje', datosFormulario.mensaje);
      if (archivo) {
        formData.append('adjunto', archivo);
      }

      await apiNode.post("/api/Auth/contacto", formData);

      setEstadoCarga('exito');
      setDatosFormulario({ nombre: '', correo: '', tipoPqrs: 'Peticion', mensaje: '' });
      setArchivo(null);
    } catch (error) {
      setEstadoCarga('error');
      setMensajeError(error.response?.data?.mensaje || "Error del sistema al enviar el mensaje. Intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-fondo relative overflow-hidden py-10 px-4">
      {/* Orbes Decorativos Liquid Glass */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primario-suave/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-acento-suave/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 animar-entrada">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-texto-secundario hover:text-primario font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold texto-gradiente inline-block">Oficina de Bienestar al Aprendiz</h1>
          <p className="mt-3 text-texto-secundario text-sm max-w-xl mx-auto">
            ¿Tienes dudas, sugerencias o requerimientos sobre el servicio de alimentacion en Foodsys? Estamos atentos a tus mensajes.
          </p>
        </div>

        {/* Guia desplegable paso a paso para personas sin conocimientos tecnicos */}
        <div className="mb-8 panel-glass p-4 border border-primario/20">
          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="w-full flex items-center justify-between text-left font-bold text-primario text-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-acento" />
              <span>¿Como usar este modulo de contacto y PQRS? (Guia paso a paso)</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${mostrarGuia ? 'rotate-180' : ''}`} />
          </button>
          {mostrarGuia && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-texto-secundario space-y-1.5 leading-relaxed">
              <p><strong>1. Identificacion:</strong> Escribe tu nombre completo y tu correo electronico (preferiblemente institucional @misena.edu.co o personal).</p>
              <p><strong>2. Tipo de Solicitud:</strong> Selecciona si es una Peticion, Queja, Reclamo, Sugerencia o Felicitacion.</p>
              <p><strong>3. Mensaje claro:</strong> Explica tu caso con detalle (fechas, turnos o situacion ocurrida).</p>
              <p><strong>4. Evidencia (Opcional):</strong> Si tienes una captura de pantalla, foto o documento PDF de soporte (maximo 2MB), adjuntalo antes de enviar.</p>
              <p><strong>5. Destino seguro:</strong> El mensaje llegara directamente al correo institucional de Bienestar (fierrokkevin@gmail.com) para su atencion.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Izquierda: Informacion oficial de contacto */}
          <div className="md:col-span-1 space-y-4">
            <Tarjeta_Contacto
              Icono={Mail}
              Titulo="Correo Institucional"
              Linea1="fierrokkevin@gmail.com"
            />
            <Tarjeta_Contacto
              Icono={Phone}
              Titulo="Oficina de Bienestar al Aprendiz"
              Linea1="Centro Agropecuario La Granja"
              Linea2="Espinal - Tolima"
            />
            <Tarjeta_Contacto
              Icono={MapPin}
              Titulo="Ubicacion"
              Linea1="Centro Agropecuario &quot;La Granja&quot;"
              Linea2="del Espinal-Tolima"
            />
            <Tarjeta_Contacto
              Icono={Clock}
              Titulo="Horario de Atencion"
              Linea1="Lunes a Viernes"
              Linea2="07:00 AM - 05:00 PM"
            />

            {/* Redes Oficiales (Solo Instagram sin URLs inventadas) */}
            <div
              title="Proximamente cuenta oficial de Instagram"
              className="tarjeta-clay p-4 flex items-center gap-3 cursor-default"
            >
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 text-pink-600">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-texto-principal">Instagram Oficial</p>
                <p className="text-xs text-texto-secundario">Proximamente cuenta oficial de Instagram</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario seguro con envio en memoria */}
          <div className="md:col-span-2">
            <div className="panel-glass p-6 sm:p-8 relative">
              <h2 className="text-xl font-bold text-texto-principal mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-primario" />
                Envianos tu solicitud
              </h2>

              {estadoCarga === 'exito' ? (
                <div className="flex flex-col items-center justify-center py-10 animar-entrada text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-texto-principal">¡Mensaje Enviado con Exito!</h3>
                  <p className="text-texto-secundario text-sm mt-2 max-w-sm">
                    Hemos recibido tu solicitud en la Oficina de Bienestar al Aprendiz. Te responderemos al correo proporcionado a la mayor brevedad.
                  </p>
                  <button onClick={() => setEstadoCarga('ocioso')} className="boton-secundario px-6 py-2 mt-6 cursor-pointer">
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={enviarFormulario} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="etiqueta-campo">Nombre Completo *</label>
                      <input
                        type="text"
                        name="nombre"
                        value={datosFormulario.nombre}
                        onChange={manejarCambio}
                        placeholder="Ej. Juan Perez"
                        className="campo-glass"
                        disabled={estadoCarga === 'cargando'}
                        required
                      />
                    </div>
                    <div>
                      <label className="etiqueta-campo">Correo Electronico *</label>
                      <input
                        type="email"
                        name="correo"
                        value={datosFormulario.correo}
                        onChange={manejarCambio}
                        placeholder="ejemplo@misena.edu.co"
                        className="campo-glass"
                        disabled={estadoCarga === 'cargando'}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="etiqueta-campo">Tipo de Solicitud (PQRS) *</label>
                    <select
                      name="tipoPqrs"
                      value={datosFormulario.tipoPqrs}
                      onChange={manejarCambio}
                      className="campo-glass bg-white"
                      disabled={estadoCarga === 'cargando'}
                    >
                      <option value="Peticion">Peticion</option>
                      <option value="Queja">Queja</option>
                      <option value="Reclamo">Reclamo</option>
                      <option value="Sugerencia">Sugerencia</option>
                      <option value="Felicitacion">Felicitacion</option>
                    </select>
                  </div>

                  <div>
                    <label className="etiqueta-campo">Mensaje Detallado *</label>
                    <textarea
                      rows={4}
                      name="mensaje"
                      value={datosFormulario.mensaje}
                      onChange={manejarCambio}
                      placeholder="Describe tu situacion o requerimiento con el mayor detalle posible..."
                      className="campo-glass resize-none"
                      disabled={estadoCarga === 'cargando'}
                      required
                    />
                  </div>

                  <div>
                    <label className="etiqueta-campo flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-primario" /> Archivo Adjunto de Evidencia (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={manejarArchivo}
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="w-full text-xs text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-acento/10 file:text-acento hover:file:bg-acento/20 cursor-pointer transition-all"
                        disabled={estadoCarga === 'cargando'}
                      />
                      <p className="text-[11px] text-texto-secundario/70 mt-1">
                        Formatos permitidos: JPG, PNG o PDF. Limite maximo: 2MB.
                      </p>
                    </div>
                  </div>

                  {mensajeError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 animar-entrada">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <p className="text-xs font-semibold text-rose-700">{mensajeError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={estadoCarga === 'cargando'}
                    className="boton-primario w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {estadoCarga === 'cargando' ? (
                      <>
                        <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando mensaje a Bienestar...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Solicitud a Bienestar</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacto;