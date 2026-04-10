import express from "express";
import {
	addErrorCategory,
	getErrorCategories,
	getErrorCategoryById,
	updateErrorCategory,
} from "../../../controllers/master/errorCategory.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateErrorCategory } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getErrorCategories,
);
router.post(
	"/add",
	authenticateToken,
	validateErrorCategory,
	validateResponse,
	addErrorCategory,
);
router.get("/:id", authenticateToken, getErrorCategoryById);
router.put(
	"/:id",
	authenticateToken,
	validateErrorCategory,
	validateResponse,
	updateErrorCategory,
);

export default router;
