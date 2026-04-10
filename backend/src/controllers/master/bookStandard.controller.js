import { Op } from "sequelize";
import { BookStandard } from "../../model/index.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

// GET Book Standards
export const getBookStandards = async (req, res) => {
	try {
		const { page, limit, search = "" } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const { count, rows } = await BookStandard.findAndCountAll({
			where: { name: { [Op.like]: `%${search}%` } },
			attributes: ["id", "name", "is_active", "created_on"],
			order: [["id", "ASC"]],
			limit: limitValue,
			offset: offset,
		});

		const pagingData = getPagingData({ count, rows }, pageValue, limitValue);
		return sendSuccess(
			res,
			pagingData,
			count
				? "Book standards retrieved successfully"
				: "No book standards found",
		);
	} catch (error) {
		logger.error(`MASTER129: Error fetching book standards - ${error.message}`);
		return sendError(res, "Failed to get book standards");
	}
};

export const addBookStandard = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		const exists = await BookStandard.findOne({
			where: { name: name.trim(), is_active: true },
		});
		if (exists) return sendError(res, "Book standard already exists", 409);

		await BookStandard.create({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});
		return sendSuccess(res, [], "Book standard created successfully", 201);
	} catch (error) {
		logger.error(`MASTER130: Error creating book standard - ${error.message}`);
		return sendError(res, "Failed to create book standard");
	}
};

export const updateBookStandard = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		const item = await BookStandard.findByPk(id);
		if (!item) return sendError(res, "Book standard not found", 404);

		const duplicate = await BookStandard.findOne({
			where: { name: name.trim(), is_active: true, id: { [Op.ne]: id } },
		});
		if (duplicate) return sendError(res, "Book standard already exists", 409);

		await item.update({ name: name.trim(), is_active });
		return sendSuccess(res, [], "Book standard updated successfully");
	} catch (error) {
		logger.error(`MASTER131: Error updating book standard - ${error.message}`);
		return sendError(res, "Failed to update book standard");
	}
};

export const getBookStandardById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await BookStandard.findOne({ where: { id } });
		if (!item) return sendError(res, "Book standard not found", 404);
		return sendSuccess(res, item, "Success");
	} catch (error) {
		logger.error(
			`MASTER132: Error fetching book standard by id - ${error.message}`,
		);
		return sendError(res, "Failed to get book standard");
	}
};
