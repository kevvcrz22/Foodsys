import express from "express";

import { getAllArea, getArea, createArea, updateArea, deleteArea} from "../controllers/areaController.js";

const routerArea = express.Router();

routerArea.get('/', getAllArea);
routerArea.get('/:id', getArea);
routerArea.post('/', createArea);
routerArea.put('/:id', updateArea);
routerArea.delete('/:id', deleteArea);

export default routerArea;