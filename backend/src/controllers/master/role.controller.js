import { Op, Sequelize } from "sequelize";
import { Organization, Role } from "../../model/index.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

// GET Roles (List with pagination & search)
export const getRoles = async (req, res) => {
	try {
		const { page, limit, search = "", organization_id } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const { count, rows } = await Role.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
				organization_id: organization_id || { [Op.ne]: null },
			},
			attributes: [
				"id",
				"name",
				"is_admin",
				"organization_id",
				"is_active",
				"is_delivery_point",
				"is_district",
				"is_godown",
				"created_on",
				[Sequelize.col("Organization.name"), "organization_name"],
			],
			include: [
				{
					model: Organization,
					attributes: [],
				},
			],
			limit: limitValue,
			offset: offset,
			order: [["id", "DESC"]],
		});

		logger.info("Roles retrieved successfully");
		const pagingData = getPagingData({ count, rows }, pageValue, limitValue);
		return sendSuccess(
			res,
			pagingData,
			count ? "Roles retrieved successfully" : "No roles found",
		);
	} catch (error) {
		logger.error(`MASTER001: Error fetching roles - ${error.message}`);
		return sendError(res, "Failed to get roles");
	}
};

// CREATE Role
export const addRole = async (req, res) => {
	try {
		const {
			name,
			organization_id,
			is_admin,
			is_delivery_point,
			is_district,
			is_godown,
		} = req.body;

		const userId = req.user?.user_id || 0;

		const role = await Role.create({
			name: name.trim(),
			organization_id,
			is_admin: is_admin || false,
			is_delivery_point: is_delivery_point || 0,
			is_district: is_district || 0,
			is_godown: is_godown || 0,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		logger.info("Role created successfully");
		return sendSuccess(res, role, "Role created successfully", 201);
	} catch (error) {
		logger.error(`MASTER002: Error creating role - ${error.message}`);
		return sendError(res, "Failed to create role");
	}
};

// UPDATE Role
export const updateRole = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			name,
			is_admin,
			is_active,
			organization_id,
			is_delivery_point,
			is_district,
			is_godown,
		} = req.body;
		// const userId = req.user?.user_id || 0;

		const role = await Role.findOne({
			where: { id },
		});

		if (!role) {
			logger.warn("Role not found");
			return sendError(res, "Role not found", 404);
		}

		await role.update({
			name: name.trim(),
			is_admin: is_admin,
			is_active: is_active,
			organization_id: organization_id,
			is_delivery_point: is_delivery_point,
			is_district: is_district,
			is_godown: is_godown,
		});

		return sendSuccess(res, [], "Role updated successfully");
	} catch (error) {
		logger.error(`MASTER003: Error updating role - ${error.message}`);
		return sendError(res, "Failed to update role");
	}
};

// Optional: Get single role by ID
export const getRoleById = async (req, res) => {
	try {
		const { id } = req.params;

		const role = await Role.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"is_admin",
				"is_active",
				"is_delivery_point",
				"is_district",
				"is_godown",
				"organization_id",
				"created_on",
				[Sequelize.col("Organization.name"), "organization_name"],
			],
			include: [
				{
					model: Organization,
					attributes: [],
				},
			],
		});

		if (!role) {
			return sendError(res, "Role not found", 404);
		}

		return sendSuccess(res, role, "Role retrieved successfully");
	} catch (error) {
		logger.error(`MASTER004: Error fetching role by id - ${error.message}`);
		return sendError(res, "Failed to get role");
	}
};
