import express from "express";
import {
	addTransportationType,
	getTransportationTypeById,
	getTransportationTypes,
	updateTransportationType,
} from "../../../controllers/master/transportationType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateTransportationType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getTransportationTypes,
);

router.post(
	"/add",
	authenticateToken,
	validateTransportationType,
	validateResponse,
	addTransportationType,
);

router.get("/:id", authenticateToken, getTransportationTypeById);

router.put(
	"/:id",
	authenticateToken,
	validateTransportationType,
	validateResponse,
	updateTransportationType,
);

export default router;
