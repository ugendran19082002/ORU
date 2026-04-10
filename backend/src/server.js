import dotenv from "dotenv";
import app from "./app.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	logger.info(`🚀 Server is running on port ${PORT}`);
	console.log(`🚀 Server is running on port ${PORT}`);
});
