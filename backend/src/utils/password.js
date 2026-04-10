// utils/password.js
import bcrypt from "bcrypt";
import { logger } from "./logger.js";

const saltRounds = 10;
// Create Password:
export async function hashPassword(password) {
	try {
		const salt = await bcrypt.genSalt(saltRounds);
		const hashedPassword = await bcrypt.hash(password, salt);
		return hashedPassword;
	} catch (_e) {
		logger.error(`PASSWORD002: Error inserting token: ${er.message}`);
		throw new Error("Internal Server Error");
	}
}
// Comparing a Password:
export async function comparePassword(password, hashedPassword) {
	try {
		const isMatch = await bcrypt.compare(password, hashedPassword);
		return isMatch;
	} catch (er) {
		logger.error(`PASSWORD002: Error inserting token: ${er.message}`);
		throw new Error("Internal Server Error");
	}
}
