import express from "express";
import {
	addPrinter,
	getPrinterById,
	getPrinters,
	updatePrinter,
} from "../../../controllers/master/printer.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrinter } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrinters,
);
router.post(
	"/add",
	authenticateToken,
	validatePrinter,
	validateResponse,
	addPrinter,
);
router.get("/:id", authenticateToken, getPrinterById);
router.put(
	"/:id",
	authenticateToken,
	validatePrinter,
	validateResponse,
	updatePrinter,
);

export default router;
