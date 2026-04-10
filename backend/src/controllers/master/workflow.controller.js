import * as WorkflowMasterService from "../../services/master/WorkflowMasterService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Workflows (with pagination and search)
 */
export const getWorkflows = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await WorkflowMasterService.getWorkflows(
			limitValue,
			offset,
			search,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count ? "Workflows retrieved successfully" : "No workflows found",
		);
	} catch (error) {
		logger.error(`MASTER149: Error fetching workflows - ${error.message}`);
		return sendError(res, "Failed to get workflows");
	}
};

/**
 * CREATE Workflow
 */
export const addWorkflow = async (req, res) => {
	try {
		const { name } = req.body;
		const userId = req.user?.user_id || 0;

		if (!name) {
			return sendError(res, "Workflow name is required", 400);
		}

		const newWorkflow = await WorkflowMasterService.createWorkflow({
			name: name.trim(),
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(res, newWorkflow, "Workflow created successfully", 201);
	} catch (error) {
		logger.error(`MASTER150: Error creating workflow - ${error.message}`);
		return sendError(res, "Failed to create workflow");
	}
};

/**
 * UPDATE Workflow
 */
export const updateWorkflow = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, is_active } = req.body;
		const userId = req.user?.user_id || 0;

		if (!name) {
			return sendError(res, "Workflow name is required", 400);
		}

		const item = await WorkflowMasterService.getWorkflowById(id);
		if (!item) {
			return sendError(res, "Workflow not found", 404);
		}

		const duplicate = await WorkflowMasterService.findWorkflowByName(name, id);
		if (duplicate) {
			return sendError(res, "Workflow already exists", 409);
		}

		await WorkflowMasterService.updateWorkflow(id, {
			name: name.trim(),
			is_active,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});

		return sendSuccess(res, [], "Workflow updated successfully");
	} catch (error) {
		logger.error(`MASTER151: Error updating workflow - ${error.message}`);
		return sendError(res, "Failed to update workflow");
	}
};

/**
 * GET Workflow by ID
 */
export const getWorkflowById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await WorkflowMasterService.getWorkflowById(id);

		if (!item) {
			return sendError(res, "Workflow not found", 404);
		}

		return sendSuccess(res, item, "Workflow retrieved successfully");
	} catch (error) {
		logger.error(`MASTER152: Error fetching workflow by id - ${error.message}`);
		return sendError(res, "Failed to get workflow");
	}
};
