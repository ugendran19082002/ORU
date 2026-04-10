import crypto from "crypto";
import { writeFileSync } from "fs";
import { getEnv } from "./src/utils/env.js";

// Function to generate a secure random key
const generateKey = (length = 64) => {
	return crypto.randomBytes(length).toString("hex");
};

// Check if APPLICATION_KEY and JWT_SECRET are not already set in .env
if (!getEnv("APPLICATION_KEY")) {
	const applicationKey = generateKey(16).toLocaleUpperCase();
	writeFileSync(".env", `APPLICATION_KEY=${applicationKey}\n`, { flag: "a" });
}

if (!getEnv("JWT_SECRET")) {
	const jwtSecret = generateKey(32);
	writeFileSync(".env", `JWT_SECRET=${jwtSecret}\n`, { flag: "a" });
}
