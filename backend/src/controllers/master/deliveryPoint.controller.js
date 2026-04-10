import { Op, Sequelize } from "sequelize";
import { DeliveryPoint, District } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getDeliveryPoints = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await DeliveryPoint.findAndCountAll({
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
			message: count
				? "Delivery points retrieved successfully"
				: "No delivery points found",
		});
	} catch (error) {
		logger.error(
			`MASTER041: Error fetching delivery points - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get delivery points" });
	}
};

export const addDeliveryPoint = async (req, res) => {
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

		await DeliveryPoint.create({
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
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Delivery point created successfully",
		});
	} catch (error) {
		logger.error(`MASTER042: Error creating delivery point - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create delivery point" });
	}
};

export const updateDeliveryPoint = async (req, res) => {
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

		const item = await DeliveryPoint.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Delivery point not found" });

		const duplicate = await DeliveryPoint.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Delivery point already exists" });

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
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Delivery point updated successfully",
		});
	} catch (error) {
		logger.error(`MASTER043: Error updating delivery point - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update delivery point" });
	}
};

export const getDeliveryPointById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await DeliveryPoint.findOne({
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
			return res
				.status(404)
				.json({ status: 0, message: "Delivery point not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER044: Error fetching delivery point by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get delivery point" });
	}
};
