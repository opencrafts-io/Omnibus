// routers/vehicleRoutes.js
import express from "express";
import {
  createVehicleController,
  getAllVehiclesController,
  getVehicleByIdController,
  updateVehicleController,
  deleteVehicleController,
  getVehiclesByTypeController,
  getVehicleByRegistrationController,
  getVehiclesByOperatorController
} from "../Controllers/Vehicle.controller.js";
import { verifyToken } from "../Middleware/jwt_token_verification.js";
import { paginate } from "../Middleware/paginate.js";;

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Public routes (accessible to all authenticated users)

router.get("/type/:type", getVehiclesByTypeController);
router.get("/registration/:registration", getVehicleByRegistrationController);
router.get("/operator", getVehiclesByOperatorController);
router.get("/id/:id", getVehicleByIdController);
router.get("/", paginate, getAllVehiclesController);

// Admin only routes
router.post("/", createVehicleController);
router.put("/:id", updateVehicleController);
router.delete("/:id", deleteVehicleController);

export default router;