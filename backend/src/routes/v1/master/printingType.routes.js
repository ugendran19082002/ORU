import express from "express";
import {
	addPrintingType,
	getPrintingTypeById,
	getPrintingTypes,
	updatePrintingType,
} from "../../../controllers/master/printingType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrintingType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrintingTypes,
);

router.post(
	"/add",
	authenticateToken,
	validatePrintingType,
	validateResponse,
	addPrintingType,
);

router.get("/:id", authenticateToken, getPrintingTypeById);

router.put(
	"/:id",
	authenticateToken,
	validatePrintingType,
	validateResponse,
	updatePrintingType,
);

export default router;
