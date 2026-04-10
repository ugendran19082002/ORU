import express from "express";
import {
    getMe,
    login,
    logout,
    refresh
} from "../../../controllers/auth/auth.controller.js";
import { authenticateToken, optionalAuth } from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateUserLogin } from "../../../validations/user.validation.js";

const router = express.Router();

/**
 * @desc    Login
 */
router.post("/login", validateUserLogin, validateResponse, login);

/**
 * @desc    Refresh Token
 */
router.post("/refresh-token", refresh);

/**
 * @desc    Get Current User
 */
router.get("/me", optionalAuth, getMe);

/**
 * @desc    Logout
 */
router.post("/logout", authenticateToken, logout);

export default router;
