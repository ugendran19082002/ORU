import { Op, Sequelize } from "sequelize";
import { District, Printer } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getPrinters = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await Printer.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"year_of_engagement",
				"latest_engagement_ref",
				"is_blacklisted",
				"address",
				"district_id",
				"mobile_no",
				"alternative_mobile_no",
				"email",
				"latitude",
				"longitude",
				"gst_no",
				"created_on",
				"is_active",
				[Sequelize.col("District.name"), "district_name"],
			],
			include: [
				{
					model: District,
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
			message: count ? "Printers retrieved successfully" : "No printers found",
		});
	} catch (error) {
		logger.error(`MASTER093: Error fetching printers - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printers" });
	}
};

export const addPrinter = async (req, res) => {
	try {
		const {
			name,
			year_of_engagement,
			latest_engagement_ref,
			is_blacklisted,
			address,
			district_id,
			office_email,
			mobile_no,
			alternative_mobile_no,
			email,
			latitude,
			longitude,
			gst_no,
		} = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await Printer.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Printer already exists" });

		const newPrinter = await Printer.create({
			name: name.trim(),
			year_of_engagement,
			latest_engagement_ref,
			is_blacklisted,
			address,
			district_id,
			office_email,
			mobile_no,
			alternative_mobile_no,
			email,
			latitude,
			longitude,
			gst_no,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: newPrinter,
			message: "Printer created successfully",
		});
	} catch (error) {
		logger.error(`MASTER094: Error creating printer - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create printer" });
	}
};

export const updatePrinter = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			name,
			year_of_engagement,
			latest_engagement_ref,
			is_blacklisted,
			address,
			district_id,
			office_email,
			mobile_no,
			alternative_mobile_no,
			email,
			latitude,
			longitude,
			gst_no,
			is_active,
		} = req.body;
		const userId = req.user?.user_id || 0;

		const item = await Printer.findByPk(id);
		if (!item)
			return res.status(404).json({ status: 0, message: "Printer not found" });

		const duplicate = await Printer.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Printer already exists" });

		await item.update({
			name: name.trim(),
			year_of_engagement,
			latest_engagement_ref,
			is_blacklisted,
			address,
			district_id,
			latitude,
			longitude,
			office_email,
			mobile_no,
			alternative_mobile_no,
			email,
			gst_no,
			is_active,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});
		return res
			.status(200)
			.json({ status: 1, data: [], message: "Printer updated successfully" });
	} catch (error) {
		logger.error(`MASTER095: Error updating printer - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update printer" });
	}
};

export const getPrinterById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await Printer.findOne({
			where: { id },
			include: [
				{
					model: District,
					attributes: ["id", "name"],
				},
			],
		});
		if (!item)
			return res.status(404).json({ status: 0, message: "Printer not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(`MASTER096: Error fetching printer by id - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get printer" });
	}
};
