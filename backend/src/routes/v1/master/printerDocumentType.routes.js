import express from "express";
import {
	addPrinterDocumentType,
	getPrinterDocumentTypeById,
	getPrinterDocumentTypes,
	updatePrinterDocumentType,
} from "../../../controllers/master/printerDocumentType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrinterDocumentType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrinterDocumentTypes,
);
router.post(
	"/add",
	authenticateToken,
	validatePrinterDocumentType,
	validateResponse,
	addPrinterDocumentType,
);
router.get("/:id", authenticateToken, getPrinterDocumentTypeById);
router.put(
	"/:id",
	authenticateToken,
	validatePrinterDocumentType,
	validateResponse,
	updatePrinterDocumentType,
);

export default router;
