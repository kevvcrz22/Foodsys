import apiAxios from "../api/axiosConfig";
import { useState, useEffect} from "react";
import DataTable from 'react-data-table-component'
import FichasForm from "./FichasForm";



const CrudFichas =() => {
    const [Fichas, setFichas]= useState([])  
    const [filterText, setFilterText]= useState("")
    const [selectedFicha, setSelectedFicha] = useState(null);
    const [isEdit, setIsEdit] = useState(false);



    const columnsTable = [ 
        {name: 'Id Ficha', selector: row => row.Id_Ficha},
        {name: 'Numero de Ficha', selector: row => row.Num_Ficha},
        {name: 'Inicio Etapa Lectiva', selector: row => row.FecIniLec_Ficha},
        {name: 'Fin Etapa Lectiva', selector: row => row.FecFinLec_Ficha},
        {name: 'Inicio Etapa Practica', selector: row => row.FecIniPra_Ficha},
        {name: 'Fin Etapa Practica', selector: row => row.FecFinPra_Ficha},
        {name: 'Programa', selector: row => row.programa?.Nom_Programa },

        {name: 'Fecha de Creacion', selector: row => new Date(row.createdAt).toLocaleDateString()},
        {name: 'Fecha de Actualizacion', selector: row => new Date(row.updatedAt).toLocaleDateString()},
        {name:'Acciones', selector: row => (
    <button 
      className="btn btn-sm bg-info"
      onClick={() => editFicha(row)}
    >
        <i className="fa-solid fa-pencil"></i>
    </button>
)}


    ]
    useEffect(()=>{
        getAllFichas()
    },[])
    const getAllFichas = async () => {
    try {
        const response = await apiAxios.get('/api/Fichas/')
        console.log("Datos recibidos del backend:", response.data)
        setFichas(response.data)
    } catch (error) {
        console.error("Error al obtener las fichas:", error)
    }
    }

    const editFicha = (row) => {
    setSelectedFicha(row);
    setIsEdit(true);
    document.getElementById("openModalFicha").click();
};
    const newListFichas = Fichas.filter(Ficha => {
    const textToSearch = filterText.toLowerCase();

    const Num_Ficha = String(Ficha.Num_Ficha || "").toLowerCase();

    const Nom_Programa = String(
        Ficha.Programa?.Nom_Programa || Ficha.Programa?.Nom_programa || ""
    ).toLowerCase();

    return (
        Num_Ficha.includes(textToSearch) ||
        Nom_Programa.includes(textToSearch)
    );
});

    const hideModal =() =>{
        document.getElementById('closeModal').click()
    }
    return(
        <>
        <div className="container mt-5">

          <div className="row d-flex justify-content-between">
            <div className= "col-4">
                <input className="form-control" value={filterText} onChange={(e)=> setFilterText(e.target.value)}/> 
            </div>
            <div className="col-2">
                <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#ModalFichas">
                    Nuevo
                </button>
                <button 
                    type="button" 
                    className="d-none" 
                    id="openModalFicha" 
                    data-bs-toggle="modal" 
                    data-bs-target="#ModalFichas">
                </button>

            </div>
            </div>
               
            <DataTable
                title="Fichas"
                columns={columnsTable}
                data={newListFichas}
                keyField="Id_Ficha"
                pagination
                highlightOnHover
                striped
            />

{/* <!-- Modal --> */}
<div className="modal fade" id="ModalFichas" tabIndex="-1" aria-labelledby="ModalFichasLabel" aria-hidden="true">
  <div className="modal-dialog">
    <div className="modal-content">
      <div className="modal-header">
        <h1 className="modal-title fs-5" id="ModalFichasLabel"> {isEdit ? "Editar Ficha" : "Agregar Ficha"}</h1>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModal"></button>
      </div>
      <div className="modal-body">
        <FichasForm 
    hideModal={hideModal}
    selectedFicha={selectedFicha}
    isEdit={isEdit}
    reload={getAllFichas}
/>

      </div>
    </div>
  </div>
</div>


    </div>
        
        </>
    )
}
export default CrudFichas