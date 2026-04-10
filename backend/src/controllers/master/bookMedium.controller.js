import { Op } from "sequelize";
import { BookMedium } from "../../model/index.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

// GET Book Mediums List
export const getBookMediums = async (req, res) => {
	try {
		const { page, limit, search = "" } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const { count, rows } = await BookMedium.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: ["id", "name", "is_active", "created_on"],
			order: [["id", "DESC"]],
			limit: limitValue,
			offset: offset,
		});

		const pagingData = getPagingData({ count, rows }, pageValue, limitValue);
		return sendSuccess(
			res,
			pagingData,
			count ? "Book mediums retrieved successfully" : "No book mediums found",
		);
	} catch (error) {
		logger.error(`MASTER021: Error fetching book mediums - ${error.message}`);
		return sendError(res, "Failed to get book mediums");
	}
};

export const addBookMedium = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const _bookMedium = await BookMedium.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(res, [], "Book medium created successfully", 201);
	} catch (error) {
		logger.error(`MASTER022: Error creating book medium - ${error.message}`);
		return sendError(res, "Failed to create book medium");
	}
};

export const updateBookMedium = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const bookMedium = await BookMedium.findByPk(id);

		if (!bookMedium) {
			return sendError(res, "Book medium not found", 404);
		}

		await bookMedium.update({
			name: name.trim(),
			is_active,
		});

		return sendSuccess(res, [], "Book medium updated successfully");
	} catch (error) {
		logger.error(`MASTER023: Error updating book medium - ${error.message}`);
		return sendError(res, "Failed to update book medium");
	}
};

export const getBookMediumById = async (req, res) => {
	try {
		const { id } = req.params;

		const bookMedium = await BookMedium.findOne({
			where: {
				id,
			},
			attributes: ["id", "name", "is_active"],
		});

		if (!bookMedium) {
			return sendError(res, "Book medium not found", 404);
		}

		return sendSuccess(res, bookMedium, "Book medium retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER024: Error fetching book medium by id - ${error.message}`,
		);
		return sendError(res, "Failed to get book medium");
	}
};
