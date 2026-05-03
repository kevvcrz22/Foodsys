// ─────────────────────────────────────────────────────────────────────────────
// LoginValidacion.js
// Modulo de validaciones del formulario de inicio de sesion.
// Contiene funciones puras que no dependen de React ni de estado externo.
// Cada funcion recibe un nombre de campo y su valor, y retorna un mensaje
// de error como cadena, o una cadena vacia si el campo es valido.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Valida un campo individual por su nombre ───────────────────────────────
// Recibe el nombre del campo y su valor actual.
// Retorna un mensaje de error si el campo es invalido, o "" si es valido.
const Validar_Campo = (Nom_Campo, Val_Campo) => {
  switch (Nom_Campo) {

    // Tipo de documento: obligatorio seleccionar una opcion
    case 'TipDoc_Usuario':
      return !Val_Campo ? 'Debe seleccionar un tipo de documento' : '';

    // Numero de documento: obligatorio y solo digitos
    case 'NumDoc_Usuario':
      if (!Val_Campo)                   return 'El documento es requerido';
      if (!/^\d+$/.test(Val_Campo))     return 'El documento debe contener solo numeros';
      return '';

    // Contrasena: obligatoria y con minimo de 8 caracteres
    case 'password':
      if (!Val_Campo)                   return 'La contrasena es requerida';
      if (Val_Campo.length < 8)         return 'La contrasena debe tener al menos 8 caracteres';
      return '';

    default:
      return '';
  }
};

// ─── Valida todos los campos del formulario a la vez ─────────────────────────
// Recibe el objeto completo de datos del formulario.
// Retorna un objeto con el mismo esquema de campos, donde cada propiedad
// contiene el mensaje de error correspondiente (o "" si el campo es valido).
const Validar_Formulario = (Dat_Formulario) => ({
  TipDoc_Usuario: Validar_Campo('TipDoc_Usuario', Dat_Formulario.TipDoc_Usuario),
  NumDoc_Usuario: Validar_Campo('NumDoc_Usuario', Dat_Formulario.NumDoc_Usuario),
  password:       Validar_Campo('password',       Dat_Formulario.password),
});

// ─── Verifica si el objeto de errores no tiene ningun error activo ────────────
// Retorna true si el formulario es completamente valido, false si hay errores.
const Formulario_Es_Valido = (Obj_Errores) =>
  !Obj_Errores.TipDoc_Usuario &&
  !Obj_Errores.NumDoc_Usuario &&
  !Obj_Errores.password;

export { Validar_Campo, Validar_Formulario, Formulario_Es_Valido };