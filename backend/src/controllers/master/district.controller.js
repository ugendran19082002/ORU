import { Op } from "sequelize";
import { District } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getDistricts = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await District.findAndCountAll({
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
				? "Districts retrieved successfully"
				: "No districts found",
		});
	} catch (error) {
		logger.error(`MASTER053: Error fetching districts - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get districts" });
	}
};

export const addDistrict = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await District.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "District already exists" });

		await District.create({
			name: name.trim(),
			state_id: 1,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res
			.status(201)
			.json({ status: 1, data: [], message: "District created successfully" });
	} catch (error) {
		logger.error(`MASTER054: Error creating district - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create district" });
	}
};

export const updateDistrict = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const item = await District.findByPk(id);
		if (!item)
			return res.status(404).json({ status: 0, message: "District not found" });

		const duplicate = await District.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "District already exists" });

		await item.update({ name: name.trim(), is_active });
		return res
			.status(200)
			.json({ status: 1, data: [], message: "District updated successfully" });
	} catch (error) {
		logger.error(`MASTER055: Error updating district - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update district" });
	}
};

export const getDistrictById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await District.findOne({ where: { id } });
		if (!item)
			return res.status(404).json({ status: 0, message: "District not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(`MASTER056: Error fetching district by id - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get district" });
	}
};
