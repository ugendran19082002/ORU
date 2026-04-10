import express from "express";
import {
	addRole,
	getRoleById,
	getRoles,
	updateRole,
} from "../../../controllers/master/role.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateRole } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getRoles,
);
router.post(
	"/add",
	authenticateToken,
	validateRole,
	validateResponse,
	addRole,
);
router.get("/:id", authenticateToken, getRoleById);
router.put(
	"/:id",
	authenticateToken,
	validateRole,
	validateResponse,
	updateRole,
);

export default router;
