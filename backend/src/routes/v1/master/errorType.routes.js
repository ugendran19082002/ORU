import express from "express";
import {
	addErrorType,
	getErrorTypeById,
	getErrorTypes,
	updateErrorType,
} from "../../../controllers/master/errorType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateErrorType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getErrorTypes,
);
router.post(
	"/add",
	authenticateToken,
	validateErrorType,
	validateResponse,
	addErrorType,
);
router.get("/:id", authenticateToken, getErrorTypeById);
router.put(
	"/:id",
	authenticateToken,
	validateErrorType,
	validateResponse,
	updateErrorType,
);

export default router;
