import { sequelizeDb } from "../../config/database.js";
import PermissionRole from "../../model/PermissionRole.js";
import PermissionUser from "../../model/PermissionUser.js";
import { logger } from "../../utils/logger.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * Add Role Permissions (Bulk)
 */
export const addRolePermissions = async (req, res) => {
	const transaction = await sequelizeDb.transaction();
	try {
		const { menu_component_ids = [], role_ids = [] } = req.body;

		if (!menu_component_ids.length || !role_ids.length) {
			await transaction.rollback();
			return sendError(res, "Invalid data", 400);
		}

		const uniqueRoleIds = [...new Set(role_ids)];
		const uniqueMenuComponentIds = [...new Set(menu_component_ids)];

		const existing = await PermissionRole.findAll({
			where: {
				role_id: uniqueRoleIds,
				menu_component_id: uniqueMenuComponentIds,
			},
			attributes: ["role_id", "menu_component_id"],
			transaction,
			raw: true,
		});

		const existingSet = new Set(
			existing.map((e) => `${e.role_id}-${e.menu_component_id}`),
		);
		const rows = [];

		for (const role_id of uniqueRoleIds) {
			for (const menu_component_id of uniqueMenuComponentIds) {
				const key = `${role_id}-${menu_component_id}`;
				if (existingSet.has(key)) continue;

				rows.push({
					role_id,
					menu_component_id,
					is_active: 1,
					created_by: req.user?.user_id ?? 0,
					created_ip: req.ip?.replace("::ffff:", ""),
				});
			}
		}

		if (rows.length) {
			await PermissionRole.bulkCreate(rows, { transaction });
		}

		await transaction.commit();
		return sendSuccess(
			res,
			{ inserted: rows.length },
			rows.length
				? "Role permissions added successfully"
				: "All role permissions already exist",
		);
	} catch (error) {
		await transaction.rollback();
		logger.error(`ROLE_PERMISSION_ADD_ERROR: ${error.message}`);
		return sendError(res, error.message);
	}
};

/**
 * Add User Permissions (Bulk)
 */
export const addUserPermissions = async (req, res) => {
	const transaction = await sequelizeDb.transaction();
	try {
		const { menu_component_ids = [], user_ids = [], role_id = "" } = req.body;

		if (!menu_component_ids.length || !user_ids.length || !role_id) {
			await transaction.rollback();
			return sendError(res, "Invalid data", 400);
		}

		const uniqueUserIds = [...new Set(user_ids)];
		const uniqueMenuComponentIds = [...new Set(menu_component_ids)];

		const existing = await PermissionUser.findAll({
			where: {
				user_id: uniqueUserIds,
				menu_component_id: uniqueMenuComponentIds,
			},
			attributes: ["user_id", "menu_component_id"],
			transaction,
			raw: true,
		});

		const existingSet = new Set(
			existing.map((e) => `${e.user_id}-${e.menu_component_id}`),
		);
		const rows = [];

		for (const user_id of uniqueUserIds) {
			for (const mc of uniqueMenuComponentIds) {
				const key = `${user_id}-${mc}`;
				if (existingSet.has(key)) continue;

				rows.push({
					user_id,
					menu_component_id: mc,
					role_id: role_id,
					is_active: 1,
					created_by: req.user?.user_id ?? 0,
					created_ip: req.ip?.replace("::ffff:", ""),
					created_on: new Date(),
				});
			}
		}

		if (rows.length) {
			await PermissionUser.bulkCreate(rows, { transaction });
		}

		await transaction.commit();
		return sendSuccess(
			res,
			{ inserted: rows.length },
			rows.length
				? "User permissions added successfully"
				: "All permissions already exist",
		);
	} catch (error) {
		await transaction.rollback();
		logger.error(`USER_PERMISSION_ADD_ERROR: ${error.message}`);
		return sendError(res, error.message);
	}
};

/**
 * Edit Role Permission
 */
export const editPermissionRole = async (req, res) => {
	try {
		const { id } = req.params;
		const { is_active } = req.body;

		const row = await PermissionRole.findByPk(id);
		if (!row) return sendError(res, "Not found", 404);

		await row.update({
			is_active,
			updated_by: req.user?.user_id || 0,
			updated_ip: req.ip,
		});

		return sendSuccess(res, {}, "Permission updated");
	} catch (error) {
		return sendError(res, error.message);
	}
};

/**
 * Edit User Permission
 */
export const editPermissionUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { is_active } = req.body;

		const row = await PermissionUser.findByPk(id);
		if (!row) return sendError(res, "Not found", 404);

		await row.update({
			is_active,
			updated_by: req.user?.user_id || 0,
			updated_ip: req.ip,
		});

		return sendSuccess(res, {}, "Permission updated");
	} catch (error) {
		return sendError(res, error.message);
	}
};
