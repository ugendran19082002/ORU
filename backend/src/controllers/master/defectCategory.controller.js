import { Op, Sequelize } from "sequelize";
import { DefectCategory, DefectType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

// GET Defect Categories List
export const getDefectCategories = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await DefectCategory.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: [
				"id",
				"name",
				"defect_type_id",
				"is_active",
				"created_on",
				[Sequelize.col("DefectType.name"), "defect_type_name"],
			],
			include: [
				{
					model: DefectType,
					attributes: [],
				},
			],
			order: [["id", "DESC"]],
			limit: Number(limit),
			offset: Number(offset),
		});

		logger.info("Defect categories retrieved successfully");
		return res.status(200).json({
			status: 1,
			data: {
				totalItems: count,
				totalPages: Math.ceil(count / limit),
				currentPage: Number(page),
				items: rows,
			},
			message: count
				? "Defect categories retrieved successfully"
				: "No defect categories found",
		});
	} catch (error) {
		logger.error(
			`MASTER029: Error fetching defect categories - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get defect categories",
		});
	}
};

export const addDefectCategory = async (req, res) => {
	try {
		const { name, defect_type_id } = req.body;
		const userId = req.user?.user_id || 0;

		await DefectCategory.create({
			name: name.trim(),
			defect_type_id,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return res.status(201).json({
			status: 1,
			data: [],
			message: "Defect category created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER030: Error creating defect category - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to create defect category",
		});
	}
};

export const updateDefectCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, defect_type_id, is_active } = req.body;

		const defectCategory = await DefectCategory.findByPk(id);

		if (!defectCategory) {
			logger.warn("Defect category not found");
			return res.status(404).json({
				status: 0,
				message: "Defect category not found",
			});
		}

		await defectCategory.update({
			name: name.trim(),
			defect_type_id,
			is_active,
		});

		logger.info("Defect category updated successfully");
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Defect category updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER031: Error updating defect category - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to update defect category",
		});
	}
};

export const getDefectCategoryById = async (req, res) => {
	try {
		const { id } = req.params;

		const defectCategory = await DefectCategory.findOne({
			where: {
				id,
			},
			attributes: [
				"id",
				"name",
				"defect_type_id",
				"is_active",
				[Sequelize.col("DefectType.name"), "defect_type_name"],
			],
			include: [
				{
					model: DefectType,
					attributes: [],
				},
			],
		});

		if (!defectCategory) {
			logger.warn("Defect category not found");
			return res.status(404).json({
				status: 0,
				message: "Defect category not found",
			});
		}

		return res.status(200).json({
			status: 1,
			data: defectCategory,
			message: "Defect category retrieved successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER032: Error fetching defect category by id - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get defect category",
		});
	}
};
