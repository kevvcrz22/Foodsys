import express from "express";
import { getAllCiudades, getCiudad, createCiudad, updateCiudad, deleteCiudad } from "../Controllers/CiudadController.js";

const routerCiudad = express.Router();

routerCiudad.get('/', getAllCiudades);
routerCiudad.get('/:id', getCiudad);
routerCiudad.post('/', createCiudad);
routerCiudad.put('/:id', updateCiudad);
routerCiudad.delete('/:id', deleteCiudad);

export default routerCiudad;