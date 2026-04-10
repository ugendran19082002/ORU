import { Op, Sequelize } from "sequelize";
import {
	AcademicYear,
	Book,
	BookContentError,
	BookContentErrorLog,
	BookMedium,
	BookStandard,
	BookSyllabus,
	BookTerm,
	ContentVerification,
	EditionDetail,
	EditionType,
	ErrorCategory,
	ErrorSubCategory,
	ErrorType,
} from "../../model/index.js";
import * as WorkflowService from "../../services/WorkflowService.js";

/**
 * Get content verification list with pagination
 */
export const getContentVerifications = async (limit, offset, search = "") => {
	const searchCondition = search
		? {
				[Op.or]: [
					{ "$Book.name$": { [Op.like]: `%${search}%` } },
					{ "$AcademicYear.name$": { [Op.like]: `%${search}%` } },
					{ "$EditionType.name$": { [Op.like]: `%${search}%` } },
					{ edition_detail_receipt_no: { [Op.like]: `%${search}%` } },
					{
						"$ContentVerification.scert_ref_no$": {
							[Op.like]: `%${search}%`,
						},
					},
					{
						"$ContentVerification.error_certificate_no$": {
							[Op.like]: `%${search}%`,
						},
					},
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
			[
				Sequelize.col("ContentVerification.error_certificate_no"),
				"error_certificate_no",
			],
			[Sequelize.col("ContentVerification.scert_ref_no"), "scert_ref_no"],
			[
				Sequelize.col("ContentVerification.scert_receipt_date"),
				"scert_receipt_date",
			],
			[
				Sequelize.col("ContentVerification.scert_letter_upload"),
				"scert_letter_upload",
			],
			[
				Sequelize.col("ContentVerification.received_paper_hard_copy"),
				"received_paper_hard_copy",
			],
			[
				Sequelize.col("ContentVerification.received_wrapper_hard_copy"),
				"received_wrapper_hard_copy",
			],
			[
				Sequelize.col("ContentVerification.received_paper_soft_copy_upload"),
				"received_paper_soft_copy_upload",
			],
			[
				Sequelize.col("ContentVerification.received_wrapper_soft_copy_upload"),
				"received_wrapper_soft_copy_upload",
			],
			[Sequelize.col("ContentVerification.no_of_pages"), "no_of_pages"],
			[
				Sequelize.col("ContentVerification.workflow_transaction_no"),
				"workflow_transaction_no",
			],
			[Sequelize.col("ContentVerification.is_no_error"), "is_no_error"],
			[Sequelize.col("ContentVerification.is_full_check"), "is_full_check"],
			[Sequelize.col("ContentVerification.id"), "content_verification_id"],
			[Sequelize.col("ContentVerification.is_uploaded"), "is_uploaded"],
			[Sequelize.col("ContentVerification.is_return"), "is_return"],
			[Sequelize.col("ContentVerification.is_verified"), "is_verified"],
			[
				Sequelize.col("ContentVerification.is_content_upload"),
				"is_content_upload",
			],
			[
				Sequelize.col("ContentVerification.is_content_verification"),
				"is_content_verification",
			],
			"is_fit_for_printing_certificate",
			"fop_certificate_no",
			"fop_certificate_date",
			"is_edition_update_detail",
			"obsolete_req_no",
			"remarks",
			"loss_value",
			"is_active",
			"created_on",
			"created_by",
			"created_ip",
			"updated_on",
			"updated_by",
			"updated_ip",
			[Sequelize.col("Book.name"), "book_name"],
			[Sequelize.col("AcademicYear.name"), "academic_year_name"],
			[Sequelize.col("EditionType.name"), "edition_type_name"],
		],
		include: [
			{ model: Book, attributes: [], required: false },
			{ model: AcademicYear, attributes: [], required: false },
			{ model: EditionType, attributes: [], required: false },
			{ model: ContentVerification, attributes: [], required: false },
		],
		where: {
			...searchCondition,
			is_edition_update_detail: true,
			edition_type_id: 2,
		},
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
		distinct: true,
	});
};

/**
 * Upsert content verification and initiate workflow if new
 */
export const updateContentVerification = async (
	id,
	verificationData,
	user,
	ip,
	remarks,
) => {
	const editionDetail = await EditionDetail.findByPk(id);
	if (!editionDetail) return null;

	const contentVerification = await ContentVerification.findOne({
		where: { edition_detail_id: id },
	});

	if (contentVerification) {
		return await contentVerification.update({
			...verificationData,
			updated_on: new Date(),
			updated_by: user?.user_id || user?.id || 0,
			updated_ip: ip,
		});
	}

	const workFlowTransactionNo = `WF-${Date.now()}`;
	const created = await ContentVerification.create({
		...verificationData,
		edition_detail_id: id,
		workflow_transaction_no: workFlowTransactionNo,
		created_by: user?.user_id || 0,
		created_ip: ip,
		is_return: false,
		updated_on: new Date(),
	});

	await WorkflowService.initiateWorkflow(
		5,
		workFlowTransactionNo,
		user,
		remarks,
		"ContentVerification",
	);

	return created;
};

/**
 * Get content verification by edition detail ID
 */
export const getContentVerificationById = async (id) => {
	return await EditionDetail.findByPk(id, {
		include: [
			{ model: ContentVerification, required: false },
			{
				model: Book,
				attributes: ["name"],
				include: [
					{ model: BookStandard, attributes: ["name"] },
					{
						model: BookSyllabus,
						as: "BookSyllabus",
						attributes: ["name"],
					},
					{ model: BookMedium, attributes: ["name"] },
					{ model: BookTerm, as: "BookTerm", attributes: ["name"] },
				],
			},
			{ model: AcademicYear, attributes: ["name"] },
			{ model: EditionType, attributes: ["name"] },
		],
	});
};

/**
 * Update work allocation for users
 */
export const updateWorkAllocation = async (
	cvId,
	users,
	isWorkAllocated,
	ip,
) => {
	const contentVerification = await ContentVerification.findByPk(cvId, {
		include: [{ model: EditionDetail, attributes: ["book_id"] }],
	});

	if (!contentVerification || !contentVerification.EditionDetail) return null;
	const bookId = contentVerification.EditionDetail.book_id;

	for (const err of users) {
		if (err.id && err.id !== 0) {
			await BookContentError.update(
				{
					from_no_pages: err.from_no_pages,
					to_no_pages: err.to_no_pages,
					user_id: err.user_id,
					is_work_allocated: isWorkAllocated,
					updated_on: new Date(),
					updated_ip: ip,
				},
				{ where: { id: err.id, content_verification_id: cvId } },
			);
		} else {
			const existingAllocation = await BookContentError.findOne({
				where: {
					content_verification_id: cvId,
					user_id: err.user_id,
					is_return: false,
					is_active: true,
				},
			});

			if (existingAllocation) {
				await existingAllocation.destroy();
			}

			await BookContentError.create({
				content_verification_id: cvId,
				is_work_allocated: isWorkAllocated,
				book_id: bookId,
				user_id: err.user_id,
				from_no_pages: err.from_no_pages,
				to_no_pages: err.to_no_pages,
				error_reference_no: `ER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
				is_active: true,
				created_on: new Date(),
				created_ip: ip,
			});
		}
	}

	await ContentVerification.update(
		{ is_work_allocated: isWorkAllocated },
		{ where: { id: cvId } },
	);

	return true;
};

/**
 * Update error log for proof reader
 */
export const updateProofReaderErrorlog = async (
	cvId,
	userId,
	data,
	isNoError,
	isFullCheck,
	ip,
) => {
	const bookContentError = await BookContentError.findOne({
		where: {
			content_verification_id: cvId,
			user_id: userId,
			is_active: true,
			is_return: false,
		},
	});

	if (!bookContentError) return null;

	await BookContentError.update(
		{ is_no_error: isNoError, is_full_check: isFullCheck },
		{ where: { id: bookContentError.id } },
	);

	for (const errorLog of data) {
		if (errorLog.id && errorLog.id !== 0) {
			await BookContentErrorLog.update(
				{
					error_category_id: errorLog.error_category_id || null,
					error_type_id: errorLog.error_type_id || null,
					error_sub_category_id: errorLog.error_sub_category_id || null,
					page_no: errorLog.page_no || null,
					location_of_error: errorLog.location_of_error || null,
					screenshot_path: errorLog.screenshot_path || null,
					updated_on: new Date(),
					remarks: errorLog.remarks || null,
					updated_by: userId,
					updated_ip: ip,
				},
				{
					where: {
						id: errorLog.id,
						book_content_error_id: bookContentError.id,
					},
				},
			);
		} else {
			await BookContentErrorLog.create({
				book_content_error_id: bookContentError.id,
				error_category_id: errorLog.error_category_id || null,
				error_type_id: errorLog.error_type_id || null,
				error_sub_category_id: errorLog.error_sub_category_id || null,
				page_no: errorLog.page_no || null,
				location_of_error: errorLog.location_of_error || null,
				screenshot_path: errorLog.screenshot_path || null,
				remarks: errorLog.remarks || null,
				is_active: true,
				created_on: new Date(),
				created_by: userId,
				created_ip: ip,
			});
		}
	}

	const allBookContentError = await BookContentError.findAll({
		where: { content_verification_id: cvId, is_active: true, is_return: false },
	});

	const allFullCheck = allBookContentError.every((item) => item.is_full_check);
	const anyError = allBookContentError.some((item) => !item.is_no_error);

	await ContentVerification.update(
		{ is_full_check: allFullCheck, is_no_error: !anyError },
		{ where: { id: cvId } },
	);

	await BookContentError.update(
		{ is_admin_full_check: allFullCheck },
		{
			where: {
				content_verification_id: cvId,
				is_active: true,
				is_return: false,
			},
		},
	);

	return true;
};

/**
 * Get proof reader error log
 */
export const getProofReaderErrorlog = async (cvId, userId) => {
	const contentVerification = await ContentVerification.findOne({
		where: { id: cvId, is_active: true },
	});
	if (!contentVerification) return null;

	const whereClause = {
		content_verification_id: cvId,
		is_active: true,
		is_return: false,
	};
	if (userId) whereClause.user_id = userId;

	const bookContentError = await BookContentError.findOne({
		where: whereClause,
	});

	if (!bookContentError) {
		return {
			is_work_allocated: contentVerification.is_work_allocated,
			content_verification_id: cvId,
			data: {},
		};
	}

	const logs = await BookContentErrorLog.findAll({
		where: { book_content_error_id: bookContentError.id, is_active: true },
		attributes: [
			"id",
			"error_category_id",
			"error_type_id",
			"error_sub_category_id",
			"page_no",
			"location_of_error",
			"screenshot_path",
			"remarks",
			[Sequelize.col("ErrorCategory.name"), "error_category_name"],
			[Sequelize.col("ErrorType.name"), "error_type_name"],
			[Sequelize.col("ErrorSubCategory.name"), "error_sub_category_name"],
		],
		include: [
			{ model: ErrorCategory, attributes: [], required: false },
			{ model: ErrorSubCategory, attributes: [], required: false },
			{ model: ErrorType, attributes: [], required: false },
		],
		order: [["id", "ASC"]],
	});

	return {
		is_work_allocated: contentVerification.is_work_allocated,
		is_admin_full_check: bookContentError.is_admin_full_check,
		content_verification_id: cvId,
		is_no_error: bookContentError.is_no_error,
		is_full_check: bookContentError.is_full_check,
		data: logs,
	};
};

/**
 * Update return status
 */
export const updateReturnStatus = async (cvId, remarks) => {
	const contentVerification = await ContentVerification.findOne({
		where: { id: cvId },
	});
	if (!contentVerification) return null;

	await BookContentError.update(
		{
			is_return: true,
			return_remarks: remarks,
			return_date: new Date(),
		},
		{ where: { content_verification_id: cvId, is_return: false } },
	);

	return await ContentVerification.update(
		{
			is_work_allocated: false,
			is_return: true,
			is_uploaded: false,
			is_full_check: false,
			is_no_error: false,
		},
		{ where: { id: cvId } },
	);
};

/**
 * Update verified status
 */
export const updateVerifiedStatus = async (cvId, remarks) => {
	const contentVerification = await ContentVerification.findOne({
		where: { id: cvId },
	});
	if (!contentVerification) return null;

	await BookContentError.update(
		{
			is_verified: true,
			verified_remarks: remarks,
			verified_date: new Date(),
		},
		{ where: { content_verification_id: cvId, is_return: false } },
	);

	return await ContentVerification.update(
		{ is_verified: true, is_uploaded: false },
		{ where: { id: cvId } },
	);
};

/**
 * Update book content from verification
 */
export const updateContentForBook = async (cvId, userId, ip) => {
	const contentVerification = await ContentVerification.findOne({
		where: { id: cvId },
	});
	if (!contentVerification) return null;

	if (!contentVerification.is_content_verification) return "NOT_COMPLETED";

	const editionDetails = await EditionDetail.findOne({
		where: { id: contentVerification.edition_detail_id },
	});
	if (!editionDetails) return "EDITION_DETAIL_NOT_FOUND";

	await Book.update(
		{
			content_verification_id: cvId,
			received_paper_soft_copy_upload:
				contentVerification.received_paper_soft_copy_upload,
			received_wrapper_soft_copy_upload:
				contentVerification.received_wrapper_soft_copy_upload,
			cost_per_bundle: editionDetails.cost_per_bundle,
			copy_per_bundle: editionDetails.copy_per_bundle,
			weight_per_bundle: editionDetails.weight_per_bundle,
			no_of_pages: contentVerification.no_of_pages,
			updated_on: new Date(),
			updated_by: userId,
			updated_ip: ip,
		},
		{ where: { id: editionDetails.book_id } },
	);

	return await ContentVerification.update(
		{
			is_content_upload: true,
			updated_on: new Date(),
			updated_by: userId,
			updated_ip: ip,
		},
		{ where: { id: cvId } },
	);
};
