import { Op } from "sequelize";
import { MachineCategory } from "../../model/index.js";
import { logger } from "../../utils/logger.js";

export const getMachineCategories = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await MachineCategory.findAndCountAll({
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
				? "Machine categories retrieved successfully"
				: "No machine categories found",
		});
	} catch (error) {
		logger.error(
			`MASTER081: Error fetching machine categories - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get machine categories" });
	}
};

export const addMachineCategory = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await MachineCategory.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "Machine category already exists" });

		await MachineCategory.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res.status(201).json({
			status: 1,
			data: [],
			message: "Machine category created successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER082: Error creating machine category - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create machine category" });
	}
};

export const updateMachineCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;
		const userId = req.user?.user_id || 0;

		const item = await MachineCategory.findByPk(id);
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Machine category not found" });

		const duplicate = await MachineCategory.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "Machine category already exists" });

		await item.update({
			name: name.trim(),
			is_active,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});
		return res.status(200).json({
			status: 1,
			data: [],
			message: "Machine category updated successfully",
		});
	} catch (error) {
		logger.error(
			`MASTER083: Error updating machine category - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update machine category" });
	}
};

export const getMachineCategoryById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await MachineCategory.findOne({
			where: { id },
		});
		if (!item)
			return res
				.status(404)
				.json({ status: 0, message: "Machine category not found" });
		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(
			`MASTER084: Error fetching machine category by id - ${error.message}`,
		);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to get machine category" });
	}
};
