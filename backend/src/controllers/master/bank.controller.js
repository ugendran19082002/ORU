import { Op } from "sequelize";
import { Bank } from "../../model/index.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

// GET Banks (pagination + search)
export const getBanks = async (req, res) => {
	try {
		const { page, limit, search = "" } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const { count, rows } = await Bank.findAndCountAll({
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
			count ? "Banks retrieved successfully" : "No banks found",
		);
	} catch (error) {
		logger.error(`MASTER009: Error fetching banks - ${error.message}`);
		return sendError(res, "Failed to get banks");
	}
};

// CREATE Bank
export const addBank = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const bank = await Bank.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(res, bank, "Bank created successfully", 201);
	} catch (error) {
		logger.error(`MASTER010: Error creating bank - ${error.message}`);
		return sendError(res, "Failed to create bank");
	}
};

// UPDATE Bank
export const updateBank = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const bank = await Bank.findOne({
			where: { id },
		});

		if (!bank) {
			return sendError(res, "Bank not found", 404);
		}

		await bank.update({
			name: name.trim(),
			is_active: is_active,
		});

		return sendSuccess(res, [], "Bank updated successfully");
	} catch (error) {
		logger.error(`MASTER011: Error updating bank - ${error.message}`);
		return sendError(res, "Failed to update bank");
	}
};

// GET Single Bank by ID
export const getBankById = async (req, res) => {
	try {
		const { id } = req.params;

		const bank = await Bank.findOne({
			where: { id },
			attributes: ["id", "name", "is_active"],
		});

		if (!bank) {
			return sendError(res, "Bank not found", 404);
		}

		return sendSuccess(res, bank, "Bank retrieved successfully");
	} catch (error) {
		logger.error(`MASTER012: Error fetching bank by id - ${error.message}`);
		return sendError(res, "Failed to get bank");
	}
};
