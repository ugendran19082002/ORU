import cors from "cors";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import { date } from "../../utils/date.js";
import { getEnv } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";

// Function to generate JWT token
export const generateJWTToken = (payload) => {
	try {
		if (!payload) {
			logger.info(`Empty payload`);
			throw new Error("Forbidden");
		}
		return jwt.sign(payload, getEnv("JWT_SECRET"), {
			expiresIn: getEnv("JWT_EXPIRY"),
		});
	} catch (er) {
		logger.error(`AUTHMID001: Error generating token: ${er.message}`);
		throw new Error("Internal Server Error");
	}
};

// Middleware to authenticate JWT token (Stateless)
export const authenticateToken = (req, res, next) => {
	try {
		const token = req.cookies?.access_token;

		if (!token) {
			// logger.info(`Access token missing`);
			return res.status(401).json({
				status: 0,
				message: "Authentication required",
			});
		}

		jwt.verify(token, getEnv("JWT_SECRET"), (err, decoded) => {
			if (err) {
				if (err.name === "TokenExpiredError") {
					logger.info(`Access token expired`);
					return res.status(401).json({
						status: 0,
						code: "TOKEN_EXPIRED",
						message: "Token expired, please refresh",
					});
				}
				logger.info(`Invalid access token: ${err.message}`);
				return res.status(401).json({
					status: 0,
					message: "Invalid session",
				});
			}

			// Stateless: We trust the signature + expiry of the access token.
			// No DB lookup for access tokens (per architecture requirements).

			req.user = decoded;
			req.token = token;
			next();
		});
	} catch (er) {
		logger.error(`AUTHMID002: Error in auth middleware: ${er.message}`);
		return res.status(500).json({
			status: 0,
			message: "Internal Server Error",
		});
	}
};

/**
 * Middleware for optional authentication.
 */
export const optionalAuth = (req, res, next) => {
	const token = req.cookies?.access_token;
	if (!token) return next();

	jwt.verify(token, getEnv("JWT_SECRET"), (err, decoded) => {
		if (!err) {
			req.user = decoded;
			req.token = token;
		}
		next();
	});
};

// Function to decode JWT token
export const decodeJWTToken = (token) => {
	try {
		if (token === null) {
			logger.info(`Invalid token`);
			throw new Error("Forbidden");
		}
		return jwtDecode(token);
	} catch (er) {
		logger.error(`AUTHMID005: Error decoding token: ${er.message}`);
		throw new Error("Internal Server Error");
	}
};

// Middleware to authenticate application key
export const authenticateApplicationKey = (req, res, next) => {
	try {
		const authHeader = req.headers?.authorization;
		const application_key = authHeader;

		if (!application_key) {
			logger.info(`Application key is not found`);
			return res
				.status(403)
				.json({ status: 0, data: {}, message: "Unauthorized access" });
		}

		if (getEnv("APPLICATION_KEY") !== application_key) {
			logger.info(`Invalid application key`);
			return res
				.status(403)
				.json({ status: 0, data: {}, message: "Unauthorized access" });
		}

		return next();
	} catch (er) {
		logger.error(`AUTHMID007: Error in application key check: ${er.message}`);
		return res
			.status(500)
			.json({ status: 0, data: {}, message: "Internal Server Error" });
	}
};

// CORS Config
const allowedOrigins = getEnv("WHITELIST_URL")
	? getEnv("WHITELIST_URL").split(",")
	: null;

export const corsConfig = (app) => {
	app.use(cors());
};

export const paramIdValidation = (req, res, next) => {
	try {
		const id = req.params.id || null;

		if (!id) {
			logger.info(`Invalid id`);
			return res
				.status(403)
				.json({ status: 0, data: [], message: "Forbidden" });
		}
		// Logic removed previously or incorrect assignment, kept safe check
		// req.params.id = decodeId; // Was undefined in original
		next();
	} catch (e) {
		logger.error(`AUTHMID009: Error fetching Auth validator: ${e.message}`);
		return res
			.status(500)
			.json({ status: 0, data: [], message: "Internal Server Error" });
	}
};

/**
 * Middleware to authorize based on user role
 * @param  {...number} roles - Allowed role IDs
 */
export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role_id)) {
			logger.warn(
				`Authorization failed for user: ${req.user?.user_id || "unknown"}`,
			);
			return res.status(403).json({
				status: 0,
				message: "Permission denied",
			});
		}
		next();
	};
};

