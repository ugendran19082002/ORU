import express from "express";
import {
	addDefectCategory,
	getDefectCategories,
	getDefectCategoryById,
	updateDefectCategory,
} from "../../../controllers/master/defectCategory.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateDefectCategory } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getDefectCategories,
);
router.post(
	"/add",
	authenticateToken,
	validateDefectCategory,
	validateResponse,
	addDefectCategory,
);
router.get("/:id", authenticateToken, getDefectCategoryById);
router.put(
	"/:id",
	authenticateToken,
	validateDefectCategory,
	validateResponse,
	updateDefectCategory,
);

export default router;
