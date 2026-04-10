import { Op, Sequelize } from "sequelize";
import {
	MachineCategory,
	Printer,
	PrinterTechnicalDetail,
	PrintingType,
} from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPrinterTechnicalDetails = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await PrinterTechnicalDetail.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"printer_id",
				"printing_type_id",
				"machine_category_id",
				"specification",
				"make",
				"capacity_per_month",
				"is_active",
				"created_on",
				[Sequelize.col("Printer.name"), "printer_name"],
				[Sequelize.col("PrintingType.name"), "printing_type_name"],
				[Sequelize.col("MachineCategory.name"), "machine_category_name"],
			],
			include: [
				{
					model: Printer,
					attributes: [],
				},
				{
					model: PrintingType,
					attributes: [],
				},
				{
					model: MachineCategory,
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
				? "Printer technical details retrieved successfully"
				: "No printer technical details found",
		});
	} catch (error) {
		logger.error(
			`MASTER113: Error fetching printer technical details - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer technical details" });
	}
};

export const addPrinterTechnicalDetail = async (req, res) => {
	try {
		const {
			name,
			printer_id,
			printing_type_id,
			machine_category_id,
			specification,
			make,
			capacity_per_month,
			storage_area,
			binding_area,
		} = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await PrinterTechnicalDetail.findOne({
			where: { name: name.trim(), printer_id, is_active: true },
		});
		if (exists)
			return res.status(409).json({
				status: 0,
				message: "Printer technical detail already exists",
			});

		await PrinterTechnicalDetail.create({
			name: name.trim(),
			printer_id,
			printing_type_id,
			machine_category_id,
			specification,
			make,
			capacity_per_month,
			storage_area,
			binding_area,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Printer technical detail created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER114: Error creating printer technical detail - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to create printer technical detail",
		});
	}
};

export const updatePrinterTechnicalDetail = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			name,
			printer_id,
			printing_type_id,
			machine_category_id,
			specification,
			make,
			capacity_per_month,
			storage_area,
			binding_area,
			is_active,
		} = req.body;

		const item = await PrinterTechnicalDetail.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer technical detail not found" });

		const duplicate = await PrinterTechnicalDetail.findOne({
			where: {
				name: name.trim(),
				printer_id,
				is_active: true,
				id: { [Op.ne]: id },
			},
		});
		if (duplicate)
			return res.status(409).json({
				status: 0,
				message: "Printer technical detail already exists",
			});

		await item.update({
			name: name.trim(),
			printer_id,
			printing_type_id,
			machine_category_id,
			specification,
			make,
			capacity_per_month,
			storage_area,
			binding_area,
			is_active,
		});
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Printer technical detail updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER115: Error updating printer technical detail - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to update printer technical detail",
		});
	}
};

export const getPrinterTechnicalDetailById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrinterTechnicalDetail.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"printer_id",
				"printing_type_id",
				"machine_category_id",
				"specification",
				"make",
				"capacity_per_month",
				"is_active",
				"created_on",
				[Sequelize.col("Printer.name"), "printer_name"],
				[Sequelize.col("PrintingType.name"), "printing_type_name"],
				[Sequelize.col("MachineCategory.name"), "machine_category_name"],
			],
			include: [
				{
					model: Printer,
					attributes: [],
				},
				{
					model: PrintingType,
					attributes: [],
				},
				{
					model: MachineCategory,
					attributes: [],
				},
			],
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer technical detail not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER116: Error fetching printer technical detail by id - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get printer technical detail",
		});
	}
};
