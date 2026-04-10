import { Op } from "sequelize";
import { PrinterType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPrinterTypes = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await PrinterType.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
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
				? "Printer types retrieved successfully"
				: "No printer types found",
		});
	} catch (error) {
		logger.error(`MASTER117: Error fetching printer types - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer types" });
	}
};

export const addPrinterType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await PrinterType.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Printer type already exists" });

		await PrinterType.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Printer type created successfully",
		});
	} catch (error) {
		logger.error(`MASTER118: Error creating printer type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create printer type" });
	}
};

export const updatePrinterType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const item = await PrinterType.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer type not found" });

		const duplicate = await PrinterType.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Printer type already exists" });

		await item.update({ name: name.trim(), is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Printer type updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER119: Error updating printer type - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update printer type" });
	}
};

export const getPrinterTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrinterType.findOne({ where: { id } });
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer type not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER120: Error fetching printer type by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer type" });
	}
};
