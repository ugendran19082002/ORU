import express from "express";
import {
	addDefectSubCategory,
	getDefectSubCategories,
	getDefectSubCategoryById,
	updateDefectSubCategory,
} from "../../../controllers/master/defectSubCategory.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateDefectSubCategory } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getDefectSubCategories,
);
router.post(
	"/add",
	authenticateToken,
	validateDefectSubCategory,
	validateResponse,
	addDefectSubCategory,
);
router.get("/:id", authenticateToken, getDefectSubCategoryById);
router.put(
	"/:id",
	authenticateToken,
	validateDefectSubCategory,
	validateResponse,
	updateDefectSubCategory,
);

export default router;
