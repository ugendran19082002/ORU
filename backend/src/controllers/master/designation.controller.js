import { Op, Sequelize } from "sequelize";
import { Department, Designation } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getDesignations = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await Designation.findAndCountAll({
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
				? "Designations retrieved successfully"
				: "No designations found",
		});
	} catch (error) {
		logger.error(`MASTER049: Error fetching designations - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get designations" });
	}
};

export const addDesignation = async (req, res) => {
	try {
		const { name, department_id } = req.body;
		console.log(department_id);
		const userId = req.user?.user_id || 0;

		const exists = await Designation.findOne({
			where: { name: name.trim(), department_id, is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Designation already exists" });

		await Designation.create({
			name: name.trim(),
			department_id: department_id,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Designation created successfully",
		});
	} catch (error) {
		logger.error(`MASTER050: Error creating designation - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create designation" });
	}
};

export const updateDesignation = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, department_id, is_active } = req.body;

		const item = await Designation.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Designation not found" });

		const duplicate = await Designation.findOne({
			where: {
				name: name.trim(),
				department_id,
				is_active: true,
				id: { [Op.ne]: id },
			},
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Designation already exists" });

		await item.update({ name: name.trim(), department_id, is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Designation updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER051: Error updating designation - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update designation" });
	}
};

export const getDesignationById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await Designation.findOne({
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
			where: { id },
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Designation not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER052: Error fetching designation by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get designation" });
	}
};
