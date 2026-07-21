// Paginas/Contacto/Contacto.jsx
// Formulario de Contacto integrado con Nodemailer y diseño Liquid Glass

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Paperclip, Send, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
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

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setDatosFormulario(prev => ({ ...prev, [name]: value }));
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMensajeError("El archivo supera el límite de 2MB.");
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
      setMensajeError("Por favor, completa todos los campos requeridos.");
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

      await apiNode.post("/Auth/contacto", formData);

      setEstadoCarga('exito');
      setDatosFormulario({ nombre: '', correo: '', tipoPqrs: 'Peticion', mensaje: '' });
      setArchivo(null);
    } catch (error) {
      setEstadoCarga('error');
      setMensajeError(error.response?.data?.mensaje || "Error al enviar el mensaje.");
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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold texto-gradiente inline-block">Centro de Soporte</h1>
          <p className="mt-3 text-texto-secundario text-sm max-w-xl mx-auto">
            ¿Tienes dudas, sugerencias o problemas técnicos con Foodsys? Estamos aquí para ayudarte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Izquierda: Info de contacto */}
          <div className="md:col-span-1 space-y-4">
            <Tarjeta_Contacto Icono={Mail} Titulo="Correo Electrónico" Linea1="soportefootsies@cena.edu.co" />
            <Tarjeta_Contacto Icono={Phone} Titulo="Línea Directa" Linea1="+57 (604) 123-4567" Linea2="Ext: 201" />
            <Tarjeta_Contacto Icono={MapPin} Titulo="Ubicación" Linea1="Centro Agropecuario" Linea2="La Salada, Caldas" />
            <Tarjeta_Contacto Icono={Clock} Titulo="Atención" Linea1="Lun - Vie: 7am - 5pm" />
          </div>

          {/* Columna Derecha: Formulario */}
          <div className="md:col-span-2">
            <div className="panel-glass p-8 relative">
              <h2 className="text-xl font-bold text-texto-principal mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-primario" />
                Envíanos un mensaje
              </h2>

              {estadoCarga === 'exito' ? (
                <div className="flex flex-col items-center justify-center py-10 animar-entrada">
                  <div className="w-16 h-16 rounded-full bg-exito/20 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-exito" />
                  </div>
                  <h3 className="text-lg font-bold text-texto-principal">¡Mensaje Enviado!</h3>
                  <p className="text-texto-secundario text-center mt-2">
                    Hemos recibido tu solicitud. Nuestro equipo de soporte te responderá lo más pronto posible.
                  </p>
                  <button onClick={() => setEstadoCarga('ocioso')} className="boton-secundario px-6 py-2 mt-6">
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={enviarFormulario} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="etiqueta-campo">Nombre Completo *</label>
                      <input
                        type="text"
                        name="nombre"
                        value={datosFormulario.nombre}
                        onChange={manejarCambio}
                        placeholder="Ej. Juan Pérez"
                        className="campo-glass"
                        disabled={estadoCarga === 'cargando'}
                      />
                    </div>
                    <div>
                      <label className="etiqueta-campo">Correo Institucional *</label>
                      <input
                        type="email"
                        name="correo"
                        value={datosFormulario.correo}
                        onChange={manejarCambio}
                        placeholder="tu@misena.edu.co"
                        className="campo-glass"
                        disabled={estadoCarga === 'cargando'}
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
                      <option value="Peticion">Petición</option>
                      <option value="Queja">Queja</option>
                      <option value="Reclamo">Reclamo</option>
                      <option value="Sugerencia">Sugerencia</option>
                      <option value="Felicitacion">Felicitación</option>
                    </select>
                  </div>

                  <div>
                    <label className="etiqueta-campo">Mensaje *</label>
                    <textarea
                      rows={4}
                      name="mensaje"
                      value={datosFormulario.mensaje}
                      onChange={manejarCambio}
                      placeholder="Describe tu problema con el mayor detalle posible..."
                      className="campo-glass resize-none"
                      disabled={estadoCarga === 'cargando'}
                    />
                  </div>

                  <div>
                    <label className="etiqueta-campo flex items-center gap-2">
                      <Paperclip className="w-4 h-4" /> Archivo Adjunto (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={manejarArchivo}
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-acento/10 file:text-acento hover:file:bg-acento/20 cursor-pointer transition-all"
                        disabled={estadoCarga === 'cargando'}
                      />
                      <p className="text-xs text-texto-secundario/70 mt-1">
                        Formatos permitidos: JPG, PNG, PDF. Límite: 2MB.
                      </p>
                    </div>
                  </div>

                  {mensajeError && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2 animar-entrada">
                      <div className="w-1.5 h-1.5 rounded-full bg-error mt-2" />
                      <p className="text-sm font-semibold text-error">{mensajeError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={estadoCarga === 'cargando'}
                    className="boton-primario w-full py-3.5 text-[15px]"
                  >
                    {estadoCarga === 'cargando' ? (
                      <span className="flex items-center gap-2">
                        <div className="spinner" /> Enviando...
                      </span>
                    ) : (
                      "Enviar Mensaje Seguramente"
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