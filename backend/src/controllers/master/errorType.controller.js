import { Op } from "sequelize";
import { ErrorType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

// GET Error Types List
export const getErrorTypes = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await ErrorType.findAndCountAll({
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
				? "Error types retrieved successfully"
				: "No error types found",
		});
	} catch (error) {
		logger.error(`MASTER069: Error fetching error types - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get error types" });
	}
};

export const addErrorType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await ErrorType.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Error type already exists" });

		await ErrorType.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Error type created successfully",
		});
	} catch (error) {
		logger.error(`MASTER070: Error creating error type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create error type" });
	}
};

export const updateErrorType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const item = await ErrorType.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Error type not found" });

		const duplicate = await ErrorType.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Error type already exists" });

		await item.update({ name: name.trim(), is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Error type updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER071: Error updating error type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update error type" });
	}
};

export const getErrorTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await ErrorType.findOne({ where: { id } });
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Error type not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER072: Error fetching error type by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get error type" });
	}
};
