import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const isProduction = process.env.ENVIRONMENT === "production";
const logDirectory = "logs";

const transports = [
	new winston.transports.Console(), // Always log to console
];

transports.push(
	new DailyRotateFile({
		correlation: true,
		dirname: logDirectory,
		filename: isProduction ? "error-%DATE%.log" : "combined-%DATE%.log",
		datePattern: "YYYY-MM-DD",
		level: isProduction ? "error" : "debug",
		zippedArchive: true,
		maxSize: "20m",
		maxFiles: "14d",
	}),
);

export const logger = winston.createLogger({
	transports: transports,
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json(),
	),
});
