import express from "express";
import {
	addDepartment,
	getDepartmentById,
	getDepartments,
	updateDepartment,
} from "../../../controllers/master/department.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateDepartment } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getDepartments,
);
router.post(
	"/add",
	authenticateToken,
	validateDepartment,
	validateResponse,
	addDepartment,
);
router.get("/:id", authenticateToken, getDepartmentById);
router.put(
	"/:id",
	authenticateToken,
	validateDepartment,
	validateResponse,
	updateDepartment,
);

export default router;
