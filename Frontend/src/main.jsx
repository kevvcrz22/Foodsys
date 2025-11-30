import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'


import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import CrudUsuarios from './Usuarios/CrudUsuarios.jsx'
import UsuariosForm from './Usuarios/UsuariosForm.jsx'
import CrudFichas from './Fichas/CrudFichas.jsx'
import FichasForm from './Fichas/FichasForm.jsx'
import CrudPrograma from './Programas/CrudPrograma.jsx'
import ProgramaForm from './Programas/ProgramaForm.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App/>
    <CrudUsuarios/>
    <CrudFichas/>
    <CrudPrograma/>
    <CrudReservas/>
  </StrictMode>
);