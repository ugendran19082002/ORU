/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Object|Array} data - Data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data, message, statusCode = 200) => {
	return res.status(statusCode).json({
		status: 1,
		data: data,
		message: message,
	});
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {number} status - Internal status code (default: 0)
 */
export const sendError = (res, message, statusCode = 500, status = 0) => {
	return res.status(statusCode).json({
		status: status,
		message: message,
	});
};
