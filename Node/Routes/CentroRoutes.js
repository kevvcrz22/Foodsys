import express from "express";
import { getAllCentros, getCentro, createCentro, updatecentro, deleteCentro } from "../controllers/CentroController.js";

const routerCentro = express.Router();

routerCentro.get('/', getAllCentros);
routerCentro.get('/:id', getCentro);
routerCentro.post('/', createCentro);
routerCentro.put('/:id', updatecentro);
routerCentro.delete('/:id', deleteCentro);

export default routerCentro;