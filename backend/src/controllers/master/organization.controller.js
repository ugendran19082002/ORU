import { Op } from "sequelize";
import { Organization } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getOrganizations = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await Organization.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: ["id", "name", "created_on", "is_active"],
			order: [["id", "DESC"]],
			limit: Number(limit),
			offset: Number(offset),
		});

		return res.status(200).json({
			status: 1,
			data: {
				totalItems: count,
				totalPages: Math.ceil(count / limit),
				currentPage: Number(page),
				items: rows,
			},
			message: count
				? "Organizations retrieved successfully"
				: "No organizations found",
		});
	} catch (error) {
		logger.error(`MASTER085: Error fetching organizations - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get organizations" });
	}
};

export const addOrganization = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await Organization.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Organization already exists" });

		await Organization.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Organization created successfully",
		});
	} catch (error) {
		logger.error(`MASTER086: Error creating organization - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create organization" });
	}
};

export const updateOrganization = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const item = await Organization.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Organization not found" });

		const duplicate = await Organization.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Organization already exists" });

		await item.update({ name: name.trim(), is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Organization updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER087: Error updating organization - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update organization" });
	}
};

export const getOrganizationById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await Organization.findOne({ where: { id } });
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Organization not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER088: Error fetching organization by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get organization" });
	}
};
