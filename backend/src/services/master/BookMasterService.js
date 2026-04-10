import { Op, Sequelize } from "sequelize";
import { BookSyllabus, BookTerm, District } from "../../model/index.js";

/* ------------------ Book Term Service ------------------ */

/**
 * Get all book terms with pagination and search
 */
export const getBookTerms = async (limit, offset, search = "") => {
	return await BookTerm.findAndCountAll({
		where: { name: { [Op.like]: `%${search}%` } },
		attributes: ["id", "name", "remarks", "is_active", "created_on"],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Create a new book term
 */
export const createBookTerm = async (data) => {
	return await BookTerm.create(data);
};

/**
 * Update a book term
 */
export const updateBookTerm = async (id, data) => {
	const item = await BookTerm.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a book term by ID
 */
export const getBookTermById = async (id) => {
	return await BookTerm.findOne({ where: { id } });
};

/* ------------------ Book Syllabus Service ------------------ */

/**
 * Get all book syllabuses with pagination and search
 */
export const getBookSyllabuses = async (limit, offset, search = "") => {
	return await BookSyllabus.findAndCountAll({
		where: { name: { [Op.like]: `%${search}%` } },
		attributes: [
			"id",
			"name",
			"is_active",
			[Sequelize.col("District.name"), "district_name"],
		],
		include: [{ model: District, attributes: [], required: false }],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Create a new book syllabus
 */
export const createBookSyllabus = async (data) => {
	return await BookSyllabus.create(data);
};

/**
 * Update a book syllabus
 */
export const updateBookSyllabus = async (id, data) => {
	const item = await BookSyllabus.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a book syllabus by ID
 */
export const getBookSyllabusById = async (id) => {
	return await BookSyllabus.findOne({ where: { id } });
};
