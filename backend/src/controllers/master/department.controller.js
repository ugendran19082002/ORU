import { Op, Sequelize } from "sequelize";
import { Department, Organization } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getDepartments = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await Department.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"organization_id",
				"created_on",
				"is_active",
				[Sequelize.col("Organization.name"), "organization_name"],
			],
			include: [
				{
					model: Organization,
					attributes: [],
				},
			],
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
				? "Departments retrieved successfully"
				: "No departments found",
		});
	} catch (error) {
		logger.error(`MASTER045: Error fetching departments - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get departments" });
	}
};

export const addDepartment = async (req, res) => {
	try {
		const { name, organization_id } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await Department.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Department already exists" });

		await Department.create({
			name: name.trim(),
			organization_id,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Department created successfully",
		});
	} catch (error) {
		logger.error(`MASTER046: Error creating department - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create department" });
	}
};

export const updateDepartment = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, organization_id, is_active } = req.body;

		const item = await Department.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Department not found" });

		const duplicate = await Department.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Department already exists" });

		await item.update({ name: name.trim(), organization_id, is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Department updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER047: Error updating department - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update department" });
	}
};

export const getDepartmentById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await Department.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"organization_id",
				"is_active",
				[Sequelize.col("Organization.name"), "organization_name"],
			],
			include: [
				{
					model: Organization,
					attributes: [],
				},
			],
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Department not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER048: Error fetching department by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get department" });
	}
};
