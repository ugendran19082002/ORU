import { Op, Sequelize } from "sequelize";
import {
	DeliveryPoint,
	Department,
	Designation,
	District,
	Godown,
	Organization,
	Printer,
	Role,
	User,
} from "../../model/index.js";
import { logger } from "../../utils/logger.js";
import { hashPassword } from "../../utils/password.js";

export const getUsers = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.body;
		const offset = (page - 1) * limit;

		const { count, rows } = await User.findAndCountAll({
			where: { username: { [Op.like]: `%${search}%` } },
			attributes: [
				"id",
				"username",
				"name",
				"department_id",
				"email",
				"mobile",
				"profile_image",
				"role_id",
				"designation_id",
				"organization_id",
				"is_active",
				"created_on",
				[Sequelize.col("Role.name"), "role_name"],
				[Sequelize.col("Designation.name"), "designation_name"],
				[Sequelize.col("Organization.name"), "organization_name"],
				[Sequelize.col("Department.name"), "department_name"],
				[Sequelize.col("District.name"), "district_name"],
				[Sequelize.col("DeliveryPoint.name"), "delivery_point_name"],
				[Sequelize.col("Godown.name"), "godown_name"],
				[Sequelize.col("Printer.name"), "printer_name"],
			],
			include: [
				{
					model: Role,
					attributes: [],
				},
				{
					model: Designation,
					attributes: [],
				},
				{
					model: Organization,
					attributes: [],
				},
				{
					model: Department,
					attributes: [],
				},
				{
					model: District,
					attributes: [],
				},
				{
					model: DeliveryPoint,
					attributes: [],
				},
				{
					model: Godown,
					attributes: [],
				},
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
			message: count ? "Users retrieved successfully" : "No users found",
		});
	} catch (error) {
		logger.error(`MASTER141: Error fetching users - ${error.message}`);
		return res.status(500).json({ status: 0, message: "Failed to get users" });
	}
};

export const addUser = async (req, res) => {
	try {
		const {
			username,
			password,
			role_id,
			designation_id,
			name,
			email,
			department_id,
			district_id,
			mobile,
			organization_id,
			profile_image,
			delivery_point_id,
			godown_id,
			printer_id,
		} = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await User.findOne({
			where: { username: username.trim() },
		});
		if (exists)
			return res
				.status(409)
				.json({ status: 0, message: "User already exists" });

		const hashedPasswordValue = await hashPassword(password);

		let finalDistrictId = district_id;

		if (delivery_point_id) {
			const deliveryPoint = await DeliveryPoint.findByPk(delivery_point_id);
			if (!deliveryPoint) {
				finalDistrictId = deliveryPoint.district_id;
			}
		}
		if (godown_id) {
			const godown = await Godown.findByPk(godown_id);
			if (!godown) {
				finalDistrictId = godown.district_id;
			}
		}
		if (printer_id) {
			const printer = await Printer.findByPk(printer_id);
			if (!printer) {
				finalDistrictId = printer.district_id;
			}
		}

		await User.create({
			username: username.trim(),
			password: hashedPasswordValue,
			role_id,
			designation_id,
			name,
			email,
			profile_image,
			district_id: finalDistrictId || district_id,
			department_id,
			mobile,
			delivery_point_id,
			printer_id,
			godown_id,
			organization_id: organization_id || 1,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return res
			.status(201)
			.json({ status: 1, data: [], message: "User created successfully" });
	} catch (error) {
		logger.error(`MASTER142: Error creating user - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to create user" });
	}
};

export const updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			username,
			role_id,
			designation_id,
			department_id,
			name,
			email,
			mobile,
			district_id,
			organization_id,
			is_active,
			profile_image,
			delivery_point_id,
			godown_id,
			printer_id,
		} = req.body;
		const userId = req.user?.user_id || 0;

		const item = await User.findByPk(id);
		if (!item)
			return res.status(404).json({ status: 0, message: "User not found" });

		const duplicate = await User.findOne({
			where: {
				username: username.trim(),
				id: { [Op.ne]: id },
			},
		});
		if (duplicate)
			return res
				.status(409)
				.json({ status: 0, message: "User already exists" });

		let finalDistrictId = district_id;

		if (delivery_point_id) {
			const deliveryPoint = await DeliveryPoint.findByPk(delivery_point_id);
			if (!deliveryPoint) {
				finalDistrictId = deliveryPoint.district_id;
			}
		}
		if (godown_id) {
			const godown = await Godown.findByPk(godown_id);
			if (!godown) {
				finalDistrictId = godown.district_id;
			}
		}
		if (printer_id) {
			const printer = await Printer.findByPk(printer_id);
			if (!printer) {
				finalDistrictId = printer.district_id;
			}
		}

		await item.update({
			username: username.trim(),
			role_id,
			designation_id,
			name,
			email,
			mobile,
			organization_id,
			district_id: finalDistrictId || district_id,
			profile_image,
			department_id,
			is_active,
			printer_id,
			delivery_point_id,
			godown_id,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});
		return res
			.status(200)
			.json({ status: 1, data: [], message: "User updated successfully" });
	} catch (error) {
		logger.error(`MASTER143: Error updating user - ${error.message}`);
		return res
			.status(500)
			.json({ status: 0, message: "Failed to update user" });
	}
};

export const getUserById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await User.findOne({
			where: { id },
			attributes: [
				"id",
				"username",
				"role_id",
				"designation_id",
				"department_id",
				"profile_image",
				"name",
				"district_id",
				"printer_id",
				"delivery_point_id",
				"godown_id",
				"email",
				"mobile",
				"organization_id",
				"is_active",
				[Sequelize.col("Role.name"), "role_name"],
				[Sequelize.col("Designation.name"), "designation_name"],
				[Sequelize.col("Organization.name"), "organization_name"],
				[Sequelize.col("Department.name"), "department_name"],
				[Sequelize.col("District.name"), "district_name"],
			],
			include: [
				{
					model: Role,
					attributes: [],
				},
				{
					model: Designation,
					attributes: [],
				},
				{
					model: Organization,
					attributes: [],
				},
				{
					model: Department,
					attributes: [],
				},
				{
					model: District,
					attributes: [],
				},
			],
		});

		if (!item)
			return res.status(404).json({ status: 0, message: "User not found" });

		return res.status(200).json({ status: 1, data: item, message: "Success" });
	} catch (error) {
		logger.error(`MASTER144: Error fetching user by id - ${error.message}`);
		return res.status(500).json({ status: 0, message: "Failed to get user" });
	}
};
