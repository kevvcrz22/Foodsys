// Paginas/Contacto/Contacto.jsx
// Formulario de Contacto y PQRSF integrado con matriz estandar de prioridad y almacenamiento en MySQL + Correo
// Envia notificacion a fierrokkevin@gmail.com y devuelve numero de radicado oficial para trazabilidad
// Codigo comentado didacticamente sin tildes ni emojis para aprendices de primer semestre

import { useState } from "react";
import {
  Mail, Phone, MapPin, Clock, Paperclip, Send, CheckCircle,
  ArrowLeft, Instagram, HelpCircle, ChevronDown, Star, AlertTriangle,
  ShieldCheck, FileText, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import apiNode from "../../api/axiosConfig";

const SUBCATEGORIAS_POR_CATEGORIA = {
  CALIDAD_ALIMENTACION: [
    "Comida fria o temperatura inadecuada",
    "Sabor o sazon deficiente",
    "Comida cruda o sobrecocida",
    "Porcion incompleta o escasa",
    "Presunto mal estado o sospecha de inocuidad",
    "Cuerpo u objeto extrano en el plato"
  ],
  ESTADO_PLATO_MENAJE: [
    "Plato o bandeja sucia / mal lavada",
    "Plato desportillado o roto",
    "Cubiertos o vasos con residuos",
    "Falta de cubiertos o bandejas en turno"
  ],
  MOBILIARIO_MESAS_SILLAS: [
    "Mesas sucias o con grasa",
    "Sillas danadas o inestables",
    "Espacio insuficiente / aglomeracion",
    "Calor excesivo o falta de ventiladores",
    "Aseo general del comedor"
  ],
  ATENCION_SERVICIO: [
    "Mal trato verbal o mala atencion en linea",
    "Demora excesiva en la entrega",
    "Desorganizacion en la fila",
    "Excelente atencion recibida (Felicitacion)"
  ],
  PLATAFORMA_RESERVAS: [
    "Inconveniente con lectura de codigo QR",
    "Dudas sobre horarios de reserva o cesion",
    "Problema con inicio de sesion",
    "Sugerencia tecnologica para Foodsys"
  ],
  RECONOCIMIENTO: [
    "Felicitacion por excelente sazon del menu",
    "Felicitacion al equipo de cocina",
    "Felicitacion por atencion cordial"
  ],
  OTRO: [
    "Otra situacion no especificada"
  ]
};

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
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    correo: '',
    tipoPqrs: 'Queja',
    categoria: 'CALIDAD_ALIMENTACION',
    subcategoria: 'Comida fria o temperatura inadecuada',
    tipComida: 'Almuerzo',
    personaServicioRef: '',
    calificacion: 3,
    mensaje: ''
  });

  const [archivo, setArchivo] = useState(null);
  const [estadoCarga, setEstadoCarga] = useState('ocioso'); // ocioso | cargando | exito | error
  const [mensajeError, setMensajeError] = useState('');
  const [radicadoExitoso, setRadicadoExitoso] = useState('');
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    if (name === "categoria") {
      const subs = SUBCATEGORIAS_POR_CATEGORIA[value] || ["Otra situacion"];
      setDatosFormulario(prev => ({
        ...prev,
        categoria: value,
        subcategoria: subs[0]
      }));
    } else {
      setDatosFormulario(prev => ({ ...prev, [name]: value }));
    }
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMensajeError("El archivo supera el limite maximo permitido de 5MB.");
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
      formData.append('Nombre_Reportante', datosFormulario.nombre);
      formData.append('Correo_Reportante', datosFormulario.correo);
      formData.append('Tipo_Solicitud', datosFormulario.tipoPqrs);
      formData.append('Categoria_Estandar', datosFormulario.categoria);
      formData.append('Subcategoria', datosFormulario.subcategoria);
      formData.append('Tip_Comida', datosFormulario.tipComida);
      formData.append('Persona_Servicio_Ref', datosFormulario.personaServicioRef);
      formData.append('Calificacion_Servicio', String(datosFormulario.calificacion));
      formData.append('Descripcion', datosFormulario.mensaje);
      if (archivo) {
        formData.append('adjunto', archivo);
      }

      const respuesta = await apiNode.post("/api/Pqrsf", formData);

      const rad = respuesta.data?.pqrsf?.Radicado || respuesta.data?.radicado || "PQRS-REGISTRADA";
      setRadicadoExitoso(rad);
      setEstadoCarga('exito');
      setDatosFormulario({
        nombre: '',
        correo: '',
        tipoPqrs: 'Queja',
        categoria: 'CALIDAD_ALIMENTACION',
        subcategoria: 'Comida fria o temperatura inadecuada',
        tipComida: 'Almuerzo',
        personaServicioRef: '',
        calificacion: 3,
        mensaje: ''
      });
      setArchivo(null);
    } catch (error) {
      console.error("Error al enviar PQRSF:", error.message);
      // Fallback a ruta de contacto basica si falla
      try {
        const formDataFallback = new FormData();
        formDataFallback.append('nombre', datosFormulario.nombre);
        formDataFallback.append('correo', datosFormulario.correo);
        formDataFallback.append('tipoPqrs', datosFormulario.tipoPqrs);
        formDataFallback.append('mensaje', `[${datosFormulario.categoria} - ${datosFormulario.subcategoria}] ${datosFormulario.mensaje}`);
        if (archivo) formDataFallback.append('adjunto', archivo);
        await apiNode.post("/api/Auth/contacto", formDataFallback);
        setRadicadoExitoso("PQRS-RECIBIDA-BIENESTAR");
        setEstadoCarga('exito');
      } catch (errFallback) {
        setEstadoCarga('error');
        setMensajeError(error.response?.data?.mensaje || errFallback.response?.data?.mensaje || "Error al enviar la solicitud. Por favor intenta nuevamente.");
      }
    }
  };

  const subcategoriasActuales = SUBCATEGORIAS_POR_CATEGORIA[datosFormulario.categoria] || [];

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
          <h1 className="text-3xl sm:text-4xl font-extrabold texto-gradiente inline-block">
            Oficina de Bienestar al Aprendiz · PQRSF
          </h1>
          <p className="mt-3 text-texto-secundario text-sm max-w-xl mx-auto">
            Canal oficial para Peticiones, Quejas, Reclamos, Sugerencias y Felicitaciones sobre el servicio de alimentacion en el Centro Agropecuario La Granja.
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
              <span>¿Como funciona el sistema de PQRSF? (Guia paso a paso)</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${mostrarGuia ? 'rotate-180' : ''}`} />
          </button>
          {mostrarGuia && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-texto-secundario space-y-1.5 leading-relaxed">
              <p><strong>1. Asignacion de Radicado:</strong> Cada mensaje genera un radicado unico (ej: PQRS-202610-0042) para que puedas consultar su estado.</p>
              <p><strong>2. Estandar de Prioridad y SLA:</strong> Quejas sobre inocuidad o alimentos en presunto mal estado se marcan como CRITICAS con atencion en menos de 4 horas.</p>
              <p><strong>3. Termometro de Interventoria:</strong> Si se acumulan 3 o mas quejas sobre un mismo plato o turno, se dispara alerta automatica al contratista del comedor.</p>
              <p><strong>4. Destino Oficial:</strong> El mensaje se almacena en el sistema y se notifica inmediatamente al correo institucional fierrokkevin@gmail.com.</p>
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
                Registrar Solicitud / Queja
              </h2>

              {estadoCarga === 'exito' ? (
                <div className="flex flex-col items-center justify-center py-10 animar-entrada text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-texto-principal">¡Solicitud Registrada con Exito!</h3>
                  <div className="my-4 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 inline-block">
                    <p className="text-xs text-blue-700 font-medium">Numero de Radicado Oficial:</p>
                    <p className="text-base font-extrabold text-[#0f3f80]">{radicadoExitoso}</p>
                  </div>
                  <p className="text-texto-secundario text-sm mt-2 max-w-sm">
                    Hemos recibido tu reporte en la Oficina de Bienestar al Aprendiz e Interventoria. Se notifico a fierrokkevin@gmail.com para su gestion oportuna.
                  </p>
                  <button onClick={() => setEstadoCarga('ocioso')} className="boton-secundario px-6 py-2 mt-6 cursor-pointer">
                    Registrar otra PQRSF
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="etiqueta-campo">Tipo de Solicitud *</label>
                      <select
                        name="tipoPqrs"
                        value={datosFormulario.tipoPqrs}
                        onChange={manejarCambio}
                        className="campo-glass bg-white"
                        disabled={estadoCarga === 'cargando'}
                      >
                        <option value="Queja">Queja (Inconformidad con el servicio)</option>
                        <option value="Reclamo">Reclamo (Incumplimiento de menu o porcion)</option>
                        <option value="Peticion">Peticion (Solicitud formal)</option>
                        <option value="Sugerencia">Sugerencia (Propuesta de mejora)</option>
                        <option value="Felicitacion">Felicitacion (Reconocimiento)</option>
                      </select>
                    </div>

                    <div>
                      <label className="etiqueta-campo">Turno de Alimentacion *</label>
                      <select
                        name="tipComida"
                        value={datosFormulario.tipComida}
                        onChange={manejarCambio}
                        className="campo-glass bg-white"
                        disabled={estadoCarga === 'cargando'}
                      >
                        <option value="Almuerzo">Almuerzo</option>
                        <option value="Desayuno">Desayuno</option>
                        <option value="Cena">Cena</option>
                        <option value="General">Comedor General</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="etiqueta-campo">Categoria Estandar *</label>
                      <select
                        name="categoria"
                        value={datosFormulario.categoria}
                        onChange={manejarCambio}
                        className="campo-glass bg-white"
                        disabled={estadoCarga === 'cargando'}
                      >
                        <option value="CALIDAD_ALIMENTACION">Calidad de Alimentacion</option>
                        <option value="ESTADO_PLATO_MENAJE">Estado del Plato o Menaje</option>
                        <option value="MOBILIARIO_MESAS_SILLAS">Mesas, Sillas e Higiene</option>
                        <option value="ATENCION_SERVICIO">Atencion del Personal de Servicio</option>
                        <option value="PLATAFORMA_RESERVAS">Plataforma Foodsys y Reservas</option>
                        <option value="RECONOCIMIENTO">Felicitacion o Agradecimiento</option>
                        <option value="OTRO">Otro Tema</option>
                      </select>
                    </div>

                    <div>
                      <label className="etiqueta-campo">Causa o Subcategoria Especifica *</label>
                      <select
                        name="subcategoria"
                        value={datosFormulario.subcategoria}
                        onChange={manejarCambio}
                        className="campo-glass bg-white"
                        disabled={estadoCarga === 'cargando'}
                      >
                        {subcategoriasActuales.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {datosFormulario.categoria === "ATENCION_SERVICIO" && (
                    <div>
                      <label className="etiqueta-campo">Referencia de Persona del Servicio (Opcional)</label>
                      <input
                        type="text"
                        name="personaServicioRef"
                        value={datosFormulario.personaServicioRef}
                        onChange={manejarCambio}
                        placeholder="Ej. Personal de entrega de fila 2, o auxiliar de aseo"
                        className="campo-glass"
                        disabled={estadoCarga === 'cargando'}
                      />
                    </div>
                  )}

                  <div>
                    <label className="etiqueta-campo flex items-center justify-between">
                      <span>Calificacion del Servicio en este turno (1 a 5 estrellas)</span>
                      <span className="text-amber-500 font-bold">{datosFormulario.calificacion} de 5 estrellas</span>
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((estrella) => (
                        <button
                          key={estrella}
                          type="button"
                          onClick={() => setDatosFormulario(prev => ({ ...prev, calificacion: estrella }))}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={24}
                            className={estrella <= datosFormulario.calificacion ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="etiqueta-campo">Descripcion Detallada del Hecho *</label>
                    <textarea
                      rows={4}
                      name="mensaje"
                      value={datosFormulario.mensaje}
                      onChange={manejarCambio}
                      placeholder="Explica que sucedio, fecha aproximada, alimentos involucrados o detalles que respalden la situacion..."
                      className="campo-glass resize-none"
                      disabled={estadoCarga === 'cargando'}
                      required
                    />
                  </div>

                  <div>
                    <label className="etiqueta-campo flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-primario" /> Archivo Adjunto de Evidencia (Foto o PDF, Opcional)
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
                        Formatos permitidos: JPG, PNG o PDF. Limite maximo: 5MB.
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
                        <span>Registrando y notificando a Bienestar...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar PQRSF a Bienestar</span>
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