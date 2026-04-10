import express from "express";
import {
	addErrorSubCategory,
	getErrorSubCategories,
	getErrorSubCategoryById,
	updateErrorSubCategory,
} from "../../../controllers/master/errorSubCategory.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateErrorSubCategory } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getErrorSubCategories,
);
router.post(
	"/add",
	authenticateToken,
	validateErrorSubCategory,
	validateResponse,
	addErrorSubCategory,
);
router.get("/:id", authenticateToken, getErrorSubCategoryById);
router.put(
	"/:id",
	authenticateToken,
	validateErrorSubCategory,
	validateResponse,
	updateErrorSubCategory,
);

export default router;
