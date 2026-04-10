import express from "express";
import {
	addIndentingDepartment,
	getIndentingDepartmentById,
	getIndentingDepartments,
	updateIndentingDepartment,
} from "../../../controllers/master/indentingDepartment.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getIndentingDepartments,
);
router.post(
	"/add",
	authenticateToken,
	validateResponse,
	addIndentingDepartment,
);
router.get("/:id", authenticateToken, getIndentingDepartmentById);
router.put(
	"/:id",
	authenticateToken,
	validateResponse,
	updateIndentingDepartment,
);

export default router;
