import * as PrintingService from "../../services/master/PrintingService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * GET Printing Flows (with pagination)
 */
export const getPrintingFlows = async (req, res) => {
	try {
		const { page, limit } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const data = await PrintingService.getPrintingFlows(limitValue, offset);
		const pagingData = getPagingData(data, pageValue, limitValue);

		return sendSuccess(
			res,
			pagingData,
			data.count
				? "Printing flows retrieved successfully"
				: "No printing flows found",
		);
	} catch (error) {
		logger.error(`MASTER121: Error fetching printing flows - ${error.message}`);
		return sendError(res, "Failed to get printing flows");
	}
};

/**
 * CREATE Printing Flow
 */
export const addPrintingFlow = async (req, res) => {
	try {
		const {
			releasing_order_id,
			printer_id,
			printer_order_id,
			book_id,
			is_digital_proof_submitted_to_reception,
			is_digital_proof_checking_editorial_content_aspect,
			is_digital_proof_checking_technical_printing_aspect,
			is_digital_proof_handover_reception,
			is_digital_proof_received_by_printer,
			is_printer_mc_proof,
			is_mc_proof_submitted_to_reception,
			is_mc_proof_checking_editorial_content_aspect,
			is_mc_proof_checking_technical_printing_aspect,
			is_mc_proof_handover_reception,
			is_mc_proof_received_by_printer,
			is_printing_bulk,
			is_distribution_point_receipt_books_ebrv_generation,
			is_printer_generate_invoice_document,
			is_reception_submission_of_invoice_doc_payment,
			is_printing_80_20_payment_approval,
			is_technical_80_20_payment_approval,
			is_accounts_80_20_payment_approval,
			is_iacag_80_20_payment_approval,
			is_ms_80_20_payment_approval,
			is_md_80_20_payment_approval,
			is_accounts_releasing_80_20_payment,
		} = req.body;
		const userId = req.user?.user_id || 0;

		if (!printer_id || !book_id) {
			return sendError(res, "Printer ID and Book ID are required", 400);
		}

		const newFlow = await PrintingService.createPrintingFlow({
			releasing_order_id,
			printer_id,
			printer_order_id,
			book_id,
			is_digital_proof_submitted_to_reception,
			is_digital_proof_checking_editorial_content_aspect,
			is_digital_proof_checking_technical_printing_aspect,
			is_digital_proof_handover_reception,
			is_digital_proof_received_by_printer,
			is_printer_mc_proof,
			is_mc_proof_submitted_to_reception,
			is_mc_proof_checking_editorial_content_aspect,
			is_mc_proof_checking_technical_printing_aspect,
			is_mc_proof_handover_reception,
			is_mc_proof_received_by_printer,
			is_printing_bulk,
			is_distribution_point_receipt_books_ebrv_generation,
			is_printer_generate_invoice_document,
			is_reception_submission_of_invoice_doc_payment,
			is_printing_80_20_payment_approval,
			is_technical_80_20_payment_approval,
			is_accounts_80_20_payment_approval,
			is_iacag_80_20_payment_approval,
			is_ms_80_20_payment_approval,
			is_md_80_20_payment_approval,
			is_accounts_releasing_80_20_payment,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(res, newFlow, "Printing flow created successfully", 201);
	} catch (error) {
		logger.error(`MASTER122: Error creating printing flow - ${error.message}`);
		return sendError(res, "Failed to create printing flow");
	}
};

/**
 * UPDATE Printing Flow
 */
export const updatePrintingFlow = async (req, res) => {
	try {
		const { id } = req.params;
		const data = req.body;
		const userId = req.user?.user_id || 0;

		if (!data.printer_id || !data.book_id) {
			return sendError(res, "Printer ID and Book ID are required", 400);
		}

		const updated = await PrintingService.updatePrintingFlow(id, {
			...data,
			updated_by: userId,
			updated_on: new Date(),
			updated_ip: req.ip,
		});

		if (!updated) {
			return sendError(res, "Printing flow not found", 404);
		}

		return sendSuccess(res, [], "Printing flow updated successfully");
	} catch (error) {
		logger.error(`MASTER123: Error updating printing flow - ${error.message}`);
		return sendError(res, "Failed to update printing flow");
	}
};

/**
 * GET Printing Flow by ID
 */
export const getPrintingFlowById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await PrintingService.getPrintingFlowById(id);

		if (!item) {
			return sendError(res, "Printing flow not found", 404);
		}

		return sendSuccess(res, item, "Printing flow retrieved successfully");
	} catch (error) {
		logger.error(
			`MASTER124: Error fetching printing flow by id - ${error.message}`,
		);
		return sendError(res, "Failed to get printing flow");
	}
};
