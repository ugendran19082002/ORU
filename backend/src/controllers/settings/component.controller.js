import * as SettingService from "../../services/settings/SettingService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * List Components
 */
export const getComponent = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await SettingService.getComponents(limitValue, offset, search);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(res, pagingData, "Components fetched successfully");
	} catch (error) {
		logger.error(`COMPONENT_LIST_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * Add Component
 */
export const addComponent = async (req, res) => {
	try {
		const { title, name, path, remarks, is_active = true } = req.body;

		if (!title || !name)
			return sendError(res, "Title and Name are required", 400);

		const existing = await SettingService.getComponentByPath(path);
		if (existing) return sendError(res, "Component already exists", 400);

		await SettingService.createComponent({
			title,
			name,
			path,
			remarks,
			is_active,
			created_by: req.user?.user_id || null,
			created_ip: req.ip,
		});

		return sendSuccess(res, {}, "Component added successfully", 201);
	} catch (error) {
		logger.error(`COMPONENT_ADD_ERROR: ${error.message}`);
		return sendError(res, "Failed to add component");
	}
};

/**
 * View Component
 */
export const viewComponent = async (req, res) => {
	try {
		const { id } = req.params;
		const component = await SettingService.getComponentById(id);

		if (!component) return sendError(res, "Component not found", 404);

		return sendSuccess(res, component, "Component fetched successfully");
	} catch (error) {
		logger.error(`COMPONENT_VIEW_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * Edit Component
 */
export const editComponent = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, name, path, remarks, is_active } = req.body;

		const existingWithPath = await SettingService.getComponentByPath(path, id);
		if (existingWithPath)
			return sendError(res, "Component name already in use", 400);

		const result = await SettingService.updateComponent(id, {
			title,
			name,
			path,
			remarks,
			is_active,
			updated_by: req.user?.user_id || null,
			updated_ip: req.ip,
			updated_on: new Date(),
		});

		if (!result) return sendError(res, "Component not found", 404);

		return sendSuccess(res, {}, "Component updated successfully");
	} catch (error) {
		logger.error(`COMPONENT_EDIT_ERROR: ${error.message}`);
		return sendError(res, "Failed to update");
	}
};
