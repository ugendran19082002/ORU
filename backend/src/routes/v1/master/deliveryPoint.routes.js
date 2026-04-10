import express from "express";
import {
	addDeliveryPoint,
	getDeliveryPointById,
	getDeliveryPoints,
	updateDeliveryPoint,
} from "../../../controllers/master/deliveryPoint.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateDeliveryPoint } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getDeliveryPoints,
);
router.post(
	"/add",
	authenticateToken,
	validateDeliveryPoint,
	validateResponse,
	addDeliveryPoint,
);
router.get("/:id", authenticateToken, getDeliveryPointById);
router.put(
	"/:id",
	authenticateToken,
	validateDeliveryPoint,
	validateResponse,
	updateDeliveryPoint,
);

export default router;
