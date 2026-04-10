import { Op, Sequelize } from "sequelize";
import { District, SubDistrict } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getSubDistricts = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await SubDistrict.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: [
				"id",
				"name",
				"is_active",
				[Sequelize.col("District.name"), "district_name"],
			],
			include: [
				{
					model: District,
					attributes: [],
					required: false,
				},
			],

			limit: Number(limit),
			offset: Number(offset),
			order: [["id", "DESC"]],
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
				? "Sub districts retrieved successfully"
				: "No sub districts found",
		});
	} catch (error) {
		logger.error(`MASTER157: Error fetching sub districts - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get sub districts" });
	}
};

export const getSubDistrictById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await SubDistrict.findOne({ where: { id } });
		if (!item) {
			logger.warn("Sub district not found");
			return res
				.status(404)
				.json({ status: 0, message: "Sub district not found" });
		}
		logger.info("Sub district retrieved successfully");
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER158: Error fetching sub district by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get sub district" });
	}
};

export const addSubDistrict = async (req, res) => {
	try {
		const { name, district_id } = req.body;
		const item = await SubDistrict.create({
			name: name.trim(),
			district_id,
		});
		logger.info("Sub district created successfully");
		return res.status(201).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(`MASTER159: Error creating sub district - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create sub district" });
	}
};

export const updateSubDistrict = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, district_id } = req.body;
		const item = await SubDistrict.findOne({ where: { id } });
		if (!item) {
			logger.warn("Sub district not found");
			return res
				.status(404)
				.json({ status: 0, message: "Sub district not found" });
		}
		await item.update({
			name,
			district_id,
		});
		logger.info("Sub district updated successfully");
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(`MASTER160: Error updating sub district - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update sub district" });
	}
};
