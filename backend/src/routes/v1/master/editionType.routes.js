import express from "express";
import {
	addEditionType,
	getEditionTypeById,
	getEditionTypes,
	updateEditionType,
} from "../../../controllers/master/editionType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateEditionType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getEditionTypes,
);
router.post(
	"/add",
	authenticateToken,
	validateEditionType,
	validateResponse,
	addEditionType,
);
router.get("/:id", authenticateToken, getEditionTypeById);
router.put(
	"/:id",
	authenticateToken,
	validateEditionType,
	validateResponse,
	updateEditionType,
);

export default router;
