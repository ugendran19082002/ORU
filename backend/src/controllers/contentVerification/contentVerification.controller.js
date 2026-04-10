import * as CVService from "../../services/contentVerification/ContentVerificationService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Content Verification List
 */
export const contentVerificationList = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await CVService.getContentVerifications(
			limitValue,
			offset,
			search,
		);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count ? "Data fetched successfully" : "No data found",
		);
	} catch (error) {
		logger.error(`CV_LIST_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * UPDATE Content Verification
 */
export const updateContentVerification = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return sendError(res, "Edition Detail ID is required", 400);

		const allowedFields = [
			"no_of_pages",
			"is_no_error",
			"is_full_check",
			"is_content_verification",
			"received_scert_letter",
			"received_paper_hard_copy",
			"received_wrapper_hard_copy",
			"received_wrapper_soft_copy",
			"received_paper_soft_copy",
			"received_paper_soft_copy_upload",
			"received_wrapper_soft_copy_upload",
			"received_error_certificate",
			"main_received_date_time",
			"wrapper_received_date_time",
			"scert_ref_no",
			"scert_receipt_date",
			"scert_letter_upload",
			"error_certificate_no",
			"error_certificate_upload",
			"is_uploaded",
		];

		const verificationData = {};
		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				verificationData[field] = req.body[field];
			}
		}

		const result = await CVService.updateContentVerification(
			id,
			verificationData,
			req.user,
			req.ip,
			req.body.remarks,
		);

		if (!result) return sendError(res, "Edition Detail not found", 404);

		return sendSuccess(
			res,
			{},
			"Content Verification details updated successfully",
		);
	} catch (error) {
		logger.error(`CV_UPDATE_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * GET Content Verification by ID
 */
export const getContentVerificationById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return sendError(res, "Edition Detail ID is required", 400);

		const editionDetail = await CVService.getContentVerificationById(id);

		if (!editionDetail) return sendError(res, "Edition Detail not found", 404);

		const cv = editionDetail.ContentVerification;
		let data = {
			academic_year_name: editionDetail.AcademicYear?.name,
			edition_detail_id: editionDetail.id,
			edition_detail_receipt_no: editionDetail.edition_detail_receipt_no,
			obsolete_req_no: editionDetail.obsolete_req_no,
			edition_type_name: editionDetail.EditionType?.name,
			book_standard_name: editionDetail.Book?.BookStandard?.name,
			book_medium_name: editionDetail.Book?.BookMedium?.name,
			book_syllabus_name: editionDetail.Book?.BookSyllabus?.name,
			book_term_name: editionDetail.Book?.BookTerm?.name,
			book_name: editionDetail.Book?.name,
			cost_per_bundle: editionDetail.cost_per_bundle,
			copy_per_bundle: editionDetail.copy_per_bundle,
			current_stock_quantity: editionDetail.current_stock_quantity,
			fop_certificate_no: editionDetail.fop_certificate_no,
			fop_certificate_date: editionDetail.fop_certificate_date,
			is_fit_for_printing_certificate:
				editionDetail.is_fit_for_printing_certificate,
			loss_value: editionDetail.loss_value,
			remarks: editionDetail.remarks,
		};

		if (cv) {
			data = {
				...data,
				no_of_pages: cv.no_of_pages,
				received_scert_letter: cv.received_scert_letter,
				received_paper_hard_copy: cv.received_paper_hard_copy,
				received_wrapper_hard_copy: cv.received_wrapper_hard_copy,
				received_wrapper_soft_copy: cv.received_wrapper_soft_copy,
				received_paper_soft_copy: cv.received_paper_soft_copy,
				received_paper_soft_copy_upload: cv.received_paper_soft_copy_upload,
				received_wrapper_soft_copy_upload: cv.received_wrapper_soft_copy_upload,
				main_received_date_time: cv.main_received_date_time,
				wrapper_received_date_time: cv.wrapper_received_date_time,
				scert_ref_no: cv.scert_ref_no,
				scert_receipt_date: cv.scert_receipt_date,
				scert_letter_upload: cv.scert_letter_upload,
				error_certificate_no: cv.error_certificate_no,
				error_certificate_upload: cv.error_certificate_upload,
				received_error_certificate: cv.received_error_certificate,
				is_work_allocated: cv.is_work_allocated,
				is_return: cv.is_return,
				is_uploaded: cv.is_uploaded,
				is_full_check: cv.is_full_check,
				is_no_error: cv.is_no_error,
				is_verified: cv.is_verified,
			};
		}

		return sendSuccess(res, data, "Content Verification fetched successfully");
	} catch (error) {
		logger.error(`CV_VIEW_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * UPDATE Work Allocation
 */
export const updateWorkAllocation = async (req, res) => {
	try {
		const { content_verification_id, users, is_work_allocated } = req.body;

		if (!content_verification_id)
			return sendError(res, "Content Verification ID is required", 400);
		if (!Array.isArray(users))
			return sendError(res, "Users array is required", 400);

		// Basic validation for numeric fields in the loop to maintain legacy behavior
		for (const err of users) {
			if (err.user_id && Number.isNaN(Number(err.user_id)))
				return sendError(res, "Invalid User ID format", 400);
			if (err.from_no_pages && Number.isNaN(Number(err.from_no_pages)))
				return sendError(res, "Invalid From Page Number", 400);
			if (err.to_no_pages && Number.isNaN(Number(err.to_no_pages)))
				return sendError(res, "Invalid To Page Number", 400);
		}

		const result = await CVService.updateWorkAllocation(
			content_verification_id,
			users,
			is_work_allocated,
			req.ip,
		);

		if (!result) return sendError(res, "Content Verification not found", 404);

		return sendSuccess(res, {}, "Work Allocated saved successfully");
	} catch (error) {
		logger.error(`CV_WORK_ALLOCATION_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * GET Work Allocation List
 */
export const getWorkAllocationList = async (req, res) => {
	try {
		const { content_verification_id } = req.body;
		if (!content_verification_id)
			return sendError(res, "Content Verification ID is required", 400);

		const data = await CVService.getWorkAllocationList(content_verification_id);
		return sendSuccess(res, data, "Book Content Errors fetched successfully");
	} catch (error) {
		logger.error(`CV_WORK_ALLOCATION_LIST_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * UPDATE Proof Reader Error log
 */
export const updateProofReaderErrorlog = async (req, res) => {
	try {
		const userId = req.user?.user_id;
		if (!userId) return sendError(res, "Role access is not allowed", 400);

		const { content_verification_id, data, is_no_error, is_full_check } =
			req.body;

		if (!content_verification_id)
			return sendError(res, "Content Verification ID is required", 400);
		if (!data || !Array.isArray(data))
			return sendError(res, "Data must be an array", 400);

		// Validation to maintain legacy behavior
		for (const errorLog of data) {
			if (
				errorLog.error_category_id &&
				Number.isNaN(Number(errorLog.error_category_id))
			)
				return sendError(res, "Invalid Error Category ID format", 400);
			if (
				errorLog.error_type_id &&
				Number.isNaN(Number(errorLog.error_type_id))
			)
				return sendError(res, "Invalid Error Type ID format", 400);
			if (
				errorLog.error_sub_category_id &&
				Number.isNaN(Number(errorLog.error_sub_category_id))
			)
				return sendError(res, "Invalid Error Sub Category ID format", 400);
			if (errorLog.page_no && Number.isNaN(Number(errorLog.page_no)))
				return sendError(res, "Invalid Page Number format", 400);
		}

		const result = await CVService.updateProofReaderErrorlog(
			content_verification_id,
			userId,
			data,
			is_no_error,
			is_full_check,
			req.ip,
		);

		if (!result) return sendError(res, "Book Content Error not found", 400);

		return sendSuccess(res, {}, "Proof reader error logs saved successfully");
	} catch (error) {
		logger.error(`CV_ERROR_LOG_UPDATE_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * GET Proof Reader Error log
 */
export const getProofReaderErrorlog = async (req, res) => {
	try {
		const userId = req.user?.user_id;
		const { content_verification_id } = req.body;

		if (!content_verification_id)
			return sendError(res, "Content Verification ID is required", 400);

		const result = await CVService.getProofReaderErrorlog(
			content_verification_id,
			userId,
		);

		if (!result) return sendError(res, "Content Verification not found", 400);

		return sendSuccess(
			res,
			result,
			"Proof reader error logs fetched successfully",
		);
	} catch (error) {
		logger.error(`CV_ERROR_LOG_GET_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * UPDATE Return Status
 */
export const updateReturnStatus = async (req, res) => {
	try {
		const { content_verification_id, remarks } = req.body;
		if (!content_verification_id)
			return sendError(res, "Content Verification ID is required", 400);

		const result = await CVService.updateReturnStatus(
			content_verification_id,
			remarks,
		);

		if (!result) return sendError(res, "Content Verification not found", 200);

		return sendSuccess(res, {}, "Return status updated successfully");
	} catch (error) {
		logger.error(`CV_RETURN_STATUS_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * UPDATE Verified Status
 */
export const updateVerifiedStatus = async (req, res) => {
	try {
		const { content_verification_id, remarks } = req.body;
		if (!content_verification_id)
			return sendError(res, "Content Verification ID is required", 400);

		const result = await CVService.updateVerifiedStatus(
			content_verification_id,
			remarks,
		);

		if (!result) return sendError(res, "Content Verification not found", 200);

		return sendSuccess(res, {}, "Verified status updated successfully");
	} catch (error) {
		logger.error(`CV_VERIFIED_STATUS_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

/**
 * UPDATE Content for Book
 */
export const updateContentForBook = async (req, res) => {
	try {
		const { content_verification_id } = req.body;
		if (!content_verification_id)
			return sendError(res, "Content Verification ID is required", 400);

		const status = await CVService.updateContentForBook(
			content_verification_id,
			req.user?.user_id || 0,
			req.ip,
		);

		if (!status) return sendError(res, "Content Verification not found", 200);
		if (status === "NOT_COMPLETED")
			return sendSuccess(res, {}, "Content Verification not completed");
		if (status === "EDITION_DETAIL_NOT_FOUND")
			return sendSuccess(res, {}, "Edition Details not found");

		return sendSuccess(res, {}, "Content for book updated successfully");
	} catch (error) {
		logger.error(`CV_BOOK_UPDATE_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};
