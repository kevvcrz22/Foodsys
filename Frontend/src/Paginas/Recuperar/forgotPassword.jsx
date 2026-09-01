// Paginas/Recuperacion/forgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import apiNode from "../../api/axiosConfig";

const ForgotPassword = () => {
  const [Dat_Email, Set_Email]     = useState("");
  const [Tex_Error, Set_Error]     = useState("");
  const [Tex_Mensaje, Set_Mensaje] = useState("");
  const [Est_Cargando, Set_Cargando] = useState(false);

  const Fn_Submit = async (e) => {
    e.preventDefault();
    Set_Error("");
    Set_Mensaje("");
    Set_Cargando(true);

    try {
      const Respuesta = await apiNode.post("/api/Usuarios/request-reset-password", {
        email: Dat_Email,
      });
      Set_Mensaje(Respuesta.data.message);
    } catch (error) {
      Set_Error(error.response?.data?.message || "Ups, algo paso.");
    } finally {
      Set_Cargando(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <aside className="bg-white rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.10)] w-full lg:w-[420px]">

        <div className="text-center mb-6">
          <h2 className="text-[#1a1a2e] text-2xl font-extrabold">
            Recuperar <span className="text-[#42b72a]">contrasena</span>
          </h2>
          <p className="text-[#888] text-sm mt-1">
            Te enviaremos un enlace a tu correo
          </p>
        </div>

        {Tex_Error && (
          <div className="mb-5 px-4 py-3 bg-red-950/10 border border-red-400/30 text-red-500 rounded-xl text-sm">
            {Tex_Error}
          </div>
        )}

        {Tex_Mensaje && (
          <div className="mb-5 px-4 py-3 bg-green-950/10 border border-[#42b72a]/40 text-[#38a024] rounded-xl text-sm">
            {Tex_Mensaje}
          </div>
        )}

        <form onSubmit={Fn_Submit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1a1a2e] mb-1">
              Correo electronico
            </label>
            <input
              type="email"
              value={Dat_Email}
              onChange={(e) => Set_Email(e.target.value)}
              required
              placeholder="tucorreo@sena.edu.co"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#2a2a2a] text-sm bg-[#1a1a2e] text-white placeholder-gray-500 focus:outline-none focus:border-[#1861c1] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={Est_Cargando}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#42b72a] text-white hover:bg-[#38a024] active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {Est_Cargando ? "Enviando..." : "Enviar enlace"}
          </button>

          <div className="text-center">
            <Link to="/" className="text-xs text-[#1861c1] hover:underline">
              Volver a iniciar sesion
            </Link>
          </div>
        </form>
      </aside>
    </div>
  );
};

export default ForgotPassword;