import { Op } from "sequelize";
import { EditionType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getEditionTypes = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await EditionType.findAndCountAll({
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
				? "Edition types retrieved successfully"
				: "No edition types found",
		});
	} catch (error) {
		logger.error(`MASTER057: Error fetching edition types - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get edition types" });
	}
};

export const addEditionType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await EditionType.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Edition type already exists" });

		await EditionType.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Edition type created successfully",
		});
	} catch (error) {
		logger.error(`MASTER058: Error creating edition type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create edition type" });
	}
};

export const updateEditionType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const item = await EditionType.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Edition type not found" });

		const duplicate = await EditionType.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Edition type already exists" });

		await item.update({ name: name.trim(), is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Edition type updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER059: Error updating edition type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update edition type" });
	}
};

export const getEditionTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await EditionType.findOne({ where: { id } });
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Edition type not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER060: Error fetching edition type by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get edition type" });
	}
};
