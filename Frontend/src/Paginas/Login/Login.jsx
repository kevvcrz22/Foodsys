// ─────────────────────────────────────────────────────────────────────────────
// Login.jsx
// Contenedor principal del modulo de Login.
// Centraliza todo el estado y la logica del proceso de autenticacion.
// Delega la UI a los sub-componentes: LoginHero, LoginFormulario y
// LoginModalPolitica, los cuales reciben datos y funciones por props.
//
// Flujo de autenticacion:
//   1. El usuario completa el formulario y hace submit.
//   2. Se valida el formulario con LoginValidacion.
//   3. Se hace POST al backend y se obtiene un token JWT.
//   4. Si el usuario no acepto la politica, se muestra el modal.
//   5. Al aceptar la politica se hace PATCH al backend y se finaliza el login.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useContext }  from 'react';
import { useNavigate }                           from 'react-router-dom';
import { AuthContext }                           from '../../context/authContext';
import { Validar_Campo, Validar_Formulario, Formulario_Es_Valido } from './LoginValidacion';
import LoginHero                                 from './LoginHero';
import LoginFormulario                           from './LoginFormulario';
import LoginModalPolitica                        from './LoginModalPolitica';

// ─── Valores iniciales del formulario ────────────────────────────────────────
// Centralizar el estado inicial facilita reiniciar el formulario si es necesario.
const Est_InicialFormulario = { TipDoc_Usuario: '', NumDoc_Usuario: '', password: '' };
const Est_InicialErrores    = { TipDoc_Usuario: '', NumDoc_Usuario: '', password: '' };
const Est_InicialTocado     = { TipDoc_Usuario: false, NumDoc_Usuario: false, password: false };

// ─── URL base de la API ───────────────────────────────────────────────────────
const Url_Api = 'http://localhost:8000/api/Usuarios';

// ─── Componente principal ─────────────────────────────────────────────────────
// Props:
//   onLogin -> funcion del componente padre que recibe los datos del usuario
//              autenticado para actualizar el estado global de la aplicacion.
const Login = ({ onLogin }) => {

  // Acceso al estado global de autenticacion a traves del contexto
  const { setUser } = useContext(AuthContext);
  const Nav_Redireccion = useNavigate();

  // ─── Estado del formulario ────────────────────────────────────────────────
  const [Dat_Formulario,   Set_DatFormulario]   = useState(Est_InicialFormulario);
  const [Err_Campos,       Set_ErrCampos]        = useState(Est_InicialErrores);
  const [Est_Tocado,       Set_EstTocado]        = useState(Est_InicialTocado);
  const [Mst_Password,     Set_MstPassword]      = useState(false);
  const [Est_Cargando,     Set_EstCargando]      = useState(false);
  const [Tex_ErrorGeneral, Set_TexErrorGeneral]  = useState('');

  // ─── Estado del modal de politica ────────────────────────────────────────
  // "pendingLogin" guarda temporalmente los datos del login hasta que el
  // usuario acepte o rechace la politica de tratamiento de datos.
  const [Mst_Politica,    Set_MstPolitica]   = useState(false);
  const [Pen_Login,       Set_PenLogin]      = useState(null);

  // Referencia al elemento form para acceso directo al DOM si es necesario
  const Ref_Formulario = useRef(null);

  // ─── Manejador de cambio en los campos ───────────────────────────────────
  // Actualiza el valor del campo y, si ya fue interactuado, revalida en tiempo real.
  const Mj_Cambio = ({ target: { name, value } }) => {
    Set_DatFormulario((Prv) => ({ ...Prv, [name]: value }));
    if (Est_Tocado[name])    Set_ErrCampos((Prv) => ({ ...Prv, [name]: Validar_Campo(name, value) }));
    if (Tex_ErrorGeneral)    Set_TexErrorGeneral('');
  };

  // ─── Manejador de blur (cuando el usuario sale de un campo) ───────────────
  // Marca el campo como tocado y valida su valor actual.
  const Mj_Blur = ({ target: { name, value } }) => {
    Set_EstTocado((Prv) => ({ ...Prv, [name]: true }));
    Set_ErrCampos((Prv) => ({ ...Prv, [name]: Validar_Campo(name, value) }));
  };

  // ─── Finaliza el proceso de login ────────────────────────────────────────
  // Actualiza el contexto global y notifica al componente padre.
  const Fn_FinalizarLogin = (Res_Data, Lis_Roles, Txt_RolActivo) => {
    if (onLogin) onLogin(Res_Data.usuario, Lis_Roles, Txt_RolActivo, Res_Data.token);
  };

  // ─── Manejador de envio del formulario ───────────────────────────────────
  const Mj_Submit = async (Evt) => {
    Evt.preventDefault();

    // Validar todos los campos antes de hacer la solicitud al servidor
    const Obj_Errores = Validar_Formulario(Dat_Formulario);
    Set_ErrCampos(Obj_Errores);
    Set_EstTocado({ TipDoc_Usuario: true, NumDoc_Usuario: true, password: true });
    if (!Formulario_Es_Valido(Obj_Errores)) return;

    try {
      Set_EstCargando(true);
      Set_TexErrorGeneral('');

      // Solicitud POST al endpoint de autenticacion
      const Res_Respuesta = await fetch(`${Url_Api}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(Dat_Formulario),
      });

      const Res_Data = await Res_Respuesta.json();

      // Si la respuesta no es exitosa, lanzar el error recibido del servidor
      if (!Res_Respuesta.ok) throw new Error(Res_Data.message || 'Error al iniciar sesion');

      // Verificar que el token sea un JWT valido (debe tener 3 partes separadas por punto)
      if (!Res_Data.token || Res_Data.token.split('.').length !== 3) {
        throw new Error('El servidor no devolvio un token valido');
      }

      // Guardar el usuario en el estado global del contexto
      setUser(Res_Data.usuario);

      // Determinar el rol activo: Administrador tiene prioridad sobre otros roles
      const Lis_Roles     = Res_Data.roles;
      const Txt_RolActivo = Lis_Roles.includes('Administrador') ? 'Administrador' : Lis_Roles[0];

      // Si el usuario no ha aceptado la politica, mostrar el modal antes de continuar
      if (Res_Data.usuario.Pol_Usuario !== 'Si') {
        Set_PenLogin({ Res_Data, Lis_Roles, Txt_RolActivo });
        Set_MstPolitica(true);
        return;
      }

      Fn_FinalizarLogin(Res_Data, Lis_Roles, Txt_RolActivo);

    } catch (Err_Excepcion) {
      // Mostrar el mensaje de error en la UI, sin usar alert()
      Set_TexErrorGeneral(Err_Excepcion.message);
    } finally {
      // El estado de carga se desactiva siempre, independientemente del resultado
      Set_EstCargando(false);
    }
  };

  // ─── Manejador: el usuario acepta la politica ─────────────────────────────
  // Realiza un PATCH al backend para registrar la aceptacion y continua el login.
  const Mj_AceptarPolitica = async () => {
    try {
      const { Res_Data, Lis_Roles, Txt_RolActivo } = Pen_Login;
      await fetch(`${Url_Api}/${Res_Data.usuario.Id_Usuario}/politica`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      Set_MstPolitica(false);
      Set_PenLogin(null);
      Fn_FinalizarLogin(Res_Data, Lis_Roles, Txt_RolActivo);
    } catch {
      Set_TexErrorGeneral('Error al registrar la aceptacion de politica. Intenta de nuevo.');
      Set_MstPolitica(false);
    }
  };

  // ─── Manejador: el usuario rechaza la politica ────────────────────────────
  // Cancela el login y muestra un mensaje informativo.
  const Mj_RechazarPolitica = () => {
    Set_MstPolitica(false);
    Set_PenLogin(null);
    Set_TexErrorGeneral('Debes aceptar la politica de tratamiento de datos para acceder al sistema.');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    /*
     * Fondo general de la pagina.
     * "min-h-screen" garantiza que ocupe toda la altura de la ventana.
     * El padding vertical da espacio en dispositivos pequenos.
     */
    <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center px-4 py-8 font-['Poppins',Arial,sans-serif]">

      {/* Modal de politica: solo visible si el usuario no la ha aceptado */}
      {Mst_Politica && (
        <LoginModalPolitica
          Fn_Aceptar={Mj_AceptarPolitica}
          Fn_Rechazar={Mj_RechazarPolitica}
        />
      )}

      {/*
       * Contenedor del layout de dos columnas.
       * En moviles: columna unica (solo el formulario, el Hero esta oculto via CSS).
       * En pantallas grandes: dos columnas, Hero a la izquierda, formulario a la derecha.
       */}
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row gap-6 items-stretch">

        {/* Seccion visual izquierda — oculta en movil por el propio componente */}
        <div className="flex-1">
          <LoginHero />
        </div>

        {/* Formulario de inicio de sesion — siempre visible */}
        <LoginFormulario
          Dat_Formulario   = {Dat_Formulario}
          Err_Campos       = {Err_Campos}
          Est_Tocado       = {Est_Tocado}
          Tex_ErrorGeneral = {Tex_ErrorGeneral}
          Est_Cargando     = {Est_Cargando}
          Mst_Password     = {Mst_Password}
          Fn_Cambio        = {Mj_Cambio}
          Fn_Blur          = {Mj_Blur}
          Fn_Submit        = {Mj_Submit}
          Fn_TogglePass    = {() => Set_MstPassword((Prv) => !Prv)}
          Ref_Formulario   = {Ref_Formulario}
        />

      </div>
    </div>
  );
};

export default Login;