import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'


import CrudPrograma from './Programa/CrudPrograma.jsx'
import ProgramaForm from './Programa/ProgramaForm.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <CrudAprendiz/> */}
    <CrudPrograma/>
  </StrictMode>
)
