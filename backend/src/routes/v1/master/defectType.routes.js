import express from "express";
import {
	addDefectType,
	getDefectTypeById,
	getDefectTypes,
	updateDefectType,
} from "../../../controllers/master/defectType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateDefectType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getDefectTypes,
);
router.post(
	"/add",
	authenticateToken,
	validateDefectType,
	validateResponse,
	addDefectType,
);
router.get("/:id", authenticateToken, getDefectTypeById);
router.put(
	"/:id",
	authenticateToken,
	validateDefectType,
	validateResponse,
	updateDefectType,
);

export default router;
