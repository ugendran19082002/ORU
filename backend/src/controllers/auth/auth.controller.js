import * as AuthService from "../../services/auth/AuthService.js";
import * as UserService from "../../services/user/UserService.js";
import { getEnv } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";
import { MESSAGES } from "../../constants/messages.js";
import { STATUS_CODES } from "../../constants/statusCodes.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * @desc    Login user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await UserService.findUserByUsername(username);
        if (!user) {
            return sendError(
                res,
                MESSAGES.INVALID_CREDENTIALS,
                STATUS_CODES.BAD_REQUEST,
            );
        }

        const isMatch = await UserService.verifyPassword(password, user.password);
        if (!isMatch) {
            return sendError(
                res,
                MESSAGES.INVALID_PASSWORD,
                STATUS_CODES.BAD_REQUEST,
            );
        }

        // 1. Invalidate all previous tokens (Single Session / Security Reset)
        await AuthService.invalidateAllUserTokens(user.id);

        // 2. Generate Tokens
        const accessToken = AuthService.generateAccessToken(user);
        const refreshToken = AuthService.generateRefreshToken(user);

        // 3. Store Refresh Token (Hashed)
        await AuthService.saveRefreshToken(user.id, refreshToken, req.ip);

        // 4. Set Cookies
        const isProduction = getEnv("ENVIRONMENT") === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction, // True in Prod
            sameSite: isProduction ? "none" : "lax", // None for cross-site in Prod
        };

        res.cookie("access_token", accessToken, {
            ...cookieOptions,
            path: "/",
            maxAge: 15 * 60 * 1000, // 15 Minutes
        });

        res.cookie("refresh_token", refreshToken, {
            ...cookieOptions,
            path: "/api/auth/refresh-token", // Restrict to Refresh Endpoint
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
        });

        return sendSuccess(
            res,
            {
                user_id: user.id,
                username: user.username,
                name: user.name,
                role_id: user.role_id,
            },
            MESSAGES.LOGIN_SUCCESS,
        );
    } catch (error) {
        logger.error(`AUTH_LOGIN_ERROR: ${error.message}`);
        return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Refresh access token (Rotates Refresh Token)
 * @route   POST /api/auth/refresh-token
 * @access  Public (Requires Refresh Cookie)
 */
export const refresh = async (req, res) => {
    try {
        const oldRefreshToken = req.cookies?.refresh_token;
        if (!oldRefreshToken) {
            return sendError(
                res,
                "Refresh token missing",
                STATUS_CODES.UNAUTHORIZED,
            );
        }

        // 1. Verify Structure & Decode (Stateless check)
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

        // 2. Rotate Token (Validate in DB -> Invalidate Old -> Generate New)
        let newRefreshToken;
        try {
            newRefreshToken = await AuthService.rotateRefreshToken(
                oldRefreshToken,
                payload.user_id,
                req.ip,
            );
        } catch (err) {
            // Rotation failed (Expired / Reuse / Invalid)
            // Clear cookies as security measure
            const isProduction = getEnv("ENVIRONMENT") === "production";
            const clearOptions = {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
            };
            res.clearCookie("access_token", { ...clearOptions, path: "/" });
            res.clearCookie("refresh_token", { ...clearOptions, path: "/api/auth/refresh-token" });

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

        res.cookie("refresh_token", newRefreshToken, {
            ...cookieOptions,
            path: "/api/auth/refresh-token",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return sendSuccess(res, {}, "Token refreshed");
    } catch (error) {
        logger.error(`AUTH_REFRESH_ERROR: ${error.message}`);
        return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Get current user info
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return sendError(res, "Not authenticated", 401, 0);
        }

        const user = await UserService.getUserById(req.user.user_id);
        if (!user) {
            return sendError(res, MESSAGES.DATA_NOT_FOUND, STATUS_CODES.NOT_FOUND);
        }

        return sendSuccess(
            res,
            {
                user_id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role_id: user.role_id,
            },
            MESSAGES.FETCH_SUCCESS,
        );
    } catch (error) {
        logger.error(`AUTH_ME_ERROR: ${error.message}`);
        return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

/**
 * @desc    Logout user & clear cookies
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
    try {
        // Invalidate Refresh Token if present
        const refreshToken = req.cookies?.refresh_token;
        if (refreshToken) {
            await AuthService.invalidateToken(refreshToken);
        }

        // Clear Cookies
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
            path: "/api/auth/refresh-token",
        });

        return sendSuccess(res, {}, MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
        logger.error(`AUTH_LOGOUT_ERROR: ${error.message}`);
        return sendError(res, MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

