import express from "express";
import {
	addPrinterBank,
	getPrinterBankById,
	getPrinterBanks,
	updatePrinterBank,
} from "../../../controllers/master/printerBank.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrinterBank } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrinterBanks,
);
router.post(
	"/add",
	authenticateToken,
	validatePrinterBank,
	validateResponse,
	addPrinterBank,
);
router.get("/:id", authenticateToken, getPrinterBankById);
router.put(
	"/:id",
	authenticateToken,
	validatePrinterBank,
	validateResponse,
	updatePrinterBank,
);

export default router;
