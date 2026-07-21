// ─────────────────────────────────────────────────────────────────────────────
// LoginValidacion.jsx
// Módulo de validaciones del formulario de inicio de sesión.
// ─────────────────────────────────────────────────────────────────────────────

const Validar_Campo = (Nom_Campo, Val_Campo) => {
  switch (Nom_Campo) {
    case 'TipDoc_Usuario':
      return !Val_Campo ? 'Debe seleccionar un tipo de documento' : '';

    case 'NumDoc_Usuario':
      if (!Val_Campo) return 'El documento es requerido';
      if (!/^\d+$/.test(Val_Campo)) return 'El documento debe contener solo números';
      return '';

    case 'contrasena':
      if (!Val_Campo) return 'La contraseña es requerida';
      if (Val_Campo.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      return '';

    default:
      return '';
  }
};

const Validar_Formulario = (Dat_Formulario) => ({
  TipDoc_Usuario: Validar_Campo('TipDoc_Usuario', Dat_Formulario.TipDoc_Usuario),
  NumDoc_Usuario: Validar_Campo('NumDoc_Usuario', Dat_Formulario.NumDoc_Usuario),
  contrasena:     Validar_Campo('contrasena',     Dat_Formulario.contrasena),
});

const Formulario_Es_Valido = (Obj_Errores) =>
  !Obj_Errores.TipDoc_Usuario &&
  !Obj_Errores.NumDoc_Usuario &&
  !Obj_Errores.contrasena;

export { Validar_Campo, Validar_Formulario, Formulario_Es_Valido };