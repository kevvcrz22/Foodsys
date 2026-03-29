import express from "express";
import { 
  getAllMenus, 
  getMenu, 
  createMenu, 
  updateMenu, 
  deleteMenu 
} from "../Controllers/MenusController.js";

const router = express.Router();

router.get('/', getAllMenus);
router.get('/:id', getMenu);
router.post('/', createMenu);
router.put('/:id', updateMenu);
router.delete('/:id', deleteMenu);

export default router;