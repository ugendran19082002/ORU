import express from "express";
import {
	addAcademicYear,
	getAcademicYearById,
	getAcademicYears,
	updateAcademicYear,
} from "../../../controllers/master/academicYear.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateAcademicYear } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getAcademicYears,
);
router.post(
	"/add",
	authenticateToken,
	validateAcademicYear,
	validateResponse,
	addAcademicYear,
);
router.get("/:id", authenticateToken, getAcademicYearById);
router.put(
	"/:id",
	authenticateToken,
	validateAcademicYear,
	validateResponse,
	updateAcademicYear,
);

export default router;
