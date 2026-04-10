import { Op } from "sequelize";
import { DefectType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

// GET Defect Types List
export const getDefectTypes = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await DefectType.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: ["id", "name", "is_active", "created_on"],
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
				? "Defect types retrieved successfully"
				: "No defect types found",
		});
	} catch (error) {
		logger.error(`MASTER037: Error fetching defect types - ${error.message}`);
		return res.status(500).json({
			status: 0,
			message: "Failed to get defect types",
		});
	}
};

export const addDefectType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		await DefectType.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return res.status(201).json({
			status: 1,
			data: [],
			message: "Defect type created successfully",
		});
	} catch (error) {
		logger.error(`MASTER038: Error creating defect type - ${error.message}`);
		return res.status(500).json({
			status: 0,
			message: "Failed to create defect type",
		});
	}
};

export const updateDefectType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const defectType = await DefectType.findByPk(id);

		if (!defectType) {
			return res.status(404).json({
				status: 0,
				message: "Defect type not found",
			});
		}

		await defectType.update({
			name: name.trim(),
			is_active,
		});

		return res.status(200).json({
			status: 1,
			data: [],
			message: "Defect type updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER039: Error updating defect type - ${error.message}`);
		return res.status(500).json({
			status: 0,
			message: "Failed to update defect type",
		});
	}
};

export const getDefectTypeById = async (req, res) => {
	try {
		const { id } = req.params;

		const defectType = await DefectType.findOne({
			where: {
				id,
			},
			attributes: ["id", "name", "is_active"],
		});

		if (!defectType) {
			return res.status(404).json({
				status: 0,
				message: "Defect type not found",
			});
		}

		return res.status(200).json({
			status: 1,
			data: defectType,
			message: "Defect type retrieved successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER040: Error fetching defect type by id - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get defect type",
		});
	}
};
