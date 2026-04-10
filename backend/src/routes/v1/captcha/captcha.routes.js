import express from "express";
import * as CaptchaController from "../../../controllers/captcha/captcha.controller.js";
import { authenticateApplicationKey } from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

/**
 * @route GET /api/v1/captcha/generate-captcha
 * @desc Generate a new SVG captcha
 * @access Private (Application Key)
 */
router.get(
	"/generate-captcha",
	authenticateApplicationKey,
	validateResponse,
	CaptchaController.generateCaptcha,
);

export default router;
