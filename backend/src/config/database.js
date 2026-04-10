// Importing the dotenv package to load environment variables from a .env file

// Importing Sequelize from the sequelize package
import { Sequelize } from "sequelize";
// Importing the logger utility for logging purposes
import { getEnv } from "../utils/env.js";
import { logger } from "../utils/logger.js";

// Creating a Sequelize instance and configuring it to use MySQL2 as the database dialect
export const sequelizeDb = new Sequelize({
	dialect: "mysql", // Specifying the database dialect
	host: getEnv("DB_HOST"), // Database host, loaded from environment variables
	username: getEnv("DB_USER"), // Database username, loaded from environment variables
	password: getEnv("DB_PASSWORD"), // Database password, loaded from environment variables
	database: getEnv("DB_NAME"), // Database name, loaded from environment variables
	logging: getEnv("ENVIRONMENT") !== "production" ? (msg) => logger.info(msg) : false,
	pool: {
		max: 10, // Maximum number of connection in pool
		min: 0, // Minimum number of connection in pool
		acquire: 30000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
		idle: 10000, // The maximum time, in milliseconds, that a connection can be idle before being released
	},
	timezone: "+05:30", // Set timezone to IST
});

/**
 * Test the connection to the database
 * The authenticate method tests if the connection is established successfully
 * @returns {Promise<boolean>}
 */
export const checkConnection = async () => {
	try {
		await sequelizeDb.authenticate();
		logger.info(`Connection has been established successfully`); // Log successful connection
		return true;
	} catch (err) {
		logger.error(`DB0001:Unable to connect to the database:`, err); // Log any connection errors
		return false;
	}
};
