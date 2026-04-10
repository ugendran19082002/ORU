import { Op, Sequelize } from "sequelize";
import { ErrorCategory, ErrorType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

// GET Error Categories List
export const getErrorCategories = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await ErrorCategory.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"error_type_id",
				"created_on",
				"is_active",
				[Sequelize.col("ErrorType.name"), "error_type_name"],
			],
			include: [
				{
					model: ErrorType,
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
				? "Error categories retrieved successfully"
				: "No error categories found",
		});
	} catch (error) {
		logger.error(
			`MASTER061: Error fetching error categories - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get error categories" });
	}
};

export const addErrorCategory = async (req, res) => {
	try {
		const { name, error_type_id } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await ErrorCategory.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Error category already exists" });

		await ErrorCategory.create({
			name: name.trim(),
			error_type_id,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Error category created successfully",
		});
	} catch (error) {
		logger.error(`MASTER062: Error creating error category - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create error category" });
	}
};

export const updateErrorCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, error_type_id, is_active } = req.body;

		const item = await ErrorCategory.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Error category not found" });

		const duplicate = await ErrorCategory.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Error category already exists" });

		await item.update({ name: name.trim(), error_type_id, is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Error category updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER063: Error updating error category - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update error category" });
	}
};

export const getErrorCategoryById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await ErrorCategory.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"error_type_id",
				"is_active",
				[Sequelize.col("ErrorType.name"), "error_type_name"],
			],
			include: [
				{
					model: ErrorType,
					attributes: [],
				},
			],
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Error category not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER064: Error fetching error category by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get error category" });
	}
};
