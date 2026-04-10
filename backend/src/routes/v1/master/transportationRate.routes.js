import express from "express";
import {
	addTransportationRate,
	getTransportationRateById,
	getTransportationRates,
	updateTransportationRate,
} from "../../../controllers/master/transportationRate.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateTransportationRate } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getTransportationRates,
);

router.post(
	"/add",
	authenticateToken,
	validateTransportationRate,
	validateResponse,
	addTransportationRate,
);

router.get("/:id", authenticateToken, getTransportationRateById);

router.put(
	"/:id",
	authenticateToken,
	validateTransportationRate,
	validateResponse,
	updateTransportationRate,
);

export default router;
