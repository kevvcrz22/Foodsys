import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import '@fortawesome/fontawesome-free/css/all.min.css';

import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { AuthProvider } from './context/authContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(

<BrowserRouter>
<AuthProvider>
   <App/>
</AuthProvider>
</BrowserRouter>

)