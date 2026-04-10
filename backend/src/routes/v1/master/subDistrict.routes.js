import express from "express";
import {
	addSubDistrict,
	getSubDistrictById,
	getSubDistricts,
	updateSubDistrict,
} from "../../../controllers/master/subDistrict.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateSubDistrict } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getSubDistricts,
);
router.post(
	"/add",
	authenticateToken,
	validateSubDistrict,
	validateResponse,
	addSubDistrict,
);
router.get("/:id", authenticateToken, getSubDistrictById);
router.put(
	"/:id",
	authenticateToken,
	validateSubDistrict,
	validateResponse,
	updateSubDistrict,
);

export default router;
