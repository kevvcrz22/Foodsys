// ─────────────────────────────────────────────────────────────────────────────
// Login.jsx
// Contenedor principal del módulo de Login.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useContext }  from 'react';
import { useNavigate }                           from 'react-router-dom';
import { AuthContext }                           from '../../context/authContext';
import { Validar_Campo, Validar_Formulario, Formulario_Es_Valido } from './LoginValidacion';
import LoginHero                                 from './LoginHero';
import LoginFormulario                           from './LoginFormulario';
import LoginModalPolitica                        from './LoginModalPolitica';

// ─── Valores iniciales del formulario (variables 100% en español) ────────────
import apiNode from '../../api/axiosConfig';

const Est_InicialFormulario = { TipDoc_Usuario: '', NumDoc_Usuario: '', contrasena: '' };
const Est_InicialErrores    = { TipDoc_Usuario: '', NumDoc_Usuario: '', contrasena: '' };
const Est_InicialTocado     = { TipDoc_Usuario: false, NumDoc_Usuario: false, contrasena: false };

const Login = ({ onLogin }) => {
  const { setUser } = useContext(AuthContext);
  const Nav_Redireccion = useNavigate();

  const [Dat_Formulario,   Set_DatFormulario]   = useState(Est_InicialFormulario);
  const [Err_Campos,       Set_ErrCampos]        = useState(Est_InicialErrores);
  const [Est_Tocado,       Set_EstTocado]        = useState(Est_InicialTocado);
  const [Mst_Password,     Set_MstPassword]      = useState(false);
  const [Est_Cargando,     Set_EstCargando]      = useState(false);
  const [Tex_ErrorGeneral, Set_TexErrorGeneral]  = useState('');

  const [Mst_Politica,    Set_MstPolitica]   = useState(false);
  const [Pen_Login,       Set_PenLogin]      = useState(null);

  const Ref_Formulario = useRef(null);

  const Mj_Cambio = ({ target: { name, value } }) => {
    Set_DatFormulario((Prv) => ({ ...Prv, [name]: value }));
    if (Est_Tocado[name])    Set_ErrCampos((Prv) => ({ ...Prv, [name]: Validar_Campo(name, value) }));
    if (Tex_ErrorGeneral)    Set_TexErrorGeneral('');
  };

  const Mj_Blur = ({ target: { name, value } }) => {
    Set_EstTocado((Prv) => ({ ...Prv, [name]: true }));
    Set_ErrCampos((Prv) => ({ ...Prv, [name]: Validar_Campo(name, value) }));
  };

  const Fn_FinalizarLogin = (Res_Data, Lis_Roles, Txt_RolActivo) => {
    if (onLogin) onLogin(Res_Data.usuario, Lis_Roles, Txt_RolActivo, Res_Data.token);
  };

  const Mj_Submit = async (Evt) => {
    Evt.preventDefault();

    const Obj_Errores = Validar_Formulario(Dat_Formulario);
    Set_ErrCampos(Obj_Errores);
    Set_EstTocado({ TipDoc_Usuario: true, NumDoc_Usuario: true, contrasena: true });
    
    if (!Formulario_Es_Valido(Obj_Errores)) return;

    try {
      Set_EstCargando(true);
      Set_TexErrorGeneral('');

      // Mapear 'contrasena' a 'password' para mantener compatibilidad estricta
      // con la BD y el backend existente (regla del usuario).
      const Datos_Backend = {
        TipDoc_Usuario: Dat_Formulario.TipDoc_Usuario,
        NumDoc_Usuario: Dat_Formulario.NumDoc_Usuario,
        password:       Dat_Formulario.contrasena,
      };

      const Res_Respuesta = await apiNode.post("/api/Usuarios/login", Datos_Backend);
      const Res_Data = Res_Respuesta.data;

      if (!Res_Data.token || Res_Data.token.split('.').length !== 3) {
        throw new Error('El servidor no devolvió un token válido');
      }

      setUser(Res_Data.usuario);

      const Lis_Roles     = Res_Data.roles;
      const Txt_RolActivo = Lis_Roles.includes('Administrador') ? 'Administrador' : Lis_Roles[0];

      if (Res_Data.usuario.Pol_Usuario !== 'Si') {
        Set_PenLogin({ Res_Data, Lis_Roles, Txt_RolActivo });
        Set_MstPolitica(true);
        return;
      }

      Fn_FinalizarLogin(Res_Data, Lis_Roles, Txt_RolActivo);

    } catch (Err_Excepcion) {
      Set_TexErrorGeneral(Err_Excepcion.response?.data?.message || Err_Excepcion.message || 'Error al iniciar sesión');
    } finally {
      Set_EstCargando(false);
    }
  };

  const Mj_AceptarPolitica = async () => {
    try {
      const { Res_Data, Lis_Roles, Txt_RolActivo } = Pen_Login;
      await apiNode.patch(`/api/Usuarios/${Res_Data.usuario.Id_Usuario}/politica`);
      Set_MstPolitica(false);
      Set_PenLogin(null);
      Fn_FinalizarLogin(Res_Data, Lis_Roles, Txt_RolActivo);
    } catch {
      Set_TexErrorGeneral('Error al registrar la aceptación de política. Intenta de nuevo.');
      Set_MstPolitica(false);
    }
  };

  const Mj_RechazarPolitica = () => {
    Set_MstPolitica(false);
    Set_PenLogin(null);
    Set_TexErrorGeneral('Debes aceptar la política de tratamiento de datos para acceder al sistema.');
  };

  return (
    <div className="min-h-screen bg-fondo flex items-center justify-center px-4 py-8 font-['Segoe_UI',system-ui,sans-serif]">
      {Mst_Politica && (
        <LoginModalPolitica
          Fn_Aceptar={Mj_AceptarPolitica}
          Fn_Rechazar={Mj_RechazarPolitica}
        />
      )}

      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="flex-1">
          <LoginHero />
        </div>
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
