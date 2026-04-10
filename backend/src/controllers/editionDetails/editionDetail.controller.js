import * as EditionDetailService from "../../services/editionDetails/EditionDetailService.js";
import * as WorkflowService from "../../services/WorkflowService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * List Edition Details
 */
export const editionDetailList = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const { limit: l, offset: o, page: p } = getPagination(page, limit);

		const data = await EditionDetailService.getEditionDetails({
			page: p,
			limit: l,
			search,
		});

		const pagingData = getPagingData(data, p, l);
		return sendSuccess(res, pagingData, "Data fetched successfully");
	} catch (error) {
		logger.error(`EDITION_LIST_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * Add Edition Detail
 */
export const addEditionDetail = async (req, res) => {
	try {
		const { academic_year_id, book_id, edition_type_id } = req.body;

		if (!academic_year_id || !book_id || !edition_type_id) {
			return sendError(
				res,
				"Academic Year, Book, and Edition Type are required.",
				400,
			);
		}

		const txnNo = `WF-${Date.now()}`;
		const { receiptNo, obsoleteNo } =
			await EditionDetailService.generateNextNumbers();

		const editionData = {
			...req.body,
			workflow_transaction_no: txnNo,
			edition_detail_receipt_no: receiptNo,
			obsolete_req_no: obsoleteNo,
			is_edition_update_detail: edition_type_id === 2,
			created_by: req.user?.user_id || 0,
			created_ip: req.ip,
		};

		await EditionDetailService.createEditionDetail(editionData);

		// Initiate Workflow
		await WorkflowService.initiateWorkflow(
			edition_type_id === 2 ? 3 : 4,
			txnNo,
			req.user,
			req.body.remarks || "Edition Detail created",
		);

		return sendSuccess(res, {}, "Edition Detail created successfully", 201);
	} catch (error) {
		logger.error(`EDITION_ADD_ERROR: ${error.message}`);
		return sendError(res, "Failed to create Edition Detail");
	}
};

/**
 * Get Edition Detail by ID
 */
export const getEditionDetailById = async (req, res) => {
	try {
		const { id } = req.params;
		const data = await EditionDetailService.getEditionDetailById(id);
		if (!data) return sendError(res, "Edition Detail not found", 404);

		return sendSuccess(res, data, "Edition Detail fetched successfully");
	} catch (error) {
		logger.error(`EDITION_VIEW_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * Update Edition Detail
 */
export const updateEditionDetail = async (req, res) => {
	try {
		const { id } = req.params;

		const fields = [
			"academic_year_id",
			"book_id",
			"edition_type_id",
			"book_standard_id",
			"book_medium_id",
			"book_term_id",
			"book_syllabus_id",
			"cost_per_bundle",
			"copy_per_bundle",
			"current_stock_quantity",
			"edition_detail_receipt_no",
			"fop_certificate_no",
			"fop_certificate_date",
			"obsolete_req_no",
			"remarks",
			"loss_value",
			"is_active",
			"workflow_transaction_no",
			"is_fit_for_printing_certificate",
			"is_edition_update_detail",
		];

		const updateData = {};
		for (const k of fields)
			if (req.body[k] !== undefined) updateData[k] = req.body[k];

		updateData.updated_on = new Date();
		updateData.updated_by = req.user?.user_id || 0;
		updateData.updated_ip = req.ip;

		const [updated] = await EditionDetailService.updateEditionDetail(
			id,
			updateData,
		);
		if (!updated)
			return sendError(res, "No changes made or record not found", 400);

		return sendSuccess(res, [], "Edition Detail updated successfully");
	} catch (error) {
		logger.error(`EDITION_UPDATE_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * Get Books List
 */
export const getApprovedBooksList = async (req, res) => {
	try {
		const { id } = req.params;
		const data = await EditionDetailService.getApprovedBooksList(
			Number(id) === 1,
		);
		return sendSuccess(res, data, "Books retrieved successfully");
	} catch (error) {
		logger.error(`EDITION_BOOKS_LIST_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};
