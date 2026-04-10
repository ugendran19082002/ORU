import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { logger } from "../utils/logger.js";
import xssMiddleware from "../middleware/xssMiddleware.js";

export const configureMiddleware = (app) => {
    const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
        : [];

    /* =====================================================
       TRUST PROXY (MANDATORY FOR RATE LIMIT & BANK INFRA)
    ===================================================== */
    app.set("trust proxy", 1);
    app.disable("x-powered-by");

    /* =====================================================
       SECURITY & CORE MIDDLEWARES
    ===================================================== */
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    connectSrc: ["'self'", ...allowedOrigins], // Allow API calls to self & frontend
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
                    imgSrc: ["'self'", "data:", "blob:"],
                },
            },
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }),
    );

    // Prevent HTTP Parameter Pollution
    app.use(hpp());

    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"], // Added CSRF Token
        exposedHeaders: ["Content-Length"],
        credentials: true,
        optionsSuccessStatus: 204,
    };

    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));

    app.use(
        compression({
            threshold: 1024, // compress responses > 1KB
        }),
    );

    /* =====================================================
       RATE LIMITING
    ===================================================== */
    // Strict limiter for login
    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 login requests per window
        message: "Too many login attempts, please try again after 15 minutes",
        standardHeaders: true,
        legacyHeaders: false,
    });
    // Apply to login route (adjust path if needed)
    app.use("/api/v1/user/login", loginLimiter);

    // Global safe limiter
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use(limiter);

    /* =====================================================
       BODY PARSER & SANITIZATION
    ===================================================== */
    app.use(express.json({ strict: false }));

    // Global XSS Sanitization (AFTER body parser)
    app.use(xssMiddleware);

    // Ensure req.body always exists (AFTER parser)
    app.use((req, _res, next) => {
        if (!req.body) req.body = {};
        next();
    });

    /* =====================================================
       REQUEST LOGGER (MORGAN + WINSTON)
    ===================================================== */
    // Stream morgan logs to winston
    const stream = {
        write: (message) => logger.info(message.trim()),
    };

    app.use(morgan("combined", { stream }));

    // Manual body logger (kept for detail)
    app.use((req, _res, next) => {
        if (req.body && Object.keys(req.body).length > 0) {
            logger.info(`Request Body: ${JSON.stringify(req.body)}`);
        }
        next();
    });
};
