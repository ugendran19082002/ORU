import { Op, Sequelize } from "sequelize";
import {
	Book,
	BookMedium,
	BookStandard,
	BookSyllabus,
	BookTerm,
} from "../../model/index.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

// GET Book List
export const getBooks = async (req, res) => {
	try {
		const { page, limit, search = "" } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const { count, rows } = await Book.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: [
				"id",
				"name",
				"code",
				"parent_id",
				"book_standard_id",
				"book_medium_id",
				"size",
				"no_of_pages",
				"copy_per_bundle",
				"cost_per_bundle",
				"weight_per_bundle",
				"book_term_id",
				"book_syllabus_id",
				"price",
				"hsn_code",
				"year_of_edition",
				"is_approval",
				"is_active",
				"created_on",
				"received_paper_soft_copy_upload",
				"received_wrapper_soft_copy_upload",

				[Sequelize.col("ParentBook.name"), "parent_book_name"],
				[Sequelize.col("BookStandard.name"), "book_standard_name"],
				[Sequelize.col("BookMedium.name"), "book_medium_name"],
				[Sequelize.col("BookTerm.name"), "book_term_name"],
				[Sequelize.col("BookSyllabus.name"), "book_syllabus_name"],
			],
			include: [
				{ model: BookStandard, as: "BookStandard", attributes: [] },
				{ model: BookMedium, as: "BookMedium", attributes: [] },
				{ model: Book, as: "ParentBook", attributes: [] },
				{ model: BookTerm, as: "BookTerm", attributes: [] },
				{ model: BookSyllabus, as: "BookSyllabus", attributes: [] },
			],
			order: [["id", "DESC"]],
			limit: limitValue,
			offset: offset,
		});

		const pagingData = getPagingData({ count, rows }, pageValue, limitValue);
		return sendSuccess(
			res,
			pagingData,
			count ? "Books retrieved successfully" : "No books found",
		);
	} catch (error) {
		logger.error(`MASTER017: Error fetching books - ${error.message}`);
		return sendError(res, "Failed to get books");
	}
};

export const addBook = async (req, res) => {
	try {
		const userId = req.user?.user_id || 0;
		const {
			name,
			code,
			parent_id,
			book_standard_id,
			book_medium_id,
			size,
			no_of_pages,
			copy_per_bundle,
			cost_per_bundle,
			weight_per_bundle,
			book_term_id,
			book_syllabus_id,
			price,
			hsn_code,
			year_of_edition,

			received_paper_soft_copy_upload,
			received_wrapper_soft_copy_upload,
		} = req.body;

		await Book.create({
			name: name.trim(),
			code,
			parent_id,
			book_standard_id,
			book_medium_id,
			size,
			no_of_pages,
			copy_per_bundle: copy_per_bundle || 0,
			cost_per_bundle: cost_per_bundle || 0,
			weight_per_bundle: weight_per_bundle || 0,
			book_term_id,
			book_syllabus_id,
			price,
			hsn_code,
			year_of_edition,
			is_approval: false,
			received_paper_soft_copy_upload,
			received_wrapper_soft_copy_upload,
			is_active: true,
			created_by: userId,
			created_ip: req.ip,
		});

		return sendSuccess(res, [], "Book created successfully", 201);
	} catch (error) {
		logger.error(`MASTER018: Error creating book - ${error.message}`);
		return sendError(res, "Failed to create book");
	}
};

/**
 * MASTER EDIT – Book (ALL fields)
 */
export const updateBook = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			name,
			code,
			parent_id,
			book_standard_id,
			book_medium_id,
			size,
			no_of_pages,
			copy_per_bundle,
			cost_per_bundle,
			weight_per_bundle,
			book_term_id,
			book_syllabus_id,
			price,
			hsn_code,
			year_of_edition,
			is_active,
			received_paper_soft_copy_upload,
			received_wrapper_soft_copy_upload,
		} = req.body;

		const book = await Book.findByPk(id);

		if (!book) {
			return sendError(res, "Book not found", 404);
		}

		await book.update({
			name: name.trim(),
			code,
			parent_id,
			book_standard_id,
			book_medium_id,
			size,
			no_of_pages,
			copy_per_bundle: copy_per_bundle || book.copy_per_bundle,
			cost_per_bundle: cost_per_bundle || book.cost_per_bundle,
			weight_per_bundle: weight_per_bundle || book.weight_per_bundle,
			book_term_id,
			book_syllabus_id,
			price,
			hsn_code,
			year_of_edition,
			is_active,
			received_paper_soft_copy_upload,
			received_wrapper_soft_copy_upload,
		});

		return sendSuccess(res, [], "Book updated successfully");
	} catch (error) {
		logger.error(`MASTER019: Error updating book - ${error.message}`);
		return sendError(res, "Failed to update book");
	}
};

export const getBookById = async (req, res) => {
	try {
		const { id } = req.params;

		const book = await Book.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"code",
				"parent_id",
				"book_standard_id",
				"book_medium_id",
				"size",
				"no_of_pages",
				"copy_per_bundle",
				"cost_per_bundle",
				"weight_per_bundle",
				"book_term_id",
				"book_syllabus_id",
				"price",
				"hsn_code",
				"year_of_edition",
				"is_approval",
				"is_active",
				"received_paper_soft_copy_upload",
				"received_wrapper_soft_copy_upload",
				[Sequelize.col("ParentBook.name"), "parent_book_name"],
				[Sequelize.col("BookStandard.name"), "book_standard_name"],
				[Sequelize.col("BookMedium.name"), "book_medium_name"],
				[Sequelize.col("BookTerm.name"), "book_term_name"],
				[Sequelize.col("BookSyllabus.name"), "book_syllabus_name"],
			],
			include: [
				{ model: Book, as: "ParentBook", attributes: [] },
				{ model: BookStandard, as: "BookStandard", attributes: [] },
				{ model: BookMedium, as: "BookMedium", attributes: [] },
				{ model: BookTerm, as: "BookTerm", attributes: [] },
				{ model: BookSyllabus, as: "BookSyllabus", attributes: [] },
			],
		});

		if (!book) {
			logger.warn("Book not found");
			return sendError(res, "Book not found", 404);
		}
		book.parent_id = book.parent_id ? book.parent_id : "0";
		logger.info("Book retrieved successfully");
		return sendSuccess(res, book, "Book retrieved successfully");
	} catch (error) {
		logger.error(`MASTER020: Error fetching book by id - ${error.message}`);
		return sendError(res, "Failed to get book");
	}
};
