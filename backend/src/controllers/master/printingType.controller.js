import * as PrintingService from "../../services/master/PrintingService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Printing Types (with pagination and search)
 */
export const getPrintingTypes = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await PrintingService.getPrintingTypes(
			limitValue,
			offset,
			search,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count
				? "Printing types retrieved successfully"
				: "No printing types found",
		);
	} catch (error) {
		logger.error(`MASTER125: Error fetching printing types - ${error.message}`);
		return sendError(res, "Failed to get printing types");
	}
};

/**
 * CREATE Printing Type
 */
export const addPrintingType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		if (!name) {
			return sendError(res, "Printing type name is required", 400);
		}

		const exists = await PrintingService.findPrintingTypeByName(name);
		if (exists) {
			return sendError(res, "Printing type already exists", 409);
		}

		const newType = await PrintingService.createPrintingType({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(res, newType, "Printing type created successfully", 201);
	} catch (error) {
		logger.error(`MASTER126: Error creating printing type - ${error.message}`);
		return sendError(res, "Failed to create printing type");
	}
};

/**
 * UPDATE Printing Type
 */
export const updatePrintingType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;

		if (!name) {
			return sendError(res, "Printing type name is required", 400);
		}

		const item = await PrintingService.getPrintingTypeById(id);
		if (!item) {
			return sendError(res, "Printing type not found", 404);
		}

		const duplicate = await PrintingService.findPrintingTypeByName(name, id);
		if (duplicate) {
			return sendError(res, "Printing type already exists", 409);
		}

		await PrintingService.updatePrintingType(id, {
			name: name.trim(),
			is_active,
		});

		return sendSuccess(res, [], "Printing type updated successfully");
	} catch (error) {
		logger.error(`MASTER127: Error updating printing type - ${error.message}`);
		return sendError(res, "Failed to update printing type");
	}
};

/**
 * GET Printing Type by ID
 */
export const getPrintingTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrintingService.getPrintingTypeById(id);

		if (!item) {
			return sendError(res, "Printing type not found", 404);
		}

		return sendSuccess(res, item, "Printing type retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER128: Error fetching printing type by id - ${error.message}`,
		);
		return sendError(res, "Failed to get printing type");
	}
};
