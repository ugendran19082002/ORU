import express from "express";
import {
	addUser,
	getUserById,
	getUsers,
	updateUser,
} from "../../../controllers/master/user.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import {
	validateUpdateUser,
	validateUser,
} from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getUsers,
);
router.post(
	"/add",
	authenticateToken,
	validateUser,
	validateResponse,
	addUser,
);
router.get("/:id", authenticateToken, getUserById);
router.put(
	"/:id",
	authenticateToken,
	validateUpdateUser,
	validateResponse,
	updateUser,
);

export default router;
