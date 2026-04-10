import { body } from "express-validator";

export const validateChangePassword = [
	body("new_password")
		.exists({ checkFalsy: true })
		.withMessage("New password is required")
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
		.withMessage(
			"New password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
		)
		.custom((value, { req }) => value !== req.body.old_password)
		.withMessage("New password cannot be the same as old password"),
	body("confirm_password")
		.exists({ checkFalsy: true })
		.withMessage("Confirm password is required")
		.custom((value, { req }) => value === req.body.new_password)
		.withMessage("New password and confirm password must match"),
	body("old_password")
		.exists({ checkFalsy: true })
		.withMessage("Old password is required")
		.isLength({ min: 8 })
		.withMessage("Old password must be at least 8 characters long"),
];

export const validateUserLogin = [
	body("username")
		.exists({ checkFalsy: true })
		.withMessage("User Name is required"),
	body("password")
		.exists({ checkFalsy: true })
		.withMessage("Password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
];

export const validateUserCreation = [
	body("state_id").optional().isInt().withMessage("State must be an integer"),
	body("organization_id")
		.exists({ checkFalsy: true })
		.withMessage("Organization is required")
		.isInt()
		.withMessage("Organization must be an integer"),
	body("username")
		.exists({ checkFalsy: true })
		.withMessage("Username is required")
		.trim()
		.notEmpty()
		.withMessage("Username cannot be empty"),
	body("password")
		.exists({ checkFalsy: true })
		.withMessage("Password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),
	body("email").optional().isEmail().withMessage("Email must be valid"),
	body("mobile")
		.optional()
		.matches(/^\d{10}$/)
		.withMessage("Mobile number must be exactly 10 digits"),
];
