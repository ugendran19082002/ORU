import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();
export const getEnv = (value) => {
	if (!value || process.env[value] === undefined) {
		logger.error(`ENV001:Error: Environment variable ${value} is not defined`);
		return false;
	}
	return process.env[value];
};
