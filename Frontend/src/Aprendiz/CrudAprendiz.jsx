import apiNode from "../api/axiosConfig";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

const CrudAprendiz = () => {
  const [aprendices, setAprendices] = useState([]);
  const [filterText, setFilterText] = useState("");

  const columnaTable = [
    { name: 'N°', selector: row => row.Id_Aprendiz},
    { name: 'Tipo De Documento', selector: row => row.TipDoc_Aprendiz },
    { name: 'Numero De Documento', selector: row => row.NumDoc_Aprendiz },
    { name: 'Primer Nombre', selector: row => row.PriNom_Aprendiz },
    { name: 'Segundo Nombre', selector: row => row.SegNom_Aprendiz },
    { name: 'Primer Apellido', selector: row => row.PriApe_Aprendiz },
    { name: 'Segundo Apellido', selector: row => row.SegApe_Aprendiz },
    { name: 'Nombre Completo', selector: row => row.NomCom_Aprendiz },
    { name: 'Genero', selector: row => row.Gen_Aprendiz },
    { name: 'Correo Electronico', selector: row => row.Cor_Aprendiz },
    { name: 'Telefono', selector: row => row.Tel_Aprendiz },
    { name: 'Centro De Convivencia', selector: row => row.CenCon_Aprendiz },
    { name: 'Estado', selector: row => row.Est_Aprendiz },
    { name: 'Subsidio', selector: row => row.Sub_Aprendiz },
    { name: 'Usuario', selector: row => row.Usu_Aprendiz },
    { name: 'Contraseña', selector: row => row.Con_Aprendiz },
    { name: 'Contrato', selector: row => row.contrato?.Tipo_Contrato || 'Sin Contrato' },
    { name: 'Ficha', selector: row => row.Ficha?.Num_Ficha || 'Sin Ficha' },
    { name: 'Fecha de Creacion', seletor: row=> row.CreateData},
    { name: 'Fecha de Actualizacion', selector: row=> row.UpdateData}
  ];

  useEffect(() => {
    getAllAprendiz();
  }, []);

  const getAllAprendiz = async () => {
    const response = await apiNode.get("/api/Aprendiz/");
    setAprendices(response.data);
  };

  const newListAprendiz = aprendices.filter((item) => {
    const textToSearch = filterText.toLowerCase();
    const nombre = item.NomCom_Aprendiz?.toLowerCase() || "";
    const ficha = item.Ficha?.Num_Ficha?.toString().toLowerCase() || "";
    return nombre.includes(textToSearch) || ficha.includes(textToSearch);
  });

  return (
    <>
      <div className="Container">
        <div className="col-4">
          <input
            className="form-control"
            placeholder="Buscar por nombre o ficha..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <DataTable
          title="Aprendices"
          columns={columnaTable}
          data={newListAprendiz}
          keyField="Id_Aprendiz"
          pagination
          highlightOnHover
          striped
        />
      </div>
    </>
  );
};

export default CrudAprendiz;
