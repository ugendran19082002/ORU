import { sequelizeDb } from "../../config/database.js";
import Menu from "../../model/Menu.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * Add Menu
 */
export const addMenu = async (req, res) => {
	const transaction = await sequelizeDb.transaction();
	try {
		const {
			name,
			submenu_type,
			icon,
			is_display = true,
			menu_order = "0",
			submenus = [],
		} = req.body;

		if (!name) return sendError(res, "Menu name required", 400);

		const parentMenu = await Menu.create(
			{
				name,
				parent_id: null,
				icon,
				is_display,
				menu_order: Number(menu_order),
				is_active: true,
				created_by: req.user?.user_id || 0,
				created_ip: req.ip,
				is_main_menu: submenu_type,
			},
			{ transaction },
		);

		if (submenu_type === "1" && Array.isArray(submenus)) {
			const submenuPayload = submenus.map((sm) => ({
				name: sm.submenu_name,
				parent_id: parentMenu.id,
				icon: sm.icon || null,
				is_display: sm.is_display,
				submenu_order: Number(sm.submenu_order || 0),
				is_active: true,
				created_by: req.user?.user_id || 0,
				created_ip: req.ip,
			}));

			await Menu.bulkCreate(submenuPayload, { transaction });
		}

		await transaction.commit();
		return sendSuccess(res, {}, "Menu created successfully", 201);
	} catch (error) {
		await transaction.rollback();
		logger.error(`MENU_ADD_ERROR: ${error.message}`);
		return sendError(res, "Failed to create menu");
	}
};

/**
 * Edit Menu
 */
export const editMenu = async (req, res) => {
	const transaction = await sequelizeDb.transaction();
	try {
		const { id } = req.params;
		const {
			name,
			is_display,
			menu_order,
			submenus = [],
			submenu_type,
			is_active,
			icon,
		} = req.body;

		const menu = await Menu.findByPk(id, { transaction });
		if (!menu) {
			await transaction.rollback();
			return sendError(res, "Menu not found", 404);
		}

		await menu.update(
			{
				name,
				is_main_menu: submenu_type,
				is_display,
				icon,
				menu_order: Number(menu_order),
				is_active,
				updated_by: req.user?.user_id || 0,
				updated_ip: req.ip,
			},
			{ transaction },
		);

		// Handle submenus
		const existingSubmenus = await Menu.findAll({
			where: { parent_id: id },
			transaction,
		});

		const existingIds = existingSubmenus.map((s) => s.id);
		const incomingIds = submenus
			.filter((s) => Number(s.id) > 0)
			.map((s) => Number(s.id));

		const deleteIds = existingIds.filter((eid) => !incomingIds.includes(eid));
		if (deleteIds.length) {
			await Menu.destroy({ where: { id: deleteIds }, transaction });
		}

		for (const sm of submenus) {
			if (Number(sm.id) > 0) {
				await Menu.update(
					{
						name: sm.submenu_name,
						is_display: sm.is_display,
						submenu_order: Number(sm.submenu_order || 0),
						icon: sm.icon || null,
						updated_by: req.user?.user_id || 0,
						updated_ip: req.ip,
					},
					{ where: { id: sm.id }, transaction },
				);
			} else {
				await Menu.create(
					{
						name: sm.submenu_name,
						parent_id: id,
						icon: sm.icon || null,
						is_display: sm.is_display,
						submenu_order: Number(sm.submenu_order || 0),
						is_active: true,
						created_by: req.user?.user_id || 0,
						created_ip: req.ip,
					},
					{ transaction },
				);
			}
		}

		await transaction.commit();
		return sendSuccess(res, {}, "Menu updated successfully");
	} catch (error) {
		await transaction.rollback();
		logger.error(`MENU_EDIT_ERROR: ${error.message}`);
		return sendError(res, "Failed to update menu");
	}
};

/**
 * List Menus
 */
export const getMenu = async (req, res) => {
	try {
		const { page, limit, search } = req.body;
		const {
			limit: limitNum,
			offset,
			page: pageNum,
		} = getPagination(page, limit);

		const { count, rows } = await Menu.findAndCountAll({
			where: {
				parent_id: null,
				...(search && {
					[Op.or]: [{ name: { [Op.like]: `%${search}%` } }],
				}),
			},
			attributes: [
				"id",
				"name",
				"is_display",
				"parent_id",
				"menu_order",
				"icon",
				"is_main_menu",
				"is_active",
			],
			order: [["menu_order", "ASC"]],
			limit: limitNum,
			offset,
		});

		const result = await Promise.all(
			rows.map(async (menu) => {
				const submenusCount = await Menu.count({
					where: { parent_id: menu.id },
				});
				return { ...menu.toJSON(), submenus: submenusCount };
			}),
		);

		const pagingData = getPagingData(
			{ count, rows: result },
			pageNum,
			limitNum,
		);
		return sendSuccess(res, pagingData, "Menus fetched");
	} catch (error) {
		logger.error(`MENU_GET_ERROR: ${error.message}`);
		return sendError(res, "Failed to fetch menus");
	}
};

/**
 * View Menu
 */
export const viewMenu = async (req, res) => {
	try {
		const { id } = req.params;
		const menu = await Menu.findByPk(id);
		if (!menu) return sendError(res, "Menu not found", 404);

		const submenus = await Menu.findAll({
			where: { parent_id: id },
			order: [["submenu_order", "ASC"]],
		});

		const data = {
			name: menu.name,
			is_display: !!menu.is_display,
			menu_order: menu.menu_order,
			is_active: menu.is_active,
			icon: menu.icon,
			submenu_type: menu.is_main_menu,
			submenus: submenus.map((s) => ({
				id: String(s.id),
				submenu_name: s.name,
				is_active: s.is_active,
				submenu_type: s.is_main_menu,
				icon: s.icon,
				is_display: !!Number(s.is_display),
				submenu_order: String(s.submenu_order),
			})),
		};

		return sendSuccess(res, data, "Menu fetched successfully");
	} catch (error) {
		logger.error(`MENU_VIEW_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};
