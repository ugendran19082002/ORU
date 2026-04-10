import { Sequelize } from "sequelize";
import {
	Department,
	Designation,
	Organization,
	Role,
	User,
} from "../../model/index.js";
import { comparePassword, hashPassword } from "../../utils/password.js";

/**
 * Find user by username with role and department details
 */
export const findUserByUsername = async (username) => {
	return await User.findOne({
		attributes: [
			"id",
			"username",
			"role_id",
			"password",
			"name",
			"email",
			"mobile",
			"district_id",
			"organization_id",
			"department_id",
			"designation_id",
			"profile_image",
			[Sequelize.col("Role.name"), "role_name"],
			[Sequelize.col("Role.is_admin"), "is_admin"],
			[Sequelize.col("Department.name"), "department_name"],
			[Sequelize.col("Designation.name"), "designation_name"],
		],
		where: { username },
		include: [
			{ model: Role, attributes: [] },
			{ model: Department, attributes: [] },
			{ model: Designation, attributes: [] },
		],
		raw: true,
	});
};

/**
 * Verify user password
 */
export const verifyPassword = async (plainPassword, hashedPassword) => {
	return await comparePassword(plainPassword, hashedPassword);
};

/**
 * Change user password
 */
export const updatePassword = async (userId, newPassword) => {
	const hashedPassword = await hashPassword(newPassword);
	return await User.update(
		{ password: hashedPassword },
		{ where: { id: userId } },
	);
};

/**
 * Get user for ID (simple attributes)
 */
export const getUserById = async (userId) => {
	return await User.findByPk(userId, {
		attributes: [
			"id",
			"username",
			"password",
			"name",
			"email",
			"role_id",
			[Sequelize.col("Role.name"), "role_name"],
		],
		include: [{ model: Role, attributes: [] }],
		raw: true,
	});
};

/**
 * Soft delete user
 */
export const deleteUser = async (userId, updatedBy, ip) => {
	return await User.update(
		{
			is_active: 0,
			updated_by: updatedBy,
			updated_on: new Date(),
			updated_ip: ip,
		},
		{ where: { id: userId } },
	);
};

/**
 * Get all active users with organizations
 */
export const getAllUsers = async () => {
	return await User.findAll({
		where: { is_active: 1 },
		attributes: [
			"id",
			"username",
			"signature_path",
			"name",
			"mobile",
			"email",
			"is_active",
			"organization_id",
			"board_id",
		],
		include: [
			{
				model: Organization,
				attributes: [[Sequelize.col("name"), "Board Name"]],
				required: false,
			},
			// Note: "Board" model import/association check?
			// In userController.js it mentions 'Board', but index.js doesn't show it as a separate model.
			// It seems 'Organization' is used as 'Board Name' in some context.
		],
	});
};
