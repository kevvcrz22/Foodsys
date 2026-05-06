import ReservasServices from "../Services/ReservasServices.js";

// Retorna los tipos de comida permitidos para el usuario logueado segun su rol
// El frontend usa esto para saber que opciones mostrar en el select de Tip_Reserva
// Los roles llegan del token JWT que ya proceso authMiddleware en req.user.roles
export const obtenerTiposPermitidos = (req, res) => {
  try {
    // Se obtienen los roles del usuario desde el token decodificado por authMiddleware
    const rolesUsuario = req.user.roles || [];

    // Se llama al metodo del service que aplica la logica de roles:
    // Interno (Aprendiz Interno o Pasante Interno) -> Desayuno, Almuerzo, Cena
    // Externo (Aprendiz Externo o Pasante Externo) -> solo Almuerzo
    // Cualquier otro rol -> array vacio, no puede reservar
    const tiposPermitidos = ReservasServices.ObtenerRolesPermitidos(rolesUsuario);

    // Si el array esta vacio el usuario no tiene rol valido para reservar
    if (tiposPermitidos.length === 0) {
      return res.status(403).json({
        message: "Tu rol no tiene permiso para realizar reservas"
      });
    }

    // Se retorna el array con los tipos permitidos para que el frontend
    // construya el select mostrando solo las opciones validas
    return res.status(200).json({ tiposPermitidos });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Retorna los platos disponibles para una fecha y tipo de comida dados
// El cliente llama a este endpoint despues de seleccionar el tipo de comida en el formulario
export const obtenerPlatosDelMenu = async (req, res) => {
  try {
    // La fecha y el tipo de comida llegan como parametros en la URL
    const { fechaReserva, tipComida } = req.params;

    if (!fechaReserva || !tipComida) {
      return res.status(400).json({ message: "La fecha y el tipo de comida son obligatorios" });
    }

    // Se normaliza el tipo de comida a formato Pascal (primera letra mayuscula)
    const TipoNormalizado = tipComida.charAt(0).toUpperCase() + tipComida.slice(1).toLowerCase();

    const platos = await ReservasServices.obtenerPlatosDelMenu(fechaReserva, TipoNormalizado);

    return res.status(200).json(platos);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Genera una reserva para la fecha indicada segun el tipo de comida y plato elegido
export const generarAlimentoTomorrow = async (req, res) => {
  try {
    // El id y roles vienen del token JWT decodificado por authMiddleware
    const Id_Usuario = req.user.id;
    const rolesUsuario = req.user.roles || [];

    // Se eliminan espacios en blanco por si el cliente envia datos con padding
    const Tip_Reserva = req.body.Tip_Reserva?.trim();
    const { platoElegido, fechaReserva } = req.body;

    if (!Tip_Reserva) {
      return res.status(400).json({ message: "El tipo de comida es obligatorio" });
    }

    if (!platoElegido) {
      return res.status(400).json({ message: "El plato elegido es obligatorio" });
    }

    if (!fechaReserva) {
      return res.status(400).json({ message: "La fecha de reserva es obligatoria" });
    }

    const result = await ReservasServices.generarReservaPass(
      Id_Usuario,
      rolesUsuario,
      Tip_Reserva,
      platoElegido,
      fechaReserva
    );

    return res.status(201).json(result);
  } catch (err) {
    console.log("ERROR:", err.message);
    return res.status(400).json({ message: err.message });
  }
};