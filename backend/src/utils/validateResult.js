import { validationResult } from "express-validator";
// Validate input fields using express-validator
export const validateResponse = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// Collect all validation error messages
		const errorMessages = errors
			.array()
			.map((error) => error.msg)
			.join(", ");
		// Respond with a 400 status code and error messages if validation fails
		return res
			.status(400)
			.json({ status: 0, data: {}, message: errorMessages });
	}
	// If validation passes, proceed to the next middleware or controller function
	next();
};
