import * as BookMasterService from "../../services/master/BookMasterService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Book Syllabuses (with pagination and search)
 */
export const getBookSyllabuses = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await BookMasterService.getBookSyllabuses(
			limitValue,
			offset,
			search,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count
				? "Book syllabuses retrieved successfully"
				: "No book syllabuses found",
		);
	} catch (error) {
		logger.error(
			`MASTER161: Error fetching book syllabuses - ${error.message}`,
		);
		return sendError(res, "Failed to get book syllabuses");
	}
};

/**
 * CREATE Book Syllabus
 */
export const addBookSyllabus = async (req, res) => {
	try {
		const { name, district_id } = req.body;

		if (!name) {
			return sendError(res, "Book syllabus name is required", 400);
		}

		const newSyllabus = await BookMasterService.createBookSyllabus({
			name: name.trim(),
			district_id,
		});

		return sendSuccess(
			res,
			newSyllabus,
			"Book syllabus created successfully",
			201,
		);
	} catch (error) {
		logger.error(`MASTER163: Error creating book syllabus - ${error.message}`);
		return sendError(res, "Failed to create book syllabus");
	}
};

/**
 * UPDATE Book Syllabus
 */
export const updateBookSyllabus = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, district_id } = req.body;

		if (!name) {
			return sendError(res, "Book syllabus name is required", 400);
		}

		const updated = await BookMasterService.updateBookSyllabus(id, {
			name: name.trim(),
			district_id,
		});

		if (!updated) {
			return sendError(res, "Book syllabus not found", 404);
		}

		return sendSuccess(res, updated, "Book syllabus updated successfully");
	} catch (error) {
		logger.error(`MASTER164: Error updating book syllabus - ${error.message}`);
		return sendError(res, "Failed to update book syllabus");
	}
};

/**
 * GET Book Syllabus by ID
 */
export const getBookSyllabusById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await BookMasterService.getBookSyllabusById(id);

		if (!item) {
			return sendError(res, "Book syllabus not found", 404);
		}

		return sendSuccess(res, item, "Book syllabus retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER162: Error fetching book syllabus by id - ${error.message}`,
		);
		return sendError(res, "Failed to get book syllabus");
	}
};
