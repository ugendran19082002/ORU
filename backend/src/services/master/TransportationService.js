import { Op, Sequelize } from "sequelize";
import {
	TransportationRate,
	TransportationType,
	VehicleType,
} from "../../model/index.js";

/* ------------------ Transportation Rate Service ------------------ */

/**
 * Get all transportation rates with pagination
 */
export const getTransportationRates = async (limit, offset) => {
	return await TransportationRate.findAndCountAll({
		where: {},
		attributes: [
			"id",
			"transportation_type_id",
			"vehicle_type_id",
			"unit",
			"rate",
			"is_active",
			"created_on",
			[Sequelize.col("TransportationType.name"), "transportation_type_name"],
			[Sequelize.col("VehicleType.name"), "vehicle_type_name"],
		],
		include: [
			{ model: TransportationType, attributes: [] },
			{ model: VehicleType, attributes: [] },
		],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Create a new transportation rate
 */
export const createTransportationRate = async (data) => {
	return await TransportationRate.create(data);
};

/**
 * Update a transportation rate
 */
export const updateTransportationRate = async (id, data) => {
	const item = await TransportationRate.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a transportation rate by ID
 */
export const getTransportationRateById = async (id) => {
	return await TransportationRate.findOne({
		where: { id },
		attributes: [
			"id",
			"transportation_type_id",
			"vehicle_type_id",
			"unit",
			"rate",
			"is_active",
			"created_on",
			[Sequelize.col("TransportationType.name"), "transportation_type_name"],
			[Sequelize.col("VehicleType.name"), "vehicle_type_name"],
		],
		include: [
			{ model: TransportationType, attributes: [] },
			{ model: VehicleType, attributes: [] },
		],
	});
};

/* ------------------ Transportation Type Service ------------------ */

/**
 * Get all transportation types with pagination and search
 */
export const getTransportationTypes = async (limit, offset, search = "") => {
	return await TransportationType.findAndCountAll({
		where: { name: { [Op.like]: `%${search}%` } },
		attributes: ["id", "name", "is_active", "created_on"],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Find transportation type by name (uniqueness check)
 */
export const findTransportationTypeByName = async (name, excludeId = null) => {
	const where = { name: name.trim(), is_active: true };
	if (excludeId) where.id = { [Op.ne]: excludeId };
	return await TransportationType.findOne({ where });
};

/**
 * Create a new transportation type
 */
export const createTransportationType = async (data) => {
	return await TransportationType.create(data);
};

/**
 * Update a transportation type
 */
export const updateTransportationType = async (id, data) => {
	const item = await TransportationType.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a transportation type by ID
 */
export const getTransportationTypeById = async (id) => {
	return await TransportationType.findOne({ where: { id } });
};

/* ------------------ Vehicle Type Service ------------------ */

/**
 * Get all vehicle types with pagination and search
 */
export const getVehicleTypes = async (limit, offset, search = "") => {
	return await VehicleType.findAndCountAll({
		where: { name: { [Op.like]: `%${search}%` } },
		attributes: ["id", "name", "is_active", "created_on"],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Find vehicle type by name (uniqueness check)
 */
export const findVehicleTypeByName = async (name, excludeId = null) => {
	const where = { name: name.trim(), is_active: true };
	if (excludeId) where.id = { [Op.ne]: excludeId };
	return await VehicleType.findOne({ where });
};

/**
 * Create a new vehicle type
 */
export const createVehicleType = async (data) => {
	return await VehicleType.create(data);
};

/**
 * Update a vehicle type
 */
export const updateVehicleType = async (id, data) => {
	const item = await VehicleType.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a vehicle type by ID
 */
export const getVehicleTypeById = async (id) => {
	return await VehicleType.findOne({ where: { id } });
};
