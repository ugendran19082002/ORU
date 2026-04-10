import express from "express";
import {
	addBindingType,
	getBindingTypeById,
	getBindingTypes,
	updateBindingType,
} from "../../../controllers/master/bindingType.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateBindingType } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getBindingTypes,
);
router.post(
	"/add",
	authenticateToken,
	validateBindingType,
	validateResponse,
	addBindingType,
);
router.get("/:id", authenticateToken, getBindingTypeById);
router.put(
	"/:id",
	authenticateToken,
	validateBindingType,
	validateResponse,
	updateBindingType,
);

export default router;
