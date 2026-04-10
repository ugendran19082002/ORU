import { Sequelize } from "sequelize";
import * as models from "../../model/index.js";

const {
	AcademicYear,
	Book,
	CurrentStock,
	Department,
	Designation,
	ErrorCategory,
	ErrorSubCategory,
	Menu,
	MenuComponent,
	Role,
	User,
} = models;

/**
 * Generic fetcher for standard options
 */
export const getStandardOptions = async (Model, displayField = "name") => {
	const options = await Model.findAll({
		where: { is_active: true },
		attributes: ["id", [displayField, "name"]],
		order: [[displayField, "ASC"]],
	});

	return options.map((item) => ({
		id: String(item.id),
		name: item.getDataValue("name"),
	}));
};

/**
 * Custom Option Fetchers
 */

export const getApproveAcademicYears = async () => {
	return await AcademicYear.findAll({
		where: { is_active: true, is_approved: true },
		attributes: ["id", "name"],
		order: [["id", "ASC"]],
	});
};

export const getMenus = async () => {
	const menus = await Menu.findAll({
		where: { is_active: true, parent_id: null },
		attributes: ["id", "name", "is_main_menu"],
		order: [["id", "ASC"]],
	});

	const result = await Promise.all(
		menus.map(async (menu) => {
			if (menu.is_main_menu === 2) {
				return [{ id: String(menu.id), name: `(Main Menu) ${menu.name}` }];
			}
			const children = await Menu.findAll({
				where: { parent_id: menu.id },
				attributes: ["id", "name"],
			});
			return children.map((child) => ({
				id: String(child.id),
				name: `(Main Menu) ${menu.name} (Sub Menu) ${child.name}`,
			}));
		}),
	);
	return result.flat();
};

export const getMenuComponents = async () => {
	const components = await MenuComponent.findAll({
		attributes: ["menu_id", "id"],
		group: ["menu_id", "id"],
	});

	const result = await Promise.all(
		components.map(async (component) => {
			const menu = await Menu.findByPk(component.menu_id, {
				attributes: ["id", "name"],
			});
			return menu ? { id: String(component.id), name: menu.name } : null;
		}),
	);
	return result.filter(Boolean);
};

export const getRolesByCriteria = async (where) => {
	return await Role.findAll({ where });
};

export const getDepartmentsByOrganization = async (organizationId) => {
	return await Department.findAll({
		where: { organization_id: organizationId },
	});
};

export const getDesignationsByDepartment = async (departmentId) => {
	return await Designation.findAll({
		where: { department_id: departmentId },
	});
};

export const getParentBooks = async () => {
	const books = await Book.findAll({
		where: { is_active: true },
		attributes: ["id", "name"],
		order: [["id", "ASC"]],
	});

	const result = [{ id: "0", name: "New Book" }];
	for (const book of books) {
		result.push({ id: String(book.id), name: book.name });
	}
	return result;
};

export const getBooksFiltered = async (params) => {
	const {
		edition_type_id,
		book_standard_id,
		book_medium_id,
		book_term_id,
		book_syllabus_id,
	} = params;

	const where = { is_active: true };
	if (book_medium_id) where.book_medium_id = book_medium_id;
	if (book_standard_id) where.book_standard_id = book_standard_id;
	if (book_term_id) where.book_term_id = book_term_id;
	if (edition_type_id) where.is_approval = Number(edition_type_id) === 1;
	if (book_syllabus_id) where.book_syllabus_id = book_syllabus_id;

	return await Book.findAll({
		where,
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
		include: [
			{
				model: CurrentStock,
				attributes: [],
				required: false,
			},
		],
		group: ["Book.id"],
	});
};

export const getErrorCategories = async (errorTypeId) => {
	return await ErrorCategory.findAll({
		where: { is_active: true, error_type_id: errorTypeId },
		attributes: ["id", "name"],
		order: [["id", "ASC"]],
	});
};

export const getErrorSubCategories = async (errorCategoryId) => {
	return await ErrorSubCategory.findAll({
		where: { is_active: true, error_category_id: errorCategoryId },
		attributes: ["id", "name"],
		order: [["id", "ASC"]],
	});
};

export const getWorkAllocationUsers = async () => {
	return await User.findAll({
		where: { is_active: true, designation_id: 44 },
		attributes: ["id", "name"],
		order: [["id", "ASC"]],
	});
};
