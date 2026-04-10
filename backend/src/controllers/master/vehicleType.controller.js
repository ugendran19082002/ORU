import * as TransportationService from "../../services/master/TransportationService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Vehicle Types (with pagination and search)
 */
export const getVehicleTypes = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await TransportationService.getVehicleTypes(
			limitValue,
			offset,
			search,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count
				? "Vehicle types retrieved successfully"
				: "No vehicle types found",
		);
	} catch (error) {
		logger.error(`MASTER145: Error fetching vehicle types - ${error.message}`);
		return sendError(res, "Failed to get vehicle types");
	}
};

/**
 * CREATE Vehicle Type
 */
export const addVehicleType = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		if (!name) {
			return sendError(res, "Vehicle type name is required", 400);
		}

		const exists = await TransportationService.findVehicleTypeByName(name);
		if (exists) {
			return sendError(res, "Vehicle type already exists", 409);
		}

		const newType = await TransportationService.createVehicleType({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(res, newType, "Vehicle type created successfully", 201);
	} catch (error) {
		logger.error(`MASTER146: Error creating vehicle type - ${error.message}`);
		return sendError(res, "Failed to create vehicle type");
	}
};

/**
 * UPDATE Vehicle Type
 */
export const updateVehicleType = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;
		const userId = req.user?.user_id || 0;

		if (!name) {
			return sendError(res, "Vehicle type name is required", 400);
		}

		const item = await TransportationService.getVehicleTypeById(id);
		if (!item) {
			return sendError(res, "Vehicle type not found", 404);
		}

		const duplicate = await TransportationService.findVehicleTypeByName(
			name,
			id,
		);
		if (duplicate) {
			return sendError(res, "Vehicle type already exists", 409);
		}

		await TransportationService.updateVehicleType(id, {
			name: name.trim(),
			is_active,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});

		return sendSuccess(res, [], "Vehicle type updated successfully");
	} catch (error) {
		logger.error(`MASTER147: Error updating vehicle type - ${error.message}`);
		return sendError(res, "Failed to update vehicle type");
	}
};

/**
 * GET Vehicle Type by ID
 */
export const getVehicleTypeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await TransportationService.getVehicleTypeById(id);

		if (!item) {
			return sendError(res, "Vehicle type not found", 404);
		}

		return sendSuccess(res, item, "Vehicle type retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER148: Error fetching vehicle type by id - ${error.message}`,
		);
		return sendError(res, "Failed to get vehicle type");
	}
};
