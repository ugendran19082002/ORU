import * as WorkflowService from "../../services/WorkflowService.js";
import { logger } from "../../utils/logger.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Workflow Progress (History + Task Details)
 */
export const getWorkflowProgress = async (req, res) => {
	try {
		const transactionNo = req.params.transaction_no;
		if (!transactionNo) {
			return sendError(res, "Transaction No is required", 400);
		}

		const progress = await WorkflowService.getWorkflowProgress(transactionNo);
		return sendSuccess(res, progress, "Workflow progress fetched successfully");
	} catch (error) {
		logger.error(`WORKFLOW_PROGRESS_ERROR: ${error.message}`);
		return sendError(res, error.message);
	}
};

/**
 * GET Workflow Status Options for next step
 */
export const getWorkflowStatusOptions = async (req, res) => {
	try {
		const transactionNo = req.params.transaction_no;
		if (!transactionNo) {
			return sendError(res, "Transaction No is required", 400);
		}

		const options = await WorkflowService.getNextStatusOptions(
			transactionNo,
			req.user,
		);
		return sendSuccess(
			res,
			options,
			options.length > 0
				? "Workflow status options fetched successfully"
				: "No workflow status options found",
		);
	} catch (error) {
		logger.error(`WORKFLOW_OPTIONS_ERROR: ${error.message}`);
		return sendError(res, error.message);
	}
};

/**
 * PROCESS Workflow Step
 */
export const processWorkflowStep = async (req, res) => {
	try {
		const { workflow_transaction_no, comments, workflow_status_id } = req.body;

		if (!workflow_transaction_no) {
			return sendError(res, "Transaction number is required", 400);
		}
		if (!comments) {
			return sendError(res, "Comments are required", 400);
		}

		const result = await WorkflowService.processStep(
			workflow_transaction_no,
			req.user,
			comments,
			workflow_status_id,
		);

		return sendSuccess(res, result, "Workflow processed successfully");
	} catch (error) {
		logger.error(`WORKFLOW_PROCESS_ERROR: ${error.message}`);

		if (error.message.includes("Unauthorized")) {
			return sendError(res, error.message, 403);
		}
		if (error.message.includes("Invalid")) {
			return sendError(res, error.message, 400);
		}
		return sendError(res, error.message);
	}
};
