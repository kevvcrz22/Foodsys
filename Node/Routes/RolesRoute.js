import Express from "express";
import {
  getAllRoles,
  getRoles,
  createRoles,
  updateRoles,
  deleteRoles
} from "../Controllers/RolesController.js";

const router = Express.Router();

router.get("/", getAllRoles);
router.get("/:id", getRoles); 
router.post("/", createRoles);
router.put("/:id", updateRoles);   
router.delete("/:id", deleteRoles); 

export default router;