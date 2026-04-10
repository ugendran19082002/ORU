import * as TransportationService from "../../services/master/TransportationService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Transportation Types (with pagination and search)
 */
export const getTransportationTypes = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await TransportationService.getTransportationTypes(
			limitValue,
			offset,
			search,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count
				? "Transportation types retrieved successfully"
				: "No transportation types found",
		);
	} catch (error) {
		logger.error(
			`MASTER137: Error fetching transportation types - ${error.message}`,
		);
		return sendError(res, "Failed to get transportation types");
	}
};

/**
 * CREATE Transportation Type
 */
export const addTransportationType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		if (!name) {
			return sendError(res, "Transportation type name is required", 400);
		}

		const exists =
			await TransportationService.findTransportationTypeByName(name);
		if (exists) {
			return sendError(res, "Transportation type already exists", 409);
		}

		const newType = await TransportationService.createTransportationType({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(
			res,
			newType,
			"Transportation type created successfully",
			201,
		);
	} catch (error) {
		logger.error(
			`MASTER138: Error creating transportation type - ${error.message}`,
		);
		return sendError(res, "Failed to create transportation type");
	}
};

/**
 * UPDATE Transportation Type
 */
export const updateTransportationType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;
		const userId = req.user?.user_id || 0;

		if (!name) {
			return sendError(res, "Transportation type name is required", 400);
		}

		const item = await TransportationService.getTransportationTypeById(id);
		if (!item) {
			return sendError(res, "Transportation type not found", 404);
		}

		const duplicate = await TransportationService.findTransportationTypeByName(
			name,
			id,
		);
		if (duplicate) {
			return sendError(res, "Transportation type already exists", 409);
		}

		await TransportationService.updateTransportationType(id, {
			name: name.trim(),
			is_active,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});

		return sendSuccess(res, [], "Transportation type updated successfully");
	} catch (error) {
		logger.error(
			`MASTER139: Error updating transportation type - ${error.message}`,
		);
		return sendError(res, "Failed to update transportation type");
	}
};

/**
 * GET Transportation Type by ID
 */
export const getTransportationTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await TransportationService.getTransportationTypeById(id);

		if (!item) {
			return sendError(res, "Transportation type not found", 404);
		}

		return sendSuccess(res, item, "Transportation type retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER140: Error fetching transportation type by id - ${error.message}`,
		);
		return sendError(res, "Failed to get transportation type");
	}
};
