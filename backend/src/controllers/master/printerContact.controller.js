import { Op, Sequelize } from "sequelize";
import { Printer, PrinterContact } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPrinterContacts = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await PrinterContact.findAndCountAll({
			where: { contact_person: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"printer_id",
				"contact_person",
				"email",
				"mobile_no",
				"profile_image",
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
				? "Printer contacts retrieved successfully"
				: "No printer contacts found",
		});
	} catch (error) {
		logger.error(
			`MASTER105: Error fetching printer contacts - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer contacts" });
	}
};

export const addPrinterContact = async (req, res) => {
	try {
		const { printer_id, contact_person, email, mobile_no, profile_image } =
			req.body;
		const userId = req.user?.user_id || 0;

		const exists = await PrinterContact.findOne({
			where: { printer_id, contact_person, is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Printer contact already exists" });

		await PrinterContact.create({
			printer_id,
			contact_person,
			email,
			mobile_no,
			profile_image,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Printer contact created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER106: Error creating printer contact - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create printer contact" });
	}
};

export const updatePrinterContact = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			printer_id,
			contact_person,
			email,
			mobile_no,
			profile_image,
			is_active,
		} = req.body;

		const item = await PrinterContact.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Printer contact not found" });

		const duplicate = await PrinterContact.findOne({
			where: {
				printer_id,
				contact_person,
				is_active: true,
				id: { [Op.ne]: id },
			},
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Printer contact already exists" });

		await item.update({
			printer_id,
			contact_person,
			email,
			mobile_no,
			profile_image,
			is_active,
		});
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Printer contact updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER107: Error updating printer contact - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update printer contact" });
	}
};

export const getPrinterContactById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrinterContact.findOne({
			where: { id },
			attributes: [
				"id",
				"printer_id",
				"contact_person",
				"email",
				"mobile_no",
				"profile_image",
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
				.json({ status: 0, message: "Printer contact not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER108: Error fetching printer contact by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer contact" });
	}
};
