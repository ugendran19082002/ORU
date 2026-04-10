import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import Token from "../../model/Token.js";
import { getEnv } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";

/**
 * Hash a token using SHA-256 for secure storage
 * @param {string} token - The raw token string
 * @returns {string} - The hashed token
 */
export const hashToken = (token) => {
	return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate a short-lived Access Token (Stateless)
 * @param {Object} user - User object
 * @returns {string} - JWT Access Token
 */
export const generateAccessToken = (user) => {
	const payload = {
		user_id: user.id,
		username: user.username,
		role_id: user.role_id || 0,
		role_name: user.role_name,
	};

	return jwt.sign(payload, getEnv("JWT_SECRET"), {
		expiresIn: getEnv("ACCESS_TOKEN_EXPIRY") || "15m",
	});
};

/**
 * Generate a long-lived Refresh Token (Stateful)
 * Includes JTI (Unique ID) for tracking and rotation
 * @param {Object} user - User object
 * @returns {string} - JWT Refresh Token
 */
export const generateRefreshToken = (user) => {
	const payload = {
		user_id: user.id,
		jti: uuidv4(), // Unique identifier for this specific token
		token_version: user.token_version || 1, // Optional: for global Logout
	};

	return jwt.sign(payload, getEnv("JWT_SECRET"), {
		expiresIn: getEnv("REFRESH_TOKEN_EXPIRY") || "7d",
	});
};

/**
 * Verify a JWT Token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
	return jwt.verify(token, getEnv("JWT_SECRET"));
};

/**
 * Save Refresh Token to DB (Hashed)
 * @param {number} userId
 * @param {string} token - The RAW refresh token
 * @param {string} ip - IP Address
 */
export const saveRefreshToken = async (userId, token, ip) => {
	// Calculate expiry based on env or default 7 days
	const expiryDays = parseInt(getEnv("REFRESH_TOKEN_EXPIRY") || "7d") || 7;
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + expiryDays);

	const hashedToken = hashToken(token);

	return await Token.create({
		token: hashedToken, // Store HASH only
		type: "refresh",
		created_by: userId,
		created_ip: ip,
		expires_at: expiresAt,
		is_active: true,
		updated_on: new Date(),
	});
};

/**
 * Rotate Refresh Token
 * Validates old token, invalidates it, and issues a new one.
 * @param {string} oldToken - Raw old refresh token
 * @param {number} userId - User ID from payload
 * @param {string} ip - Request IP
 * @returns {string} - New Raw Refresh Token
 */
export const rotateRefreshToken = async (oldToken, userId, ip) => {
	const hashedOldToken = hashToken(oldToken);

	// Find the active token in DB
	const tokenRecord = await Token.findOne({
		where: {
			token: hashedOldToken,
			type: "refresh",
		},
	});

	// Security: If token not found or already inactive, potential Reuse Attack
	if (!tokenRecord || !tokenRecord.is_active) {
		logger.warn(`Refresh Token Reuse Detected! User: ${userId}, IP: ${ip}`);
		// Optional: Invalidate ALL tokens for this user if reuse detected
		// await invalidateAllUserTokens(userId);
		throw new Error("Invalid or expired refresh token");
	}

	// Verify expiry
	if (new Date() > new Date(tokenRecord.expires_at)) {
		tokenRecord.is_active = false;
		await tokenRecord.save();
		throw new Error("Refresh token expired");
	}

	// 1. Invalidate Old Token (Rotation)
	await tokenRecord.update({
		is_active: false,
		updated_ip: ip,
		updated_on: new Date(),
	});

	// 2. Generate New Token
	// We need the user object to generate token, but payload only needs ID usually.
	// However, generateRefreshToken expects a user logic.
	// Let's create a minimal user object or fetch it.
	// Fetching user is safer to ensure they still exist/active.
	// But to keep AuthService independent, we'll assume caller verified user or we pass minimal.
	// We'll pass { id: userId } as minimal.
	const newRefreshToken = generateRefreshToken({ id: userId });

	// 3. Save New Token
	await saveRefreshToken(userId, newRefreshToken, ip);

	return newRefreshToken;
};

/**
 * Invalidate a specific token (Logout)
 * @param {string} token - Raw token
 */
export const invalidateToken = async (token) => {
	if (!token) return;
	const hashedToken = hashToken(token);
	await Token.update(
		{ is_active: false, updated_on: new Date() },
		{ where: { token: hashedToken } },
	);
};

/**
 * Invalidate ALL tokens for a user (Login / Security Reset)
 * @param {number} userId
 */
export const invalidateAllUserTokens = async (userId) => {
	await Token.update(
		{ is_active: false, updated_on: new Date() },
		{ where: { created_by: userId, is_active: true } },
	);
};

