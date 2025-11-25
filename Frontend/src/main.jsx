import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import CrudUsuarios from './Usuarios/CrudUsuarios.jsx'
import UsuariosForm from './Usuarios/UsuariosForm.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <CrudUsuarios /> 
  </StrictMode>
)