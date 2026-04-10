import * as BookMasterService from "../../services/master/BookMasterService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Book Terms (with pagination and search)
 */
export const getBookTerms = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await BookMasterService.getBookTerms(
			limitValue,
			offset,
			search,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count ? "Book terms retrieved successfully" : "No book terms found",
		);
	} catch (error) {
		logger.error(`MASTER153: Error fetching book terms - ${error.message}`);
		return sendError(res, "Failed to get book terms");
	}
};

/**
 * CREATE Book Term
 */
export const addBookTerm = async (req, res) => {
	try {
		const { name, remarks, is_active } = req.body;

		if (!name) {
			return sendError(res, "Book term name is required", 400);
		}

		const newTerm = await BookMasterService.createBookTerm({
			name: name.trim(),
			remarks,
			is_active,
		});

		return sendSuccess(res, newTerm, "Book term created successfully", 201);
	} catch (error) {
		logger.error(`MASTER154: Error creating book term - ${error.message}`);
		return sendError(res, "Failed to create book term");
	}
};

/**
 * UPDATE Book Term
 */
export const updateBookTerm = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, remarks, is_active } = req.body;

		if (!name) {
			return sendError(res, "Book term name is required", 400);
		}

		const updated = await BookMasterService.updateBookTerm(id, {
			name: name.trim(),
			remarks,
			is_active,
		});

		if (!updated) {
			return sendError(res, "Book term not found", 404);
		}

		return sendSuccess(res, updated, "Book term updated successfully");
	} catch (error) {
		logger.error(`MASTER155: Error updating book term - ${error.message}`);
		return sendError(res, "Failed to update book term");
	}
};

/**
 * GET Book Term by ID
 */
export const getBookTermById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await BookMasterService.getBookTermById(id);

		if (!item) {
			return sendError(res, "Book term not found", 404);
		}

		return sendSuccess(res, item, "Book term retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER156: Error fetching book term by id - ${error.message}`,
		);
		return sendError(res, "Failed to get book term");
	}
};
