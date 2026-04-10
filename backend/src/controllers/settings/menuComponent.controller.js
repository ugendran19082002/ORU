import { Op } from "sequelize";
import Component from "../../model/Component.js";
import Menu from "../../model/Menu.js";
import MenuComponent from "../../model/MenuComponent.js";
import PermissionRole from "../../model/PermissionRole.js";
import PermissionUser from "../../model/PermissionUser.js";
import { logger } from "../../utils/logger.js";
import { sendError, sendSuccess } from "../../utils/response.js";

/**
 * Add MenuComponent
 */
export const addMenuComponent = async (req, res) => {
	const transaction = await MenuComponent.sequelize.transaction();
	try {
		const { menu_id, component_id, index_component_id } = req.body;

		if (!menu_id || !component_id)
			return sendError(res, "menu_id and component_id are required", 400);

		const checkMenuComp = await MenuComponent.findOne({ where: { menu_id } });
		if (checkMenuComp)
			return sendError(res, "MenuComponent already exists", 400);

		await MenuComponent.create(
			{
				menu_id,
				component_id: component_id.join(","),
				index_component_id,
				created_by: req.user?.user_id || 0,
				created_ip: req.ip,
			},
			{ transaction },
		);

		await transaction.commit();
		return sendSuccess(res, {}, "MenuComponent created successfully", 201);
	} catch (error) {
		await transaction.rollback();
		logger.error(`MENU_COMPONENT_ADD_ERROR: ${error.message}`);
		return sendError(res, "Failed to create MenuComponent");
	}
};

/**
 * Edit MenuComponent
 */
export const editMenuComponent = async (req, res) => {
	const transaction = await MenuComponent.sequelize.transaction();
	try {
		const { id } = req.params;
		const { menu_id, component_id, index_component_id } = req.body;

		const menuComp = await MenuComponent.findByPk(id, { transaction });
		if (!menuComp) return sendError(res, "MenuComponent not found", 404);

		const checkMenuComp = await MenuComponent.findOne({
			where: { menu_id, id: { [Op.ne]: id } },
		});

		if (checkMenuComp)
			return sendError(res, "MenuComponent already exists", 400);

		await menuComp.update(
			{
				menu_id: menu_id || menuComp.menu_id,
				component_id: component_id.join(",") || menuComp.component_id,
				index_component_id: index_component_id || menuComp.index_component_id,
				updated_by: req.user?.user_id || 0,
				updated_ip: req.ip,
			},
			{ transaction },
		);

		await transaction.commit();
		return sendSuccess(res, {}, "MenuComponent updated successfully");
	} catch (error) {
		await transaction.rollback();
		logger.error(`MENU_COMPONENT_EDIT_ERROR: ${error.message}`);
		return sendError(res, "Failed to update MenuComponent");
	}
};

/**
 * Get Route API (Dynamic Sidebar/Routes)
 */
export const getRouteApi = async (req, res) => {
	try {
		const userId = req.user?.user_id;
		const roleId = req.user?.role_id;


		console.log("userId", userId, "roleId", req.user);
		const userPermissions = await PermissionUser.findAll({
			where: { user_id: userId, is_active: true },
			attributes: ["menu_component_id"],
		});

		const rolePermissions = roleId
			? await PermissionRole.findAll({
				where: { role_id: roleId, is_active: true },
				attributes: ["menu_component_id"],
			})
			: [];

		const allowedMenuComponentIds = new Set([
			...userPermissions.map((p) => p.menu_component_id),
			...rolePermissions.map((p) => p.menu_component_id),
		]);

		if (allowedMenuComponentIds.size === 0)
			return sendSuccess(res, [], "No permissions found");

		const menuComponents = await MenuComponent.findAll({
			where: { id: [...allowedMenuComponentIds] },
		});

		const allComponentIds = new Set();
		menuComponents.forEach((mc) => {
			if (mc.index_component_id) allComponentIds.add(mc.index_component_id);
			if (mc.component_id) {
				mc.component_id.split(",").forEach((id) => {
					if (Number(id)) allComponentIds.add(Number(id));
				});
			}
		});

		const components = await Component.findAll({
			where: { id: [...allComponentIds] },
		});

		const componentMap = {};
		for (const c of components) {
			componentMap[c.id] = { path: c.path, element: c.name, title: c.title };
		}

		const allMenus = await Menu.findAll({
			where: { is_active: true },
			order: [
				["menu_order", "ASC"],
				["submenu_order", "ASC"],
			],
		});

		const menuMap = {};
		for (const m of allMenus) {
			menuMap[m.id] = m.toJSON();
		}

		const visibleParentMenuIds = new Set();
		menuComponents.forEach((mc) => {
			const menu = menuMap[mc.menu_id];
			if (menu?.parent_id) {
				let currentId = menu.parent_id;
				while (currentId && menuMap[currentId]) {
					visibleParentMenuIds.add(currentId);
					currentId = menuMap[currentId].parent_id;
				}
			}
		});

		const nodes = [];
		allMenus.forEach((m) => {
			if (visibleParentMenuIds.has(m.id)) {
				nodes.push({
					id: m.id,
					parent_id: m.parent_id,
					name: m.name,
					icon: m.icon,
					display: m.is_display,
					display_order: Number(m.menu_order || 0),
					submenu: [],
					path: m.name,
				});
			}
		});

		menuComponents.forEach((mc) => {
			const menu = menuMap[mc.menu_id];
			if (!menu) return;

			const parentId = menu.parent_id;
			const processedComponentIds = new Set();

			const addNode = (compId, isIndex) => {
				if (processedComponentIds.has(compId)) return;
				processedComponentIds.add(compId);

				const comp = componentMap[compId];
				if (!comp) return;

				nodes.push({
					id: `leaf-${mc.id}-${compId}`,
					parent_id: parentId,
					name: isIndex ? menu.name : comp.title,
					icon: menu.icon,
					path: comp.path || menu.name,
					element: comp.element,
					display: menu.is_display && isIndex,
					display_order: Number(menu.submenu_order || menu.menu_order || 0),
				});
			};

			if (mc.index_component_id) addNode(mc.index_component_id, true);
			if (mc.component_id) {
				mc.component_id.split(",").forEach((id) => {
					const cId = Number(id);
					if (cId) addNode(cId, false);
				});
			}
		});

		const tree = [];
		const idToNode = {};

		nodes.forEach((n) => {
			if (typeof n.id === "number") idToNode[n.id] = n;
		});

		nodes.forEach((n) => {
			if (n.parent_id && idToNode[n.parent_id]) {
				idToNode[n.parent_id].submenu = idToNode[n.parent_id].submenu || [];
				idToNode[n.parent_id].submenu.push(n);
			} else {
				tree.push(n);
			}
		});

		const cleanNode = (node) => {
			if (node.submenu && node.submenu.length > 0) {
				node.submenu.sort((a, b) => a.display_order - b.display_order);
				node.submenu = node.submenu.map(cleanNode);
			} else {
				delete node.submenu;
			}
			const { id: _id, parent_id: _parent_id, ...rest } = node;
			return rest;
		};

		const result = tree
			.sort((a, b) => a.display_order - b.display_order)
			.map(cleanNode);

		return sendSuccess(res, result, "Routes fetched successfully");
	} catch (error) {
		logger.error(`ROUTE_API_ERROR: ${error.message}`);
		return sendError(res, "Failed to fetch routes");
	}
};
