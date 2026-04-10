import express from "express";
import {
	logout,
} from "../../../controllers/auth/auth.controller.js";
import {
	changePassword,
	refreshToken,
	userLogin,
} from "../../../controllers/user/user.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateUserLogin } from "../../../validations/user.validation.js";

const router = express.Router();

/**
 * @desc    User Login (With Captcha)
 */
router.post("/login", validateUserLogin, validateResponse, userLogin);

/**
 * @desc    Refresh Token
 */
router.post("/refresh-token", refreshToken);

/**
 * @desc    Logout
 */
router.post("/logout", authenticateToken, logout);

/**
 * @route GET /api/v1/user/change-password
 */
router.get(
	"/change-password",
	authenticateToken,
	validateResponse,
	changePassword,
);

export default router;

