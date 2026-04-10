import * as IndentService from "../../services/indent/IndentService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Indents (with pagination and search)
 */
export const getIndents = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await IndentService.getIndents(limitValue, offset, search);

		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count ? "Indents retrieved successfully" : "No indents found",
		);
	} catch (error) {
		logger.error(`INDENT001: Error fetching Indents - ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * CREATE Indent
 */
export const addIndent = async (req, res) => {
	try {
		const {
			book_id,
			academic_year_id,
			quantity,
			book_standard_id,
			book_medium_id,
			book_term_id,
			book_syllabus_id,
			indenting_department_id,
			godown_id,
			copy_type_id,
			buffer_quantity,
			roundoff_quantity,
			gross_indent_quantity,
			remarks,
		} = req.body;

		if (!book_id || !quantity) {
			return sendError(res, "Book and Quantity are required.", 400);
		}

		const newIndent = await IndentService.createIndent({
			academic_year_id: academic_year_id || 0,
			book_id,
			book_standard_id: book_standard_id || 0,
			book_medium_id: book_medium_id || 0,
			book_term_id: book_term_id || 0,
			book_syllabus_id: book_syllabus_id || 0,
			indenting_department_id: indenting_department_id || 0,
			godown_id: godown_id || req.user?.godown_id || 0,
			copy_type_id: copy_type_id || 0,
			quantity,
			buffer_quantity: buffer_quantity || 0,
			roundoff_quantity: roundoff_quantity || 0,
			gross_indent_quantity: gross_indent_quantity || 0,
			remarks: remarks || null,
			created_by: req.user?.user_id || 0,
			created_ip: req.ip || null,
		});

		return sendSuccess(res, newIndent, "Indent created successfully", 201);
	} catch (error) {
		logger.error(`INDENT002: Error creating Indent - ${error.message}`);
		return sendError(res, "Failed to create Indent");
	}
};

/**
 * GET Indent by ID
 */
export const getIndentById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return sendError(res, "ID is required", 400);

		const indent = await IndentService.getIndentById(id);

		if (!indent) return sendError(res, "Indent not found", 404);

		return sendSuccess(res, indent, "Fetched successfully");
	} catch (error) {
		logger.error(`INDENT003: Error fetching Indent by ID - ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * UPDATE Indent
 */
export const updateIndent = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			book_id,
			academic_year_id,
			quantity,
			book_standard_id,
			book_medium_id,
			book_term_id,
			book_syllabus_id,
			indenting_department_id,
			godown_id,
			copy_type_id,
			buffer_quantity,
			roundoff_quantity,
			gross_indent_quantity,
			remarks,
			is_active,
		} = req.body;

		if (!id) return sendError(res, "Indent ID is required", 400);

		const updated = await IndentService.updateIndent(id, {
			academic_year_id,
			book_id,
			book_standard_id,
			book_medium_id,
			book_term_id,
			book_syllabus_id,
			indenting_department_id,
			godown_id,
			copy_type_id,
			quantity,
			buffer_quantity,
			roundoff_quantity,
			gross_indent_quantity,
			remarks,
			is_active,
			updated_by: req.user?.user_id || 0,
			updated_ip: req.ip || null,
		});

		if (!updated) return sendError(res, "Indent not found", 404);

		return sendSuccess(res, updated, "Indent updated successfully");
	} catch (error) {
		logger.error(`INDENT004: Error updating Indent - ${error.message}`);
		return sendError(res, "Failed to update Indent");
	}
};
