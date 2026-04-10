import * as TransportationService from "../../services/master/TransportationService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Transportation Rates (with pagination)
 */
export const getTransportationRates = async (req, res) => {
	try {
		const { page, limit } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await TransportationService.getTransportationRates(
			limitValue,
			offset,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count
				? "Transportation rates retrieved successfully"
				: "No transportation rates found",
		);
	} catch (error) {
		logger.error(
			`MASTER133: Error fetching transportation rates - ${error.message}`,
		);
		return sendError(res, "Failed to get transportation rates");
	}
};

/**
 * CREATE Transportation Rate
 */
export const addTransportationRate = async (req, res) => {
	try {
		const { transportation_type_id, vehicle_type_id, unit, rate } = req.body;
		const userId = req.user?.user_id || 0;

		if (!transportation_type_id || !vehicle_type_id || !unit || !rate) {
			return sendError(
				res,
				"Transportation Type ID, Vehicle Type ID, Unit, and Rate are required",
				400,
			);
		}

		const newRate = await TransportationService.createTransportationRate({
			transportation_type_id,
			vehicle_type_id,
			unit,
			rate,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(
			res,
			newRate,
			"Transportation rate created successfully",
			201,
		);
	} catch (error) {
		logger.error(
			`MASTER134: Error creating transportation rate - ${error.message}`,
		);
		return sendError(res, "Failed to create transportation rate");
	}
};

/**
 * UPDATE Transportation Rate
 */
export const updateTransportationRate = async (req, res) => {
	try {
		const { id } = req.params;
		const { transportation_type_id, vehicle_type_id, unit, rate, is_active } =
			req.body;
		const userId = req.user?.user_id || 0;

		const updated = await TransportationService.updateTransportationRate(id, {
			transportation_type_id,
			vehicle_type_id,
			unit,
			rate,
			is_active,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});

		if (!updated) {
			return sendError(res, "Transportation rate not found", 404);
		}

		return sendSuccess(res, [], "Transportation rate updated successfully");
	} catch (error) {
		logger.error(
			`MASTER135: Error updating transportation rate - ${error.message}`,
		);
		return sendError(res, "Failed to update transportation rate");
	}
};

/**
 * GET Transportation Rate by ID
 */
export const getTransportationRateById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await TransportationService.getTransportationRateById(id);

		if (!item) {
			return sendError(res, "Transportation rate not found", 404);
		}

		return sendSuccess(res, item, "Transportation rate retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER136: Error fetching transportation rate by id - ${error.message}`,
		);
		return sendError(res, "Failed to get transportation rate");
	}
};
