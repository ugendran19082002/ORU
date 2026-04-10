import svgCaptcha from "svg-captcha";
import { v4 as uuidv4 } from "uuid";
import CaptchaLog from "../../model/CaptchaLogs.js";

/**
 * Generate a new captcha and save log
 */
export const generateCaptcha = async () => {
	const captcha = svgCaptcha.create({
		size: 6,
		noise: 0,
		color: false,
		background: null,
		width: 120,
		height: 40,
		fontSize: 40,
		charPreset: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
	});

	const sessionId = uuidv4();
	const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

	await CaptchaLog.create({
		captcha_text: captcha.text,
		session_id: sessionId,
		expires_at: expiresAt,
	});

	return { svg: captcha.data, sessionId };
};

/**
 * Validate captcha and mark as used
 */
export const validateCaptcha = async (sessionId, captchaText) => {
	const captchaLog = await CaptchaLog.findOne({
		where: { session_id: sessionId },
	});

	if (!captchaLog) return { valid: false, message: "CAPTCHA does not exist" };

	if (new Date() > captchaLog.expires_at)
		return { valid: false, message: "CAPTCHA is expired" };

	if (!captchaText || captchaText !== captchaLog.captcha_text)
		return { valid: false, message: "Invalid CAPTCHA provided" };

	if (captchaLog.is_verified === 1)
		return { valid: false, message: "Invalid CAPTCHA provided" };

	await captchaLog.update({ is_verified: 1 });
	return { valid: true };
};
