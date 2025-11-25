import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'


import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
import CrudFichas from './Fichas/CrudFichas.jsx'
import FichasForm from './Fichas/FichasForm.jsx'
import CrudPrograma from './Programa/CrudPrograma.jsx'
import ProgramaForm from './Programa/ProgramaForm.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <CrudFichas/>
    <CrudPrograma/>
    
  </React.StrictMode>,
)
