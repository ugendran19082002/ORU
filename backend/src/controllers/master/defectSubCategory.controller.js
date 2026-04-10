import { Op, Sequelize } from "sequelize";
import { DefectCategory, DefectSubCategory } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

// GET Defect SubCategories List
export const getDefectSubCategories = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await DefectSubCategory.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: [
				"id",
				"name",
				"defect_category_id",
				"defect_amount_percent",
				"is_active",
				"created_on",
				[Sequelize.col("DefectCategory.name"), "defect_category_name"],
			],
			include: [
				{
					model: DefectCategory,
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
				? "Defect subcategories retrieved successfully"
				: "No defect subcategories found",
		});
	} catch (error) {
		logger.error(
			`MASTER033: Error fetching defect subcategories - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get defect subcategories",
		});
	}
};

export const addDefectSubCategory = async (req, res) => {
	try {
		const { name, defect_category_id, defect_amount_percent } = req.body;
		const userId = req.user?.user_id || 0;

		await DefectSubCategory.create({
			name: name.trim(),
			defect_category_id,
			defect_amount_percent: defect_amount_percent || 0.0,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return res.status(201).json({
			status: 1,
			data: [],
			message: "Defect subcategory created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER034: Error creating defect subcategory - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to create defect subcategory",
		});
	}
};

export const updateDefectSubCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, defect_category_id, defect_amount_percent, is_active } =
			req.body;

		const defectSubCategory = await DefectSubCategory.findByPk(id);

		if (!defectSubCategory) {
			return res.status(404).json({
				status: 0,
				message: "Defect subcategory not found",
			});
		}

		await defectSubCategory.update({
			name: name.trim(),
			defect_category_id,
			defect_amount_percent,
			is_active,
		});

		return res.status(200).json({
			status: 1,
			data: [],
			message: "Defect subcategory updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER035: Error updating defect subcategory - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to update defect subcategory",
		});
	}
};

export const getDefectSubCategoryById = async (req, res) => {
	try {
		const { id } = req.params;

		const defectSubCategory = await DefectSubCategory.findOne({
			where: {
				id,
			},
			attributes: [
				"id",
				"name",
				"defect_category_id",
				"is_active",
				"defect_amount_percent",
				[Sequelize.col("DefectCategory.name"), "defect_category_name"],
			],
			include: [
				{
					model: DefectCategory,
					attributes: [],
				},
			],
		});

		if (!defectSubCategory) {
			return res.status(404).json({
				status: 0,
				message: "Defect subcategory not found",
			});
		}

		return res.status(200).json({
			status: 1,
			data: defectSubCategory,
			message: "Defect subcategory retrieved successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER036: Error fetching defect subcategory by id - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get defect subcategory",
		});
	}
};
