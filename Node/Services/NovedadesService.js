// Services/NovedadesService.js
// Servicio que maneja la logica de novedades
// (reservas excepcionales) del sistema FoodSys

import { Op } from "sequelize";
import ReservaModel from "../Models/ReservasModel.js";
import UsuariosModel from "../Models/UsuariosModel.js";

class NovedadesService {

  // Calcula la fecha del dia de referencia
  // Antes de las 18h es hoy, despues es manana
  Obtener_Fecha_Referencia() {
    const Ahora = new Date();
    if (Ahora.getHours() >= 18) {
      Ahora.setDate(Ahora.getDate() + 1);
    }
    const Anio = Ahora.getFullYear();
    const Mes = String(Ahora.getMonth() + 1).padStart(2, "0");
    const Dia = String(Ahora.getDate()).padStart(2, "0");
    return `${Anio}-${Mes}-${Dia}`;
  }

  // Retorna las reservas excepcionales del dia actual
  async Obtener_Excepcionales_Hoy() {
    const Fecha = this.Obtener_Fecha_Referencia();
    const Reservas = await ReservaModel.findAll({
      where: {
        Res_Excepcional: "Si",
        Fec_Reserva: Fecha,
      },
      include: [{
        model: UsuariosModel,
        attributes: [
          "Id_Usuario", "Nom_Usuario",
          "Ape_Usuario", "NumDoc_Usuario",
        ],
      }],
      order: [["createdAt", "DESC"]],
    });
    return Reservas;
  }

  // Retorna los tipos de comida permitidos por rol
  Obtener_Tipos_Por_Rol(Roles_Usuario) {
    const Es_Interno = Roles_Usuario.some(
      (R) => R === "Aprendiz Interno" || R === "Pasante"
    );
    if (Es_Interno) return ["Desayuno", "Almuerzo", "Cena"];
    const Es_Externo = Roles_Usuario.some(
      (R) => R === "Aprendiz Externo"
    );
    if (Es_Externo) return ["Almuerzo"];
    return ["Desayuno", "Almuerzo", "Cena"];
  }
}

export default new NovedadesService();
