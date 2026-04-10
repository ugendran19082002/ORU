import express from "express";
import {
	addPaperType,
	getPaperTypeById,
	getPaperTypes,
	updatePaperType,
} from "../../../controllers/master/paperType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validatePaperType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getPaperTypes,
);
router.post(
	"/add",
	authenticateToken,
	validatePaperType,
	validateResponse,
	addPaperType,
);
router.get("/:id", authenticateToken, getPaperTypeById);
router.put(
	"/:id",
	authenticateToken,
	validatePaperType,
	validateResponse,
	updatePaperType,
);

export default router;
