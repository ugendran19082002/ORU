import express from "express";
import {
	addGodown,
	getGodownById,
	getGodowns,
	updateGodown,
} from "../../../controllers/master/godown.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateGodown } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getGodowns,
);
router.post(
	"/add",
	authenticateToken,
	validateGodown,
	validateResponse,
	addGodown,
);
router.get("/:id", authenticateToken, getGodownById);
router.put(
	"/:id",
	authenticateToken,
	validateGodown,
	validateResponse,
	updateGodown,
);

export default router;
