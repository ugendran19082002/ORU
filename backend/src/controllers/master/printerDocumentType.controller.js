import { Op, Sequelize } from "sequelize";
import { Printer, PrinterDocumentType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPrinterDocumentTypes = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await PrinterDocumentType.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"printer_id",
				"is_active",
				"created_on",
				[Sequelize.col("Printer.name"), "printer_name"],
			],
			include: [
				{
					model: Printer,
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
				? "Printer document types retrieved successfully"
				: "No printer document types found",
		});
	} catch (error) {
		logger.error(
			`MASTER109: Error fetching printer document types - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer document types" });
	}
};

export const addPrinterDocumentType = async (req, res) => {
	try {
		const { name, printer_id } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await PrinterDocumentType.findOne({
			where: { name: name.trim(), printer_id, is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Printer document type already exists" });

		await PrinterDocumentType.create({
			name: name.trim(),
			printer_id,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Printer document type created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER110: Error creating printer document type - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create printer document type" });
	}
};

export const updatePrinterDocumentType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, printer_id, is_active } = req.body;

		const item = await PrinterDocumentType.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer document type not found" });

		const duplicate = await PrinterDocumentType.findOne({
			where: {
				name: name.trim(),
				printer_id,
				is_active: true,
				id: { [Op.ne]: id },
			},
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Printer document type already exists" });

		await item.update({ name: name.trim(), printer_id, is_active });
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Printer document type updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER111: Error updating printer document type - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update printer document type" });
	}
};

export const getPrinterDocumentTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrinterDocumentType.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"printer_id",
				"is_active",
				"created_on",
				[Sequelize.col("Printer.name"), "printer_name"],
			],
			include: [
				{
					model: Printer,
					attributes: [],
				},
			],
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer document type not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER112: Error fetching printer document type by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer document type" });
	}
};
