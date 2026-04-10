import express from "express";
import {
	addMachineCategory,
	getMachineCategories,
	getMachineCategoryById,
	updateMachineCategory,
} from "../../../controllers/master/machineCategory.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getMachineCategories,
);
router.post(
	"/add",
	authenticateToken,
	validateResponse,
	addMachineCategory,
);
router.get("/:id", authenticateToken, getMachineCategoryById);
router.put(
	"/:id",
	authenticateToken,
	validateResponse,
	updateMachineCategory,
);

export default router;
