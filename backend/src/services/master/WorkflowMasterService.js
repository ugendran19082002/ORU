import { Op } from "sequelize";
import { Workflow } from "../../model/index.js";

/**
 * Get all workflows with pagination and search
 */
export const getWorkflows = async (limit, offset, search = "") => {
	return await Workflow.findAndCountAll({
		where: { name: { [Op.like]: `%${search}%` } },
		attributes: ["id", "name", "is_active", "created_on"],
		order: [["id", "DESC"]],
		limit: limit,
		offset: offset,
	});
};

/**
 * Find workflow by name (uniqueness check)
 */
export const findWorkflowByName = async (name, excludeId = null) => {
	const where = { name: name.trim(), is_active: true };
	if (excludeId) where.id = { [Op.ne]: excludeId };
	return await Workflow.findOne({ where });
};

/**
 * Create a new workflow
 */
export const createWorkflow = async (data) => {
	return await Workflow.create(data);
};

/**
 * Update a workflow
 */
export const updateWorkflow = async (id, data) => {
	const item = await Workflow.findByPk(id);
	if (!item) return null;
	return await item.update(data);
};

/**
 * Get a workflow by ID
 */
export const getWorkflowById = async (id) => {
	return await Workflow.findOne({ where: { id } });
};
