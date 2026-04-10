process.env.TZ = "Asia/Kolkata";

import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import express from "express";
import { checkConnection } from "./config/database.js";
import { configureMiddleware } from "./config/middleware.js";
import { configureRoutes } from "./routes/index.routes.js";
import { getEnv } from "./utils/env.js";
import { logger } from "./utils/logger.js";

const app = express();

/* =====================================================
   CONFIGURE MIDDLEWARE
===================================================== */
configureMiddleware(app);

// Parse cookies (REQUIRED for CSRF & Auth)
app.use(cookieParser());

// Modern CSRF Protection (Double Submit Cookie Pattern)
const isProduction = getEnv("ENVIRONMENT") === "production";

const {
	doubleCsrfProtection,
	generateCsrfToken,
} = doubleCsrf({
	getSecret: () => getEnv("CSRF_SECRET") || "super-secure-default-secret",
	cookieName: "x-csrf-token",
	cookieOptions: {
		httpOnly: true,
		sameSite: isProduction ? "none" : "lax", // "none" requires HTTPS
		secure: isProduction, // HTTPS required for secure: true
	},
	size: 64,
	ignoredMethods: ["GET", "HEAD", "OPTIONS"],
	getCsrfTokenFromRequest: (req) => {
		return (
			req.headers["x-csrf-token"] ||
			req.headers["X-CSRF-Token"] ||
			req.body?._csrf ||
			req.query?._csrf
		);
	},
	getSessionIdentifier: (req) => req.ip || "anonymous",
});

// CSRF Token Endpoint
app.get("/api/csrf-token", (req, res) => {
	const csrfToken = generateCsrfToken(req, res);
	res.json({ csrfToken });
});

app.use(doubleCsrfProtection);

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/health", async (_req, res) => {
	try {
		const isConnected = await checkConnection();
		if (!isConnected) {
			return res.status(400).json({
				status: 0,
				message: "Database is Not connected",
			});
		}
		return res.status(200).json({
			status: "UP",
			message: "Server is up & Database is connected",
		});
	} catch (error) {
		return res.status(500).json({
			status: "DOWN",
			message: error.message,
		});
	}
});

/* =====================================================
   CONFIGURE ROUTES
===================================================== */
configureRoutes(app);

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */
app.use((err, req, res, next) => {
	logger.error(err.stack); // Log full stack internally

	// CSRF Error Handler
	if (err instanceof Error && err.message === "invalid csrf token") {
		return res.status(403).json({
			status: 0,
			message: 'Invalid CSRF Token',
		});
	}

	const statusCode = err.statusCode || 500;
	const message = statusCode === 500 ? "Internal Server Error" : err.message;
	res.status(statusCode).json({ status: 0, message });
});

export default app;
