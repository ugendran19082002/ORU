import express from "express";
import {
	addPrintingFlow,
	getPrintingFlowById,
	getPrintingFlows,
	updatePrintingFlow,
} from "../../../controllers/master/printingFlow.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrintingFlow } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrintingFlows,
);

router.post(
	"/add",
	authenticateToken,
	validatePrintingFlow,
	validateResponse,
	addPrintingFlow,
);

router.get("/:id", authenticateToken, getPrintingFlowById);

router.put(
	"/:id",
	authenticateToken,
	validatePrintingFlow,
	validateResponse,
	updatePrintingFlow,
);

export default router;
