import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css'
import CrudAprendiz from './Aprendiz/CrudAprendiz.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <CrudAprendiz/>
  </StrictMode>
)
