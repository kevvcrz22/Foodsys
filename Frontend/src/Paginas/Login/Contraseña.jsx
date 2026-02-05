import React, { useState } from 'react';
import './Login.css';
import logo from './Img/logo.png';

const RecoverPassword = () => {

  const [formData, setFormData] = useState({
    tipoDocumento: '',
    documento: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};

    if (!formData.tipoDocumento)
      errs.tipoDocumento = 'Seleccione el tipo de documento';

    if (!formData.documento)
      errs.documento = 'El documento es requerido';
    else if (!/^\d+$/.test(formData.documento))
      errs.documento = 'Solo números';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="foodsys-app">
      <header className="topbar">
        <div className="inner">
          <img src={logo} className="logo" alt="Foodsys" />
          <span className="brand-name">Foodsys</span>
        </div>
      </header>

      <main className="wrap">
        <aside className="card">
          <h2>Recuperar contraseña</h2>
          <p className="sub">Ingrese sus datos para continuar</p>

          {!success ? (
            <form onSubmit={handleSubmit} noValidate>

              <div className="field">
                <label>Tipo de documento</label>
                <select
                  value={formData.tipoDocumento}
                  onChange={e => setFormData({ ...formData, tipoDocumento: e.target.value })}
                >
                  <option value="">Seleccione</option>
                  <option value="cc">Cédula de ciudadanía</option>
                  <option value="ti">Tarjeta identidad</option>
                  <option value="ce">Cédula de extranjería</option>
                </select>
                {errors.tipoDocumento && (
                  <div className="error-message">{errors.tipoDocumento}</div>
                )}
              </div>

              <div className="field">
                <label>Número de documento</label>
                <input
                  type="text"
                  value={formData.documento}
                  onChange={e => setFormData({ ...formData, documento: e.target.value })}
                />
                {errors.documento && (
                  <div className="error-message">{errors.documento}</div>
                )}
              </div>

              <div className="actions">
                <button className="btn btn-primary" type="submit">
                  {loading ? 'Enviando...' : 'Recuperar contraseña'}
                </button>
                <a href="/" className="btn btn-secondary">
                  Volver al login
                </a>
              </div>

            </form>
          ) : (
            <div className="success">
              <i className="fas fa-check-circle"></i>
              <p>
                Si los datos son correctos, recibirás instrucciones para
                restablecer tu contraseña.
              </p>
              <a href="/" className="btn btn-primary">Volver</a>
            </div>
          )}

        </aside>
      </main>
    </div>
  );
};

export default RecoverPassword;
