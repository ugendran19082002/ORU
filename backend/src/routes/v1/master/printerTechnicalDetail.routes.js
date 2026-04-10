import express from "express";
import {
	addPrinterTechnicalDetail,
	getPrinterTechnicalDetailById,
	getPrinterTechnicalDetails,
	updatePrinterTechnicalDetail,
} from "../../../controllers/master/printerTechnicalDetail.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrinterTechnicalDetail } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrinterTechnicalDetails,
);
router.post(
	"/add",
	authenticateToken,
	validatePrinterTechnicalDetail,
	validateResponse,
	addPrinterTechnicalDetail,
);
router.get(
	"/:id",
	authenticateToken,
	getPrinterTechnicalDetailById,
);
router.put(
	"/:id",
	authenticateToken,
	validatePrinterTechnicalDetail,
	validateResponse,
	updatePrinterTechnicalDetail,
);

export default router;
