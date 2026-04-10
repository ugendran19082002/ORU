import { Op } from "sequelize";
import { BindingType } from "../../model/index.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

// GET Binding Types (pagination + search)
export const getBindingTypes = async (req, res) => {
	try {
		const { page, limit, search = "" } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const { count, rows } = await BindingType.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: ["id", "name", "is_active", "created_on"],
			limit: limitValue,
			offset: offset,
			order: [["id", "DESC"]],
		});

		const pagingData = getPagingData({ count, rows }, pageValue, limitValue);
		return sendSuccess(
			res,
			pagingData,
			count ? "Binding types retrieved successfully" : "No binding types found",
		);
	} catch (error) {
		logger.error(`MASTER013: Error fetching binding types - ${error.message}`);
		return sendError(res, "Failed to get binding types");
	}
};

// CREATE Binding Type
export const addBindingType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const bindingType = await BindingType.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(
			res,
			bindingType,
			"Binding type created successfully",
			201,
		);
	} catch (error) {
		logger.error(`MASTER014: Error creating binding type - ${error.message}`);
		return sendError(res, "Failed to create binding type");
	}
};

// UPDATE Binding Type
export const updateBindingType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;
		const userId = req.user?.user_id || 0;

		const bindingType = await BindingType.findOne({
			where: { id },
		});

		if (!bindingType) {
			logger.info("Binding type not found");
			return sendError(res, "Binding type not found", 404);
		}

		await bindingType.update({
			name: name.trim(),
			is_active: is_active,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});
		logger.info("Binding type updated successfully");
		return sendSuccess(res, [], "Binding type updated successfully");
	} catch (error) {
		logger.error(`MASTER015: Error updating binding type - ${error.message}`);
		return sendError(res, "Failed to update binding type");
	}
};

// GET Binding Type by ID
export const getBindingTypeById = async (req, res) => {
	try {
		const { id } = req.params;

		const bindingType = await BindingType.findOne({
			where: {
				id,
			},
			attributes: ["id", "name", "is_active"],
		});

		if (!bindingType) {
			logger.info("Binding type not found");
			return sendError(res, "Binding type not found", 404);
		}
		logger.info("Binding type retrieved successfully");
		return sendSuccess(res, bindingType, "Binding type retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER016: Error fetching binding type by id - ${error.message}`,
		);
		return sendError(res, "Failed to get binding type");
	}
};
