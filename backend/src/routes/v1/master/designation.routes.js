import express from "express";
import {
	addDesignation,
	getDesignationById,
	getDesignations,
	updateDesignation,
} from "../../../controllers/master/designation.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateDesignation } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getDesignations,
);
router.post(
	"/add",
	authenticateToken,
	validateDesignation,
	validateResponse,
	addDesignation,
);
router.get("/:id", authenticateToken, getDesignationById);
router.put(
	"/:id",
	authenticateToken,
	validateDesignation,
	validateResponse,
	updateDesignation,
);

export default router;
