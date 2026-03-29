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
        } else {
            setId_Ficha('');
            setNum_Ficha('');
            setFecIniLec_Ficha('');
            setFecFinLec_Ficha('');
            setFecIniPra_Ficha('');
            setFecFinPra_Ficha('');
            setId_Programa('');
            setTextFormButton("Enviar");
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
                reload()
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
            <form onSubmit={gestionarForm} className="space-y-4">
                
                <div>
                    <label htmlFor="Num_Ficha" className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Ficha
                    </label>
                    <input
                        type="text"
                        id="Num_Ficha"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={Num_Ficha}
                        onChange={(e) => setNum_Ficha(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="FecIniLec_Ficha" className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio Lectiva
                    </label>
                    <input
                        type="date"
                        id="FecIniLec_Ficha"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={FecIniLec_Ficha}
                        onChange={(e) => setFecIniLec_Ficha(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="FecFinLec_Ficha" className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin Lectiva
                    </label>
                    <input
                        type="date"
                        id="FecFinLec_Ficha"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={FecFinLec_Ficha}
                        onChange={(e) => setFecFinLec_Ficha(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="FecIniPra_Ficha" className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio Práctica
                    </label>
                    <input
                        type="date"
                        id="FecIniPra_Ficha"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={FecIniPra_Ficha}
                        onChange={(e) => setFecIniPra_Ficha(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="FecFinPra_Ficha" className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin Práctica
                    </label>
                    <input
                        type="date"
                        id="FecFinPra_Ficha"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={FecFinPra_Ficha}
                        onChange={(e) => setFecFinPra_Ficha(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="Id_Programa" className="block text-sm font-medium text-gray-700 mb-2">
                        Programa
                    </label>
                    <select
                        id="Id_Programa"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

export default FichasForm;