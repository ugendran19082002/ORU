import express from "express";
import {
	addBank,
	getBankById,
	getBanks,
	updateBank,
} from "../../../controllers/master/bank.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import {
	validateBank,
	validateUpdateBank,
} from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getBanks,
);
router.post(
	"/add",
	authenticateToken,
	validateBank,
	validateResponse,
	addBank,
);
router.get("/:id", authenticateToken, getBankById);
router.put(
	"/:id",
	authenticateToken,
	validateUpdateBank,
	validateResponse,
	updateBank,
);

export default router;
