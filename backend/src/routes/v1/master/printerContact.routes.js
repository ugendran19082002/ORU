import express from "express";
import {
	addPrinterContact,
	getPrinterContactById,
	getPrinterContacts,
	updatePrinterContact,
} from "../../../controllers/master/printerContact.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrinterContact } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrinterContacts,
);
router.post(
	"/add",
	authenticateToken,
	validatePrinterContact,
	validateResponse,
	addPrinterContact,
);
router.get("/:id", authenticateToken, getPrinterContactById);
router.put(
	"/:id",
	authenticateToken,
	validatePrinterContact,
	validateResponse,
	updatePrinterContact,
);

export default router;
