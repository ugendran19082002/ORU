import { Op, Sequelize } from "sequelize";
import { Bank, Printer, PrinterBank } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPrinterBanks = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await PrinterBank.findAndCountAll({
			where: { holder_name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"printer_id",
				"bank_id",
				"bank_branch",
				"holder_name",
				"ifsc_code",
				"account_number",
				"account_type",
				"created_on",
				"is_active",
				[Sequelize.col("Printer.name"), "printer_name"],
				[Sequelize.col("Bank.name"), "bank_name"],
			],
			include: [
				{
					model: Printer,
					attributes: [],
				},
				{
					model: Bank,
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
				? "Printer banks retrieved successfully"
				: "No printer banks found",
		});
	} catch (error) {
		logger.error(`MASTER097: Error fetching printer banks - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer banks" });
	}
};

export const addPrinterBank = async (req, res) => {
	try {
		const {
			printer_id,
			bank_id,
			bank_branch,
			holder_name,
			ifsc_code,
			account_number,
			account_type,
		} = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await PrinterBank.findOne({
			where: { printer_id, bank_id, account_number, is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Printer bank account already exists" });

		await PrinterBank.create({
			printer_id,
			bank_id,
			bank_branch,
			holder_name,
			ifsc_code,
			account_number,
			account_type,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Printer bank created successfully",
		});
	} catch (error) {
		logger.error(`MASTER098: Error creating printer bank - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create printer bank" });
	}
};

export const updatePrinterBank = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			printer_id,
			bank_id,
			bank_branch,
			holder_name,
			ifsc_code,
			account_number,
			account_type,
			is_active,
		} = req.body;

		const item = await PrinterBank.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer bank not found" });

		const duplicate = await PrinterBank.findOne({
			where: {
				printer_id,
				bank_id,
				account_number,
				is_active: true,
				id: { [Op.ne]: id },
			},
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Printer bank account already exists" });

		await item.update({
			printer_id,
			bank_id,
			bank_branch,
			holder_name,
			ifsc_code,
			account_number,
			account_type,
			is_active,
		});
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Printer bank updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER099: Error updating printer bank - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update printer bank" });
	}
};

export const getPrinterBankById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrinterBank.findOne({
			where: { id },
			attributes: [
				"id",
				"printer_id",
				"bank_id",
				"bank_branch",
				"holder_name",
				"ifsc_code",
				"account_number",
				"account_type",
				"is_active",
				"created_on",
				[Sequelize.col("Printer.name"), "printer_name"],
				[Sequelize.col("Bank.name"), "bank_name"],
			],
			include: [
				{
					model: Printer,
					attributes: [],
				},
				{
					model: Bank,
					attributes: [],
				},
			],
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer bank not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER100: Error fetching printer bank by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer bank" });
	}
};
