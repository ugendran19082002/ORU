import express from "express";
import {
	addPrinterType,
	getPrinterTypeById,
	getPrinterTypes,
	updatePrinterType,
} from "../../../controllers/master/printerType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrinterType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrinterTypes,
);
router.post(
	"/add",
	authenticateToken,
	validatePrinterType,
	validateResponse,
	addPrinterType,
);
router.get("/:id", authenticateToken, getPrinterTypeById);
router.put(
	"/:id",
	authenticateToken,
	validatePrinterType,
	validateResponse,
	updatePrinterType,
);

export default router;
