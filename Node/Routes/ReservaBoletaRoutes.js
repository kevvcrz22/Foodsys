import express from "express";

import { getAllReservaBoleta, getReservaBoleta, createReservaBoleta, updateReservaBoleta, deleteReservaBoleta} from "../controllers/ReservaBoletaController.js";

const routerReservaBoleta = express.Router();

routerReservaBoleta.get('/', getAllReservaBoleta);
routerReservaBoleta.get('/:id', getReservaBoleta);
routerReservaBoleta.post('/', createReservaBoleta);
routerReservaBoleta.put('/:id', updateReservaBoleta);
routerReservaBoleta.delete('/:id', deleteReservaBoleta);

export default routerReservaBoleta;