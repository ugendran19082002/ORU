import { Op } from "sequelize";
import { PaperType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPaperTypes = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await PaperType.findAndCountAll({
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
				? "Paper types retrieved successfully"
				: "No paper types found",
		});
	} catch (error) {
		logger.error(`MASTER089: Error fetching paper types - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get paper types" });
	}
};

export const addPaperType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await PaperType.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Paper type already exists" });

		await PaperType.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Paper type created successfully",
		});
	} catch (error) {
		logger.error(`MASTER090: Error creating paper type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create paper type" });
	}
};

export const updatePaperType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const item = await PaperType.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Paper type not found" });

		const duplicate = await PaperType.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Paper type already exists" });

		await item.update({ name: name.trim(), is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Paper type updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER091: Error updating paper type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update paper type" });
	}
};

export const getPaperTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PaperType.findOne({ where: { id } });
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Paper type not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER092: Error fetching paper type by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get paper type" });
	}
};
