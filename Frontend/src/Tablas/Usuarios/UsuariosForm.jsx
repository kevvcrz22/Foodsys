import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig";

const UsuariosForm = ({ hideModal, UsuarioSeleccionado, Editar, reload }) => {
  const [Id_Usuario, setId_Usuario] = useState("");
  const [TipDoc_Usuario, setTipDoc_Usuario] = useState("");
  const [NumDoc_Usuario, setNumDoc_Usuario] = useState("");
  const [Nom_Usuario, setNom_Usuario] = useState("");
  const [Ape_Usuario, setApe_Usuario] = useState("");
  const [Gen_Usuario, setGen_Usuario] = useState("");
  const [Cor_Usuario, setCor_Usuario] = useState("");
  const [Tel_Usuario, setTel_Usuario] = useState("");
  const [CenCon_Usuario, setCenCon_Usuario] = useState("");
  const [Tip_Usuario, setTip_Usuario] = useState("");
  const [Est_Usuario, setEst_Usuario] = useState("");
  const [Con_Usuario, setCon_Usuario] = useState("");
  const [Sancion, setSancion_Usuario] = useState("");
  const [Id_Ficha, setId_Ficha] = useState("");
  const [Fichas, setFichas] = useState([]);

  const [textFormButton, setTextFormButton] = useState("Enviar");

  useEffect(() => {
    getFichas();
  }, []);

  useEffect(() => {
    if (Editar && UsuarioSeleccionado) {
      setId_Usuario(UsuarioSeleccionado.Id_Usuario);
      setTipDoc_Usuario(UsuarioSeleccionado.TipDoc_Usuario);
      setNumDoc_Usuario(UsuarioSeleccionado.NumDoc_Usuario);
      setNom_Usuario(UsuarioSeleccionado.Nom_Usuario);
      setApe_Usuario(UsuarioSeleccionado.Ape_Usuario);
      setGen_Usuario(UsuarioSeleccionado.Gen_Usuario);
      setCor_Usuario(UsuarioSeleccionado.Cor_Usuario);
      setTel_Usuario(UsuarioSeleccionado.Tel_Usuario);
      setCenCon_Usuario(UsuarioSeleccionado.CenCon_Usuario);
      setTip_Usuario(UsuarioSeleccionado.Tip_Usuario);
      setEst_Usuario(UsuarioSeleccionado.Est_Usuario);
      setCon_Usuario(UsuarioSeleccionado.Con_Usuario);
      setSancion_Usuario(UsuarioSeleccionado.Sancion);
      setId_Ficha(UsuarioSeleccionado.Id_Ficha);
      setTextFormButton("Actualizar");
    } else {
      setId_Usuario("");
      setTipDoc_Usuario("");
      setNumDoc_Usuario("");
      setNom_Usuario("");
      setApe_Usuario("");
      setGen_Usuario("");
      setCor_Usuario("");
      setTel_Usuario("");
      setCenCon_Usuario("");
      setTip_Usuario("");
      setEst_Usuario("");
      setCon_Usuario("");
      setSancion_Usuario("");
      setId_Ficha("");
      setTextFormButton("Enviar");
    }
  }, [UsuarioSeleccionado, Editar]);

  const getFichas = async () => {
    const Fichas = await apiAxios.get("/api/Fichas");
    setFichas(Fichas.data);
    console.log(Fichas.data);
  };

  const gestionarForm = async (e) => {
    e.preventDefault();

    if (textFormButton === "Enviar") {
      try {
        const response = await apiAxios.post("/api/Usuarios/", {
          TipDoc_Usuario,
          NumDoc_Usuario,
          Nom_Usuario,
          Ape_Usuario,
          Gen_Usuario,
          Cor_Usuario,
          Tel_Usuario,
          CenCon_Usuario,
          Tip_Usuario,
          Est_Usuario,
          Con_Usuario,
          Sancion,
          Id_Ficha
        });
        const data = response.data;

        alert("Usuario Creado Correctamente");
        reload();
        hideModal();

      } catch (error) {
        console.error("Error Creando Usuario", error.response ? error.response.data : error.message);
        alert(error.message);
      }

    } else if (textFormButton === "Actualizar") {
      try {
        await apiAxios.put(`/api/Usuarios/${Id_Usuario}`, {
          TipDoc_Usuario,
          NumDoc_Usuario,
          Nom_Usuario,
          Ape_Usuario,
          Gen_Usuario,
          Cor_Usuario,
          Tel_Usuario,
          CenCon_Usuario,
          Tip_Usuario,
          Est_Usuario,
          Con_Usuario,
          Sancion,
          Id_Ficha
        });

        alert("Usuario Actualizado Correctamente");
        reload();
        hideModal();

      } catch (error) {
        console.error(error);
        alert("Error Actualizando Usuario");
      }
    }
  };

  return (
    <>
      <form onSubmit={gestionarForm} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo De Documento
            </label>
            <select
              id="TipDoc_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={TipDoc_Usuario}
              onChange={(e) => setTipDoc_Usuario(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="PEP">Permiso Especial de Permanencia</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="PPT">Permiso por Protección Temporal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Documento
            </label>
            <input
              type="text"
              id="NumDoc_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={NumDoc_Usuario}
              onChange={(e) => setNumDoc_Usuario(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombres
            </label>
            <input
              type="text"
              id="Nom_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Nom_Usuario}
              onChange={(e) => setNom_Usuario(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellidos
            </label>
            <input
              type="text"
              id="Ape_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Ape_Usuario}
              onChange={(e) => setApe_Usuario(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Género
          </label>
          <select
            id="Gen_Usuario"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={Gen_Usuario}
            onChange={(e) => setGen_Usuario(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Prefiero no decirlo</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="Cor_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Cor_Usuario}
              onChange={(e) => setCor_Usuario(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              id="Tel_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Tel_Usuario}
              onChange={(e) => setTel_Usuario(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Centro de Convivencia
          </label>
          <select
            id="CenCon_Usuario"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={CenCon_Usuario}
            onChange={(e) => setCenCon_Usuario(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="Si">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuario
            </label>
            <select
              id="Tip_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Tip_Usuario}
              onChange={(e) => setTip_Usuario(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="Aprendiz">Aprendiz</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Bienestar">Bienestar</option>
              <option value="Administrador">Administrador</option>
              <option value="Invitado">Invitado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de Usuario
            </label>
            <select
              id="Est_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Est_Usuario}
              onChange={(e) => setEst_Usuario(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="Aplazado">Aplazado</option>
              <option value="Apoyo de Sostenimiento">Apoyo de Sostenimiento</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Condicionado">Condicionado</option>
              <option value="En Formacion">En Formación</option>
              <option value="En Induccion">En Inducción</option>
              <option value="Etapa Productiva">Pasante</option>
              <option value="Retiro Voluntario">Retiro Voluntario</option>
              <option value="Sena Empresa">Sena Empresa</option>
              <option value="Traslado">Traslado</option>
              <option value="Visitantes">Visitantes</option>
              <option value="Turno Sena Empresa">Turno Sena Empresa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sanción
            </label>
            <select
              id="Sancion"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Sancion}
              onChange={(e) => setSancion_Usuario(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="Con_Usuario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={Con_Usuario}
              onChange={(e) => setCon_Usuario(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="Id_Ficha" className="block text-sm font-medium text-gray-700 mb-2">
            Ficha
          </label>
          <select
            id="Id_Ficha"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={Id_Ficha}
            onChange={(e) => setId_Ficha(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {Fichas.map((Fichas) => (
              <option key={Fichas.Id_Ficha} value={Fichas.Id_Ficha}>
                {Fichas.Num_Ficha}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={hideModal}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            {textFormButton}
          </button>
        </div>

      </form>
    </>
  );
};

export default UsuariosForm;