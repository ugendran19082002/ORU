import * as CaptchaService from "../../services/captcha/CaptchaService.js";
import { logger } from "../../utils/logger.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * Generate Captcha
 */
export const generateCaptcha = async (_req, res) => {
	try {
		const data = await CaptchaService.generateCaptcha();
		return sendSuccess(res, data, "Captcha generated successfully");
	} catch (error) {
		logger.error(`CAPTCHA_GENERATION_ERROR: ${error.message}`);
		return sendError(res, "Internal Server Error during captcha generation");
	}
};
