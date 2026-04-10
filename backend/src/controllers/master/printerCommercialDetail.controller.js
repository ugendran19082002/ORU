import { Op, Sequelize } from "sequelize";
import { Printer, PrinterCommercialDetail } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPrinterCommercialDetails = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await PrinterCommercialDetail.findAndCountAll({
			where: { type: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"printer_id",
				"type",
				"start_date",
				"valid_date",
				"ref_no",
				"risk_coverage_clause",
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
				? "Printer commercial details retrieved successfully"
				: "No printer commercial details found",
		});
	} catch (error) {
		logger.error(
			`MASTER101: Error fetching printer commercial details - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get printer commercial details",
		});
	}
};

export const addPrinterCommercialDetail = async (req, res) => {
	try {
		const {
			printer_id,
			type,
			start_date,
			valid_date,
			ref_no,
			risk_coverage_clause,
		} = req.body;
		const userId = req.user?.user_id || 0;

		await PrinterCommercialDetail.create({
			printer_id,
			type,
			start_date,
			valid_date,
			ref_no,
			risk_coverage_clause,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Printer commercial detail created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER102: Error creating printer commercial detail - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to create printer commercial detail",
		});
	}
};

export const updatePrinterCommercialDetail = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			printer_id,
			type,
			start_date,
			valid_date,
			ref_no,
			risk_coverage_clause,
			is_active,
		} = req.body;

		const item = await PrinterCommercialDetail.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer commercial detail not found" });

		await item.update({
			printer_id,
			type,
			start_date,
			valid_date,
			ref_no,
			risk_coverage_clause,
			is_active,
		});
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Printer commercial detail updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER103: Error updating printer commercial detail - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to update printer commercial detail",
		});
	}
};

export const getPrinterCommercialDetailById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrinterCommercialDetail.findOne({
			where: { id },
			attributes: [
				"id",
				"printer_id",
				"type",
				"start_date",
				"valid_date",
				"ref_no",
				"risk_coverage_clause",
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
				.json({ status: 0, message: "Printer commercial detail not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER104: Error fetching printer commercial detail by id - ${error.message}`,
		);
		return res.status(500).json({
			status: 0,
			message: "Failed to get printer commercial detail",
		});
	}
};
