import { Op, Sequelize } from "sequelize";
import { Department, IndentingDepartment } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getIndentingDepartments = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await IndentingDepartment.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"department_id",
				"created_on",
				"is_active",
				[Sequelize.col("Department.name"), "department_name"],
			],
			include: [
				{
					model: Department,
					attributes: [],
					required: false,
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
				? "Indenting departments retrieved successfully"
				: "No indenting departments found",
		});
	} catch (error) {
		logger.error(
			`MASTER077: Error fetching indenting departments - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get indenting departments" });
	}
};

export const addIndentingDepartment = async (req, res) => {
	try {
		const { name, department_id } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await IndentingDepartment.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Indenting department already exists" });

		await IndentingDepartment.create({
			name: name.trim(),
			department_id,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Indenting department created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER078: Error creating indenting department - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create indenting department" });
	}
};

export const updateIndentingDepartment = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, department_id, is_active } = req.body;

		const item = await IndentingDepartment.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Indenting department not found" });

		const duplicate = await IndentingDepartment.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Indenting department already exists" });

		await item.update({ name: name.trim(), department_id, is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Indenting department updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER079: Error updating indenting department - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update indenting department" });
	}
};

export const getIndentingDepartmentById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await IndentingDepartment.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"department_id",
				"is_active",
				[Sequelize.col("Department.name"), "department_name"],
			],
			include: [
				{
					model: Department,
					attributes: [],
				},
			],
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Indenting department not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER080: Error fetching indenting department by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get indenting department" });
	}
};
