import express from "express";
import {
	addVehicleType,
	getVehicleTypeById,
	getVehicleTypes,
	updateVehicleType,
} from "../../../controllers/master/vehicleType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateVehicleType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getVehicleTypes,
);

router.post(
	"/add",
	authenticateToken,
	validateVehicleType,
	validateResponse,
	addVehicleType,
);

router.get("/:id", authenticateToken, getVehicleTypeById);

router.put(
	"/:id",
	authenticateToken,
	validateVehicleType,
	validateResponse,
	updateVehicleType,
);

export default router;
