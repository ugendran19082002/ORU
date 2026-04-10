import { Op, Sequelize } from "sequelize";
import {
	AcademicYear,
	Book,
	BookMedium,
	BookStandard,
	BookSyllabus,
	BookTerm,
	Godown,
	Indent,
	IndentingDepartment,
} from "../../model/index.js";

/**
 * Get all indents with pagination and search
 */
export const getIndents = async (limit, offset, search = "") => {
	const searchCondition = search
		? {
				[Op.or]: [
					{ "$Book.name$": { [Op.like]: `%${search}%` } },
					{ "$AcademicYear.name$": { [Op.like]: `%${search}%` } },
				],
			}
		: {};

	return await Indent.findAndCountAll({
		attributes: [
			"id",
			"academic_year_id",
			"book_id",
			"indenting_department_id",
			"godown_id",
			"copy_type_id",
			"quantity",
			"buffer_quantity",
			"roundoff_quantity",
			"gross_indent_quantity",
			"remarks",
			"is_active",
			"created_on",
			"updated_on",
			"book_standard_id",
			"book_medium_id",
			"book_term_id",
			"book_syllabus_id",
			[Sequelize.col("Book.name"), "book_name"],
			[Sequelize.col("Godown.name"), "godown_name"],
			[Sequelize.col("AcademicYear.name"), "academic_year_name"],
			[Sequelize.col("IndentingDepartment.name"), "indenting_department_name"],
			[Sequelize.col("BookStandard.name"), "book_standard_name"],
			[Sequelize.col("BookMedium.name"), "book_medium_name"],
			[Sequelize.col("BookTerm.name"), "book_term_name"],
			[Sequelize.col("BookSyllabus.name"), "book_syllabus_name"],
		],
		include: [
			{ model: Book, attributes: [], required: false },
			{ model: AcademicYear, attributes: [], required: false },
			{ model: IndentingDepartment, attributes: [], required: false },
			{ model: BookStandard, attributes: [], required: false },
			{ model: BookMedium, attributes: [], required: false },
			{ model: BookTerm, attributes: [], required: false },
			{ model: BookSyllabus, attributes: [], required: false },
			{ model: Godown, attributes: [], required: false },
		],
		where: searchCondition,
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
		distinct: true,
	});
};

/**
 * Create a new indent
 */
export const createIndent = async (data) => {
	return await Indent.create(data);
};

/**
 * Get an indent by ID
 */
export const getIndentById = async (id) => {
	return await Indent.findOne({
		attributes: [
			"academic_year_id",
			"book_id",
			"indenting_department_id",
			"godown_id",
			"copy_type_id",
			"quantity",
			"buffer_quantity",
			"roundoff_quantity",
			"gross_indent_quantity",
			"remarks",
			"is_active",
			"created_on",
			"updated_on",
			"book_standard_id",
			"book_medium_id",
			"book_term_id",
			"book_syllabus_id",
			[Sequelize.col("Book.name"), "book_name"],
			[Sequelize.col("AcademicYear.name"), "academic_year_name"],
			[Sequelize.col("IndentingDepartment.name"), "indenting_department_name"],
			[Sequelize.col("BookStandard.name"), "book_standard_name"],
			[Sequelize.col("BookMedium.name"), "book_medium_name"],
			[Sequelize.col("BookTerm.name"), "book_term_name"],
			[Sequelize.col("BookSyllabus.name"), "book_syllabus_name"],
		],
		where: { id },
		include: [
			{ model: Book, attributes: [], required: false },
			{ model: AcademicYear, attributes: [], required: false },
			{ model: IndentingDepartment, attributes: [], required: false },
			{ model: BookStandard, attributes: [], required: false },
			{ model: BookMedium, attributes: [], required: false },
			{ model: BookTerm, attributes: [], required: false },
			{ model: BookSyllabus, attributes: [], required: false },
			{ model: Godown, attributes: [], required: false },
		],
	});
};

/**
 * Update an indent
 */
export const updateIndent = async (id, data) => {
	const item = await Indent.findOne({ where: { id } });
	if (!item) return null;
	return await item.update(data);
};
