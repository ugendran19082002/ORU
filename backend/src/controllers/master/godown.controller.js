import { Op, Sequelize } from "sequelize";
import { District, Godown } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getGodowns = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await Godown.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"name",
				"short_code",
				"mobile_no",
				"email",
				"address",
				"latitude",
				"longitude",
				"district_id",
				"is_active",
				"created_on",
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
			message: count ? "Godowns retrieved successfully" : "No godowns found",
		});
	} catch (error) {
		logger.error(`MASTER073: Error fetching godowns - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get godowns" });
	}
};

export const addGodown = async (req, res) => {
	try {
		const {
			name,
			short_code,
			mobile_no,
			email,
			address,
			latitude,
			longitude,
			district_id,
		} = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await Godown.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Godown already exists" });

		await Godown.create({
			name: name.trim(),
			short_code,
			mobile_no,
			email,
			address,
			latitude,
			longitude,
			district_id,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res
			.status(201)
			.json({ status: 1, data: [], message: "Godown created successfully" });
	} catch (error) {
		logger.error(`MASTER074: Error creating godown - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create godown" });
	}
};

export const updateGodown = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			name,
			short_code,
			mobile_no,
			email,
			address,
			latitude,
			longitude,
			district_id,
			is_active,
		} = req.body;

		const item = await Godown.findByPk(id);
		if (!item)
			return res.status(404).json({ status: 0, message: "Godown not found" });

		const duplicate = await Godown.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Godown already exists" });

		await item.update({
			name: name.trim(),
			short_code,
			mobile_no,
			email,
			address,
			latitude,
			longitude,
			district_id,
			is_active,
		});
		return res
			.status(200)
			.json({ status: 1, data: [], message: "Godown updated successfully" });
	} catch (error) {
		logger.error(`MASTER075: Error updating godown - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update godown" });
	}
};

export const getGodownById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await Godown.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"short_code",
				"mobile_no",
				"email",
				"address",
				"latitude",
				"longitude",
				"district_id",
				"is_active",
				"created_on",
				[Sequelize.col("District.name"), "district_name"],
			],
			include: [
				{
					model: District,
					attributes: [],
				},
			],
		});
		if (!item)
			return res.status(404).json({ status: 0, message: "Godown not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(`MASTER076: Error fetching godown by id - ${error.message}`);
		return res.status(500).json({ status: 0, message: "Failed to get godown" });
	}
};
