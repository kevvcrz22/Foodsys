import { useState, useEffect } from "react";
import apiAxios from "../api/axiosConfig";

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
  const [Id_Ficha, setId_Ficha] = useState("")
  const [Fichas, setFichas] = useState ([])

  const [textFormButton, setTextFormButton] = useState("Enviar");
  useEffect(() => {
    getFichas()},[])
    useEffect(() =>{
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
    } 
  }, [UsuarioSeleccionado, Editar]);
    const getFichas = async () => {
      const Fichas = await apiAxios.get("/api/Fichas")
      setFichas(Fichas.data)
      console.log(Fichas.data)
    }

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
      hideModal();
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
      reload();

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
}

  return (
    <>
      <form onSubmit={gestionarForm} className="col-12 col-md-12">
        <div className="mb-3">
          <label className="form-label">Tipo De Documento:</label>
          <select id="TipDoc_Usuario" className="form-control" value={TipDoc_Usuario} onChange={(e) => setTipDoc_Usuario(e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="CC">Cedula de Ciudadania</option>
            <option value="CE">Cedula de Extranjeria</option>
            <option value="PEP">Permiso Especial de Permanencia</option>
            <option value="TI">Tarjeta de Identidad</option>
            <option value="PPT">Permiso por Proteccion Temporal</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Numero de Documento:</label>
          <input type="text" id="NumDoc_Usuario" className="form-control" value={NumDoc_Usuario} onChange={(e) => setNumDoc_Usuario(e.target.value)}/>
        </div>

        <div className="mb-3">
          <label className="form-label">Nombres:</label>
          <input type="text" id="Nom_Usuario" className="form-control" value={Nom_Usuario} onChange={(e) => setNom_Usuario(e.target.value)}/>
        </div>

        <div className="mb-3">
          <label className="form-label">Apellidos:</label>
          <input type="text" id="Ape_Usuario" className="form-control"value={Ape_Usuario} onChange={(e) => setApe_Usuario(e.target.value)}/>
        </div>

        <div className="mb-3">
          <label className="form-label">Genero:</label>
          <select id="Gen_Usuario" className="form-control" value={Gen_Usuario} onChange={(e) => setGen_Usuario(e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Prefiero no decirlo</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Correo Electronico:</label>
          <input type="text" id="Cor_Usuario" className="form-control" value={Cor_Usuario} onChange={(e) => setCor_Usuario(e.target.value)}/>
        </div>

        <div className="mb-3">
          <label className="form-label">Teléfono:</label>
          <input type="text" id="Tel_Usuario" className="form-control" value={Tel_Usuario} onChange={(e) => setTel_Usuario(e.target.value)}/>
        </div>

        <div className="mb-3">
          <label className="form-label">Centro de Convivencia:</label>
          <select id="CenCon_Usuario" className="form-control" value={CenCon_Usuario} onChange={(e) => setCenCon_Usuario(e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Si">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Tipo de Usuario:</label>
          <select id="Tip_Usuario" className="form-control" value={Tip_Usuario} onChange={(e) => setTip_Usuario(e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Aprendiz">Aprendiz</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Coordinador">Coordinador</option>
            <option value="Bienestar">Bienestar</option>
            <option value="Administrador">Administrador</option>
            <option value="Invitado">Invitado</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Estado de Usuario:</label>
          <select id="Est_Usuario" className="form-control" value={Est_Usuario} onChange={(e) => setEst_Usuario(e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Aplazado">Aplazado</option>
            <option value="Apoyo de Sostenimiento">Apoyo de Sostenimiento</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Condicionado">Condicionado</option>
            <option value="En Formacion">En Formacion</option>
            <option value="En Induccion">En Induccion</option>
            <option value="Etapa Productiva">Pasante</option>
            <option value="Retiro Voluntario">Retiro Voluntario</option>
            <option value="Sena Empresa">Sena Empresa</option>
            <option value="Traslado">Traslado</option>
            <option value="Visitantes">Visitantes</option>
            <option value="Turno Sena Empresa">Turno Sena Empresa</option>
          </select>
        </div>
          <div className="mb-3">
          <label className="form-label">Sancion</label>
          <select id="Sancion" className="form-control" value={Sancion} onChange={(e) => setSancion_Usuario(e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="Si">Si</option>
            <option value="No">No</option>
            </select>
            </div>

        <div className="mb-3">
          <label className="form-label">Contraseña:</label>
          <input type="text" id="Con_Usuario"className="form-control" value={Con_Usuario} onChange={(e) => setCon_Usuario(e.target.value)}/>
        </div>

        <div className="mb-3">
        <label htmlFor="Id_Ficha" className="form-label">Ficha:</label>
        <select id="Id_Ficha" className="form-control" value={Id_Ficha} onChange={(e) => setId_Ficha(e.target.value)}>
          <option value="">Seleccionar...</option>
          {Fichas.map((Fichas) => (
            <option key={Fichas.Id_Ficha} value={Fichas.Id_Ficha}>
              {Fichas.Num_Ficha}
            </option>



         
           
       

       
          
          

          ))}

        
           </select>
        </div>
        <div className="mb-3 text-center">
          <input type="submit" className="btn btn-primary w-50" value={textFormButton} />
        </div>
      </form>
    </>
  );
};

export default UsuariosForm