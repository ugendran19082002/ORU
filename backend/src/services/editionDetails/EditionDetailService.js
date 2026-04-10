import { Op, Sequelize } from "sequelize";
import * as models from "../../model/index.js";

const {
	AcademicYear,
	Book,
	BookMedium,
	BookStandard,
	BookSyllabus,
	BookTerm,
	ContentVerification,
	CurrentStock,
	EditionDetail,
	EditionType,
} = models;

/**
 * Fetch Edition Details with pagination and search
 */
export const getEditionDetails = async ({ page, limit, search }) => {
	const offset = (page - 1) * limit;

	const searchCondition = search
		? {
				[Op.or]: [
					{ "$Book.name$": { [Op.like]: `%${search}%` } },
					{ "$AcademicYear.name$": { [Op.like]: `%${search}%` } },
					{ "$EditionType.name$": { [Op.like]: `%${search}%` } },
					{ edition_detail_receipt_no: { [Op.like]: `%${search}%` } },
					{ fop_certificate_no: { [Op.like]: `%${search}%` } },
				],
			}
		: {};

	return await EditionDetail.findAndCountAll({
		attributes: [
			"id",
			"academic_year_id",
			"book_id",
			"edition_type_id",
			"cost_per_bundle",
			"copy_per_bundle",
			"current_stock_quantity",
			"edition_detail_receipt_no",
			"is_fit_for_printing_certificate",
			"fop_certificate_no",
			"fop_certificate_date",
			"is_edition_update_detail",
			"obsolete_req_no",
			"remarks",
			"loss_value",
			"is_active",
			"created_on",
			"workflow_transaction_no",
			[Sequelize.col("Book.name"), "book_name"],
			[Sequelize.col("AcademicYear.name"), "academic_year_name"],
			[Sequelize.col("EditionType.name"), "edition_type_name"],
			[Sequelize.col("BookStandard.name"), "book_standard_name"],
			[Sequelize.col("ContentVerification.no_of_pages"), "no_of_pages"],
			[Sequelize.col("BookMedium.name"), "book_medium_name"],
			[Sequelize.col("BookTerm.name"), "book_term_name"],
			[Sequelize.col("BookSyllabus.name"), "book_syllabus_name"],
			[
				Sequelize.col("ContentVerification.is_content_upload"),
				"is_content_upload",
			],
			[Sequelize.col("ContentVerification.id"), "content_verification_id"],
		],
		include: [
			{ model: Book, attributes: [], required: false },
			{ model: AcademicYear, attributes: [], required: false },
			{ model: EditionType, attributes: [], required: false },
			{ model: ContentVerification, attributes: [], required: false },
			{ model: BookStandard, attributes: [], required: false },
			{ model: BookMedium, attributes: [], required: false },
			{ model: BookTerm, attributes: [], required: false },
			{ model: BookSyllabus, attributes: [], required: false },
		],
		where: searchCondition,
		order: [["id", "DESC"]],
		limit: Number(limit),
		offset: Number(offset),
		distinct: true,
	});
};

/**
 * Generate Receipt and Obsolete Numbers
 */
export const generateNextNumbers = async () => {
	const lastReceipt = await EditionDetail.findOne({
		order: [["id", "DESC"]],
		paranoid: false,
	});

	let receiptNo = "EDN-0001";
	let obsoleteNo = "OBS-0001";

	if (lastReceipt) {
		if (lastReceipt.edition_detail_receipt_no) {
			const parts = lastReceipt.edition_detail_receipt_no.split("-");
			if (parts.length === 2) {
				receiptNo = `EDN-${(parseInt(parts[1], 10) + 1).toString().padStart(4, "0")}`;
			}
		}
		if (lastReceipt.obsolete_req_no) {
			const obsParts = lastReceipt.obsolete_req_no.split("-");
			if (obsParts.length === 2) {
				obsoleteNo = `OBS-${(parseInt(obsParts[1], 10) + 1).toString().padStart(4, "0")}`;
			}
		}
	}
	return { receiptNo, obsoleteNo };
};

/**
 * Create Edition Detail
 */
export const createEditionDetail = async (data) => {
	return await EditionDetail.create(data);
};

/**
 * Get Edition Detail by ID
 */
export const getEditionDetailById = async (id) => {
	return await EditionDetail.findOne({
		attributes: [
			"id",
			"academic_year_id",
			"book_id",
			"edition_type_id",
			"cost_per_bundle",
			"copy_per_bundle",
			"current_stock_quantity",
			"edition_detail_receipt_no",
			"is_fit_for_printing_certificate",
			"fop_certificate_no",
			"fop_certificate_date",
			"is_edition_update_detail",
			"obsolete_req_no",
			"book_standard_id",
			"book_medium_id",
			"book_term_id",
			"book_syllabus_id",
			"remarks",
			"loss_value",
			"is_active",
			"created_on",
			"workflow_transaction_no",
			[Sequelize.col("Book.name"), "book_name"],
			[Sequelize.col("AcademicYear.name"), "academic_year_name"],
			[Sequelize.col("EditionType.name"), "edition_type_name"],
			[Sequelize.col("BookStandard.name"), "book_standard_name"],
			[Sequelize.col("BookMedium.name"), "book_medium_name"],
			[Sequelize.col("BookTerm.name"), "book_term_name"],
			[Sequelize.col("BookSyllabus.name"), "book_syllabus_name"],
		],
		include: [
			{ model: Book, attributes: [], required: false },
			{ model: AcademicYear, attributes: [], required: false },
			{ model: EditionType, attributes: [], required: false },
			{ model: BookStandard, attributes: [], required: false },
			{ model: BookMedium, attributes: [], required: false },
			{ model: BookTerm, attributes: [], required: false },
			{ model: BookSyllabus, attributes: [], required: false },
		],
		where: { id },
	});
};

/**
 * Update Edition Detail
 */
export const updateEditionDetail = async (id, data) => {
	return await EditionDetail.update(data, { where: { id } });
};

/**
 * Get Books List by approval status
 */
export const getApprovedBooksList = async (isApproved) => {
	return await Book.findAll({
		where: {
			is_active: true,
			is_approval: isApproved,
		},
		attributes: [
			"id",
			"name",
			"copy_per_bundle",
			"cost_per_bundle",
			[
				Sequelize.fn(
					"COALESCE",
					Sequelize.fn("SUM", Sequelize.col("CurrentStock.quantity")),
					0,
				),
				"current_stock_quantity",
			],
		],
		include: [{ model: CurrentStock, attributes: [], required: false }],
		group: ["Book.id"],
	});
};
