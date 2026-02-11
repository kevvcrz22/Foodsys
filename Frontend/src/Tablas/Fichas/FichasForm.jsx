import { useState, useEffect } from "react";
import apiAxios from "../../api/axiosConfig"

const FichasForm = ({ hideModal, selectedFicha, isEdit, reload }) => {

    const [Id_Ficha, setId_Ficha] = useState('')
    const [Num_Ficha, setNum_Ficha] = useState('')
    const [FecIniLec_Ficha, setFecIniLec_Ficha] = useState('')
    const [FecFinLec_Ficha, setFecFinLec_Ficha] = useState('')
    const [FecIniPra_Ficha, setFecIniPra_Ficha] = useState('')
    const [FecFinPra_Ficha, setFecFinPra_Ficha] = useState('')
    const [Id_Programa, setId_Programa]= useState('')
   
    const [Programa, setPrograma] = useState([])
    const [createdAt, setcreatedAt] = useState('')
    const [updatedAt, setupdatedAt] = useState('')


    const [textFormButton, setTextFormButton] = useState ('Enviar')

    useEffect(() => {
      getPrograma()
    }, [])
    useEffect(() => {
    if (isEdit && selectedFicha) {
        setId_Ficha(selectedFicha.Id_Ficha);
        setNum_Ficha(selectedFicha.Num_Ficha);
        setFecIniLec_Ficha(selectedFicha.FecIniLec_Ficha?.slice(0, 10));
        setFecFinLec_Ficha(selectedFicha.FecFinLec_Ficha?.slice(0, 10));
        setFecIniPra_Ficha(selectedFicha.FecIniPra_Ficha?.slice(0, 10));
        setFecFinPra_Ficha(selectedFicha.FecFinPra_Ficha?.slice(0, 10));
        setId_Programa(selectedFicha.Id_Programa);

        setTextFormButton("Actualizar");
    }
}, [selectedFicha, isEdit]);
  const getPrograma = async () => {
    
      const Programa = await apiAxios.get("/api/Programa")
      setPrograma(Programa.data)
      console.log(Programa.data)
    }
  const gestionarForm= async (e)=>{
        e.preventDefault()
        if(textFormButton == 'Enviar'){
            try{
                const response = await apiAxios.post('/api/Fichas/', {
    
                    Num_Ficha: Num_Ficha,
                    FecIniLec_Ficha: FecIniLec_Ficha,
                    FecFinLec_Ficha: FecFinLec_Ficha,
                    FecIniPra_Ficha: FecIniPra_Ficha,
                    FecFinPra_Ficha: FecFinPra_Ficha,
                    Id_Programa: Id_Programa,
                   
                    createdAt: createdAt,
                    updatedAt: updatedAt


                })
                const data = response.data;
                alert('Ficha creada correctamente')
                hideModal()
            } catch (error){
                console.error("Error registrando ficha", error.response ? error.response.data : error.message);
                alert(error.message)
            }
            
        } else if (textFormButton === 'Actualizar') {
        // Actualizar ficha
        try {
            await apiAxios.put(`/api/Fichas/${Id_Ficha}`, {
                Num_Ficha,
                FecIniLec_Ficha,
                FecFinLec_Ficha,
                FecIniPra_Ficha,
                FecFinPra_Ficha,
                Id_Programa
            });

            alert("Ficha actualizada correctamente");
            reload();
            hideModal();

        } catch (error) {
            console.error(error);
            alert("Error actualizando la ficha");
        }
}

    }
    return (
        <>
      <form
        onSubmit={gestionarForm}
        encType="multipart/form-data"
        className="col-12 col-md-6"
      >
        

        <div className="mb-3">
          <label htmlFor="Num_Ficha" className="form-label">
            Número de Ficha:
          </label>
          <input
            type="text"
            id="Num_Ficha"
            className="form-control"
            value={Num_Ficha}
            onChange={(e) => setNum_Ficha(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="FecIniLec_Ficha" className="form-label">
            Fecha Inicio Lectiva:
          </label>
          <input
            type="date"
            id="FecIniLec_Ficha"
            className="form-control"
            value={FecIniLec_Ficha}
            onChange={(e) => setFecIniLec_Ficha(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="FecFinLec_Ficha" className="form-label">
            Fecha Fin Lectiva:
          </label>
          <input
            type="date"
            id="FecFinLec_Ficha"
            className="form-control"
            value={FecFinLec_Ficha}
            onChange={(e) => setFecFinLec_Ficha(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="FecIniPra_Ficha" className="form-label">
            Fecha Inicio Práctica:
          </label>
          <input
            type="date"
            id="FecIniPra_Ficha"
            className="form-control"
            value={FecIniPra_Ficha}
            onChange={(e) => setFecIniPra_Ficha(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="FecFinPra_Ficha" className="form-label">
            Fecha Fin Práctica:
          </label>
          <input
            type="date"
            id="FecFinPra_Ficha"
            className="form-control"
            value={FecFinPra_Ficha}
            onChange={(e) => setFecFinPra_Ficha(e.target.value)}
          />
        </div>


<div className="mb-3">
  <label htmlFor="Id_Programa" className="form-label">
    Programa:
  </label>

  <select
    id="Id_Programa"
    className="form-control"
    value={Id_Programa}
    onChange={(e) => setId_Programa(e.target.value)}
  >
    <option value="">Seleccione un programa</option>

    {Programa.map((Programas) => (
      <option key={Programas.Id_Programa} value={Programas.Id_Programa}>
        {Programas.Nom_Programa} 
      </option>
    ))}
  </select>
</div>



        <div className="mb-3 text-center">
          <input
            type="submit"
            className="btn btn-primary w-50"
            value={textFormButton}
          />
        </div>
      </form>
    </>
  );
};

export default FichasForm;