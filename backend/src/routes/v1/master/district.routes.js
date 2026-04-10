import express from "express";
import {
	addDistrict,
	getDistrictById,
	getDistricts,
	updateDistrict,
} from "../../../controllers/master/district.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateDistrict } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getDistricts,
);
router.post(
	"/add",
	authenticateToken,
	validateDistrict,
	validateResponse,
	addDistrict,
);
router.get("/:id", authenticateToken, getDistrictById);
router.put(
	"/:id",
	authenticateToken,
	validateDistrict,
	validateResponse,
	updateDistrict,
);

export default router;
