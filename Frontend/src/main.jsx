import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import '@fortawesome/fontawesome-free/css/all.min.css';

import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { AuthProvider } from './context/authContext.jsx';

import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";

ReactDOM.createRoot(document.getElementById('root')).render(

  <StyleSheetManager shouldForwardProp={isPropValid}>
    <BrowserRouter>
      <AuthProvider>
        <App/>
      </AuthProvider>
    </BrowserRouter>
  </StyleSheetManager>

)