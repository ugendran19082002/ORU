import { MESSAGES } from "../../constants/messages.js";
import { STATUS_CODES } from "../../constants/statusCodes.js";
import * as AuthService from "../../services/auth/AuthService.js";
import * as CaptchaService from "../../services/captcha/CaptchaService.js";
import * as UserService from "../../services/user/UserService.js";
import { logger } from "../../utils/logger.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * User Login with Captcha
 */
/**
 * User Login with Captcha
 */
export const userLogin = async (req, res) => {
	try {
		const { username, password, captcha, sessionId } = req.body;

		// 🔹 Captcha Validation
		const captchaResult = await CaptchaService.validateCaptcha(
			sessionId,
			captcha,
		);
		if (!captchaResult.valid) {
			logger.info(captchaResult.message);
			return sendError(res, captchaResult.message, STATUS_CODES.BAD_REQUEST);
		}

		// 🔹 User lookup
		const user = await UserService.findUserByUsername(username);
		if (!user) {
			logger.info(`User with username ${username} not found`);
			return sendError(
				res,
				MESSAGES.INVALID_CREDENTIALS,
				STATUS_CODES.BAD_REQUEST,
			);
		}

		// 🔹 Password validation
		const isMatch = await UserService.verifyPassword(password, user.password);
		if (!isMatch) {
			logger.info(`Invalid password combination for user ${username}`);
			return sendError(
				res,
				MESSAGES.INVALID_PASSWORD,
				STATUS_CODES.BAD_REQUEST,
			);
		}

		// 1. Invalidate all previous tokens (Single Session)
		await AuthService.invalidateAllUserTokens(user.id);

		// 2. Generate Tokens
		const accessToken = AuthService.generateAccessToken(user);
		const refreshToken = AuthService.generateRefreshToken(user);

		// 3. Store Refresh Token (Hashed)
		await AuthService.saveRefreshToken(user.id, refreshToken, req.ip);

		logger.info(`User ${username} logged in successfully`);

		// 4. Set Cookies
		const isProduction = getEnv("ENVIRONMENT") === "production";
		const cookieOptions = {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
		};

		res.cookie("access_token", accessToken, {
			...cookieOptions,
			path: "/",
			maxAge: 15 * 60 * 1000, // 15 mins
		});

		res.cookie("refresh_token", refreshToken, {
			...cookieOptions,
			path: "/api/user/refresh-token", // User specific path
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		return sendSuccess(
			res,
			{
				user_id: user.id,
				username: user.username,
				name: user.name,
				email: user.email,
				role_id: user.role_id || 0,
				is_admin: user.is_admin,
				role_name: user.role_name,
			},
			MESSAGES.LOGIN_SUCCESS,
		);
	} catch (error) {
		logger.error(`USER_LOGIN_ERROR: ${error.message}`);
		return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
	}
};

/**
 * User Login without Captcha (Internal/Testing)
 */
/**
 * User Login without Captcha (Internal/Testing)
 */
export const userNoCaptchaLogin = async (req, res) => {
	try {
		const { username, password } = req.body;

		const user = await UserService.findUserByUsername(username);
		if (!user)
			return sendError(
				res,
				MESSAGES.INVALID_CREDENTIALS,
				STATUS_CODES.BAD_REQUEST,
			);

		const isMatch = await UserService.verifyPassword(password, user.password);
		if (!isMatch)
			return sendError(
				res,
				MESSAGES.INVALID_PASSWORD,
				STATUS_CODES.BAD_REQUEST,
			);

		// 1. Invalidate Previous Tokens
		await AuthService.invalidateAllUserTokens(user.id);

		// 2. Generate Tokens
		const accessToken = AuthService.generateAccessToken(user);
		const refreshToken = AuthService.generateRefreshToken(user);

		// 3. Save Refresh Token
		await AuthService.saveRefreshToken(user.id, refreshToken, req.ip);

		// 4. Set Cookies
		const isProduction = getEnv("ENVIRONMENT") === "production";
		const cookieOptions = {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
		};

		res.cookie("access_token", accessToken, {
			...cookieOptions,
			path: "/",
			maxAge: 15 * 60 * 1000,
		});

		res.cookie("refresh_token", refreshToken, {
			...cookieOptions,
			path: "/api/user/refresh-token",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return sendSuccess(
			res,
			{
				user_id: user.id,
				username: user.username,
				name: user.name,
			},
			MESSAGES.LOGIN_SUCCESS,
		);
	} catch (error) {
		logger.error(`USER_NO_CAPTCHA_LOGIN_ERROR: ${error.message}`);
		return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
	}
};

/**
 * Change Password
 */
export const changePassword = async (req, res) => {
	try {
		const { new_password, old_password } = req.body;
		const userId = req.user?.user_id;

		const user = await UserService.getUserById(userId);
		if (!user) return sendError(res, MESSAGES.DATA_NOT_FOUND, STATUS_CODES.BAD_REQUEST);

		const isMatch = await UserService.verifyPassword(
			old_password,
			user.password,
		);
		if (!isMatch)
			return sendError(
				res,
				MESSAGES.INVALID_CREDENTIALS,
				STATUS_CODES.BAD_REQUEST,
			);

		if (user.username === new_password)
			return sendError(
				res,
				MESSAGES.PASSWORD_SAME_AS_USERNAME,
				STATUS_CODES.BAD_REQUEST,
			);

		await UserService.updatePassword(userId, new_password);

		return sendSuccess(res, {}, MESSAGES.PASSWORD_CHANGED);
	} catch (error) {
		logger.error(`USER_CHANGE_PASSWORD_ERROR: ${error.message}`);
		return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
	}
};

/**
 * Soft Delete User
 */
export const userDelete = async (req, res) => {
	try {
		const { id } = req.params;
		const updatedBy = req.user?.user_id;

		const result = await UserService.deleteUser(id, updatedBy, req.ip);
		if (!result[0])
			return sendError(res, MESSAGES.DATA_NOT_FOUND, STATUS_CODES.NOT_FOUND);

		return sendSuccess(res, {}, MESSAGES.DELETE_SUCCESS);
	} catch (error) {
		logger.error(`USER_DELETE_ERROR: ${error.message}`);
		return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
	}
};

/**
 * List Users
 */
export const userList = async (_req, res) => {
	try {
		const users = await UserService.getAllUsers();
		return sendSuccess(res, users, MESSAGES.FETCH_SUCCESS);
	} catch (error) {
		logger.error(`USER_LIST_ERROR: ${error.message}`);
		return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
	}
};

/**
 * Refresh Access Token
 */
/**
 * Refresh Access Token
 */
export const refreshToken = async (req, res) => {
	try {
		const oldRefreshToken = req.cookies?.refresh_token;

		if (!oldRefreshToken) {
			return sendError(
				res,
				"Refresh token missing",
				STATUS_CODES.UNAUTHORIZED,
			);
		}

		// 1. Verify (Stateless)
		let payload;
		try {
			payload = AuthService.verifyToken(oldRefreshToken);
		} catch (err) {
			return sendError(
				res,
				"Invalid refresh token",
				STATUS_CODES.UNAUTHORIZED,
			);
		}

		// 2. Rotate Token (Validate DB + Rotation)
		let newRefreshToken;
		try {
			newRefreshToken = await AuthService.rotateRefreshToken(
				oldRefreshToken,
				payload.user_id,
				req.ip
			);
		} catch (err) {
			// Security: Clear cookies on failure
			const isProduction = getEnv("ENVIRONMENT") === "production";
			const clearOptions = {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
			};
			res.clearCookie("access_token", { ...clearOptions, path: "/" });
			res.clearCookie("refresh_token", { ...clearOptions, path: "/api/user/refresh-token" });

			return sendError(res, err.message, STATUS_CODES.UNAUTHORIZED);
		}

		// 3. Issue New Access Token
		const user = await UserService.getUserById(payload.user_id);
		if (!user) {
			return sendError(res, "User not found", STATUS_CODES.UNAUTHORIZED);
		}

		const newAccessToken = AuthService.generateAccessToken(user);

		// 4. Update Cookies
		const isProduction = getEnv("ENVIRONMENT") === "production";
		const cookieOptions = {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
		};

		res.cookie("access_token", newAccessToken, {
			...cookieOptions,
			path: "/",
			maxAge: 15 * 60 * 1000,
		});

		// Important: Update the refresh token cookie as well since it was rotated
		// Keep the specific path for user refresh token
		res.cookie("refresh_token", newRefreshToken, {
			...cookieOptions,
			path: "/api/user/refresh-token",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return sendSuccess(res, {}, "Token refreshed");
	} catch (error) {
		logger.error(`REFRESH_TOKEN_ERROR: ${error.message}`);
		return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
	}
};

/**
 * Logout
 */
/**
 * Logout
 */
export const logout = async (req, res) => {
	try {
		// Invalidate Refresh Token if present
		const refreshToken = req.cookies?.refresh_token;
		if (refreshToken) {
			await AuthService.invalidateToken(refreshToken);
		}

		// Clear both cookies
		const isProduction = getEnv("ENVIRONMENT") === "production";
		const clearOptions = {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
		};

		res.clearCookie("access_token", {
			...clearOptions,
			path: "/",
		});
		res.clearCookie("refresh_token", {
			...clearOptions,
			path: "/api/user/refresh-token",
		});

		return sendSuccess(res, {}, MESSAGES.LOGOUT_SUCCESS);
	} catch (error) {
		logger.error(`USER_LOGOUT_ERROR: ${error.message}`);
		return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
	}
};
