// Node/Controllers/ConfigHorariosController.js
// Controlador para la gestion de configuracion de raciones y horarios de Foodsys
// Comentarios didacticos sin tildes ni emojis para aprendices de primer semestre.

import ConfigHorariosModel from "../Models/ConfigHorariosModel.js";

export const getConfigRaciones = async (req, res) => {
  try {
    const configuraciones = await ConfigHorariosModel.findAll({
      order: [["Id_Config", "ASC"]]
    });
    res.status(200).json(configuraciones);
  } catch (error) {
    console.error("ERROR AL OBTENER CONFIG RACIONES:", error);
    res.status(500).json({ message: "Error al obtener la configuracion de raciones" });
  }
};

export const updateConfigRacion = async (req, res) => {
  try {
    const { id } = req.params;
    const configExistente = await ConfigHorariosModel.findByPk(id);
    if (!configExistente) {
      return res.status(404).json({ message: "Configuracion de racion no encontrada" });
    }

    const {
      Racion_Activa,
      Hora_Inicio_Servicio,
      Hora_Fin_Servicio,
      Hora_Inicio_Reserva_Dia_Anterior,
      Hora_Limite_Reserva_Normal,
      Hora_Limite_Cancelacion,
      Hora_Limite_Excepcional,
      Hora_Limite_Cesion,
      Fecha_Excepcion_Temporal,
      Hora_Limite_Excepcion_Temporal
    } = req.body;

    await configExistente.update({
      Racion_Activa: Racion_Activa !== undefined ? Boolean(Racion_Activa) : configExistente.Racion_Activa,
      Hora_Inicio_Servicio: Hora_Inicio_Servicio || configExistente.Hora_Inicio_Servicio,
      Hora_Fin_Servicio: Hora_Fin_Servicio || configExistente.Hora_Fin_Servicio,
      Hora_Inicio_Reserva_Dia_Anterior: Hora_Inicio_Reserva_Dia_Anterior || configExistente.Hora_Inicio_Reserva_Dia_Anterior,
      Hora_Limite_Reserva_Normal: Hora_Limite_Reserva_Normal || configExistente.Hora_Limite_Reserva_Normal,
      Hora_Limite_Cancelacion: Hora_Limite_Cancelacion || configExistente.Hora_Limite_Cancelacion,
      Hora_Limite_Excepcional: Hora_Limite_Excepcional || configExistente.Hora_Limite_Excepcional,
      Hora_Limite_Cesion: Hora_Limite_Cesion || configExistente.Hora_Limite_Cesion,
      Fecha_Excepcion_Temporal: Fecha_Excepcion_Temporal || configExistente.Fecha_Excepcion_Temporal,
      Hora_Limite_Excepcion_Temporal: Hora_Limite_Excepcion_Temporal || configExistente.Hora_Limite_Excepcion_Temporal
    });

    res.status(200).json({
      message: `Configuracion de ${configExistente.Tip_Racion} actualizada correctamente`,
      configuracion: configExistente
    });
  } catch (error) {
    console.error("ERROR AL ACTUALIZAR CONFIG RACION:", error);
    res.status(500).json({ message: "Error al actualizar la configuracion de la racion" });
  }
};

export const toggleRacion = async (req, res) => {
  try {
    const { id } = req.params;
    const configExistente = await ConfigHorariosModel.findByPk(id);
    if (!configExistente) {
      return res.status(404).json({ message: "Configuracion de racion no encontrada" });
    }

    const nuevoEstado = !configExistente.Racion_Activa;
    await configExistente.update({ Racion_Activa: nuevoEstado });

    const mensajeEstado = nuevoEstado ? "habilitado" : "deshabilitado temporalmente";
    res.status(200).json({
      message: `El servicio de ${configExistente.Tip_Racion} ha sido ${mensajeEstado}`,
      Racion_Activa: nuevoEstado,
      configuracion: configExistente
    });
  } catch (error) {
    console.error("ERROR AL CAMBIAR ESTADO DE RACION:", error);
    res.status(500).json({ message: "Error al modificar el estado de la racion" });
  }
};
