import { Op, Sequelize } from "sequelize";
import {
	Book,
	Printer,
	PrintingFlow,
	PrintingType,
} from "../../model/index.js";

/* ------------------ Printing Flow Service ------------------ */

/**
 * Get all printing flows with pagination
 */
export const getPrintingFlows = async (limit, offset) => {
	return await PrintingFlow.findAndCountAll({
		where: {},
		attributes: [
			"id",
			"releasing_order_id",
			"printer_id",
			"printer_order_id",
			"book_id",
			"is_digital_proof_submitted_to_reception",
			"is_digital_proof_checking_editorial_content_aspect",
			"is_digital_proof_checking_technical_printing_aspect",
			"is_digital_proof_handover_reception",
			"is_digital_proof_received_by_printer",
			"is_printer_mc_proof",
			"is_mc_proof_submitted_to_reception",
			"is_mc_proof_checking_editorial_content_aspect",
			"is_mc_proof_checking_technical_printing_aspect",
			"is_mc_proof_handover_reception",
			"is_mc_proof_received_by_printer",
			"is_printing_bulk",
			"is_distribution_point_receipt_books_ebrv_generation",
			"is_printer_generate_invoice_document",
			"is_reception_submission_of_invoice_doc_payment",
			"is_printing_80_20_payment_approval",
			"is_technical_80_20_payment_approval",
			"is_accounts_80_20_payment_approval",
			"is_iacag_80_20_payment_approval",
			"is_ms_80_20_payment_approval",
			"is_md_80_20_payment_approval",
			"is_accounts_releasing_80_20_payment",
			"is_active",
			"created_on",
			[Sequelize.col("Printer.name"), "printer_name"],
			[Sequelize.col("Book.name"), "book_name"],
		],
		include: [
			{ model: Printer, attributes: [] },
			{ model: Book, attributes: [] },
		],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Create a new printing flow
 */
export const createPrintingFlow = async (data) => {
	return await PrintingFlow.create(data);
};

/**
 * Update a printing flow
 */
export const updatePrintingFlow = async (id, data) => {
	const item = await PrintingFlow.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a printing flow by ID
 */
export const getPrintingFlowById = async (id) => {
	return await PrintingFlow.findOne({
		where: { id },
		attributes: [
			"id",
			"releasing_order_id",
			"printer_id",
			"book_id",
			"is_digital_proof_submitted_to_reception",
			"is_digital_proof_checking_editorial_content_aspect",
			"is_digital_proof_checking_technical_printing_aspect",
			"is_digital_proof_handover_reception",
			"is_digital_proof_received_by_printer",
			"is_printer_mc_proof",
			"is_mc_proof_submitted_to_reception",
			"is_mc_proof_checking_editorial_content_aspect",
			"is_mc_proof_checking_technical_printing_aspect",
			"is_mc_proof_handover_reception",
			"is_mc_proof_received_by_printer",
			"is_printing_bulk",
			"is_distribution_point_receipt_books_ebrv_generation",
			"is_printer_generate_invoice_document",
			"is_reception_submission_of_invoice_doc_payment",
			"is_printing_80_20_payment_approval",
			"is_technical_80_20_payment_approval",
			"is_accounts_80_20_payment_approval",
			"is_iacag_80_20_payment_approval",
			"is_ms_80_20_payment_approval",
			"is_md_80_20_payment_approval",
			"is_accounts_releasing_80_20_payment",
			"is_active",
			"created_on",
			[Sequelize.col("Printer.name"), "printer_name"],
			[Sequelize.col("Book.name"), "book_name"],
		],
		include: [
			{ model: Printer, attributes: [] },
			{ model: Book, attributes: [] },
		],
	});
};

/* ------------------ Printing Type Service ------------------ */

/**
 * Get all printing types with pagination and search
 */
export const getPrintingTypes = async (limit, offset, search = "") => {
	return await PrintingType.findAndCountAll({
		where: { name: { [Op.like]: `%${search}%` } },
		attributes: ["id", "name", "is_active", "created_on"],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Find printing type by name (uniqueness check)
 */
export const findPrintingTypeByName = async (name, excludeId = null) => {
	const where = { name: name.trim(), is_active: true };
	if (excludeId) where.id = { [Op.ne]: excludeId };
	return await PrintingType.findOne({ where });
};

/**
 * Create a new printing type
 */
export const createPrintingType = async (data) => {
	return await PrintingType.create(data);
};

/**
 * Update a printing type
 */
export const updatePrintingType = async (id, data) => {
	const item = await PrintingType.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a printing type by ID
 */
export const getPrintingTypeById = async (id) => {
	return await PrintingType.findOne({ where: { id } });
};
