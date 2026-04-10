import { Op } from "sequelize";
import Component from "../../model/Component.js";
import Menu from "../../model/Menu.js";

/**
 * COMPONENT SERVICES
 */
export const getComponents = async (limit, offset, search = "") => {
	return await Component.findAndCountAll({
		where: {
			[Op.or]: [
				{ name: { [Op.like]: `%${search}%` } },
				{ title: { [Op.like]: `%${search}%` } },
			],
		},
		attributes: ["id", "title", "name", "path", "remarks", "is_active"],
		limit,
		offset,
		order: [["id", "DESC"]],
	});
};

export const getComponentByPath = async (path, excludeId = null) => {
	const where = { path };
	if (excludeId) where.id = { [Op.ne]: excludeId };
	return await Component.findOne({ where });
};

export const createComponent = async (data) => {
	return await Component.create(data);
};

export const getComponentById = async (id) => {
	return await Component.findByPk(id);
};

export const updateComponent = async (id, data) => {
	const component = await Component.findByPk(id);
	if (!component) return null;
	return await component.update(data);
};

/**
 * MENU SERVICES
 */
export const getMenus = async () => {
	return await Menu.findAll({
		where: { is_active: true },
		order: [["order_no", "ASC"]],
	});
};

export const getMenuById = async (id) => {
	return await Menu.findByPk(id);
};

export const createMenu = async (data) => {
	return await Menu.create(data);
};

export const updateMenu = async (id, data) => {
	const menu = await Menu.findByPk(id);
	if (!menu) return null;
	return await menu.update(data);
};
