import express from "express";
import {
	addPrinterCommercialDetail,
	getPrinterCommercialDetailById,
	getPrinterCommercialDetails,
	updatePrinterCommercialDetail,
} from "../../../controllers/master/printerCommercialDetail.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePrinterCommercialDetail } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPrinterCommercialDetails,
);
router.post(
	"/add",
	authenticateToken,
	validatePrinterCommercialDetail,
	validateResponse,
	addPrinterCommercialDetail,
);
router.get(
	"/:id",
	authenticateToken,
	getPrinterCommercialDetailById,
);
router.put(
	"/:id",
	authenticateToken,
	validatePrinterCommercialDetail,
	validateResponse,
	updatePrinterCommercialDetail,
);

export default router;
