import { Op, Sequelize } from "sequelize";
import { ErrorCategory, ErrorSubCategory } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

// GET Error SubCategories List
export const getErrorSubCategories = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await ErrorSubCategory.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"error_category_id",
				"created_on",
				"is_active",
				"error_amount_percent",
				[Sequelize.col("ErrorCategory.name"), "error_category_name"],
			],
			include: [
				{
					model: ErrorCategory,
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
				? "Error subcategories retrieved successfully"
				: "No error subcategories found",
		});
	} catch (error) {
		logger.error(
			`MASTER065: Error fetching error subcategories - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get error subcategories" });
	}
};

export const addErrorSubCategory = async (req, res) => {
	try {
		const { name, error_category_id, error_amount_percent } = req.body;
		console.log(error_category_id);
		const userId = req.user?.user_id || 0;

		const exists = await ErrorSubCategory.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Error subcategory already exists" });

		await ErrorSubCategory.create({
			name: name.trim(),
			error_category_id: error_category_id,
			error_amount_percent: error_amount_percent || 0.0,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Error subcategory created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER066: Error creating error subcategory - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create error subcategory" });
	}
};

export const updateErrorSubCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, error_category_id, error_amount_percent, is_active } =
			req.body;

		const item = await ErrorSubCategory.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Error subcategory not found" });

		const duplicate = await ErrorSubCategory.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Error subcategory already exists" });

		await item.update({
			name: name.trim(),
			error_category_id,
			error_amount_percent,
			is_active,
		});
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Error subcategory updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER067: Error updating error subcategory - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update error subcategory" });
	}
};

export const getErrorSubCategoryById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await ErrorSubCategory.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"error_category_id",
				"is_active",
				"error_amount_percent",
				[Sequelize.col("ErrorCategory.name"), "error_category_name"],
			],
			include: [
				{
					model: ErrorCategory,
					attributes: [],
				},
			],
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Error subcategory not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER068: Error fetching error subcategory by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get error subcategory" });
	}
};
