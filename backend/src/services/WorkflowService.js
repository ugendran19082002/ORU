import * as models from "../model/index.js";

const {
	Workflow,
	WorkflowTask,
	WorkflowTransaction,
	WorkflowStatus,
	WorkflowTaskTable,
} = models;

/**
 * Initiate a new workflow instance.
 */
export const initiateWorkflow = async (
	workflowId,
	transactionNo,
	user,
	comments = "",
) => {
	try {
		const workflow = await Workflow.findByPk(workflowId);
		if (!workflow) throw new Error("Invalid Workflow ID");

		const startTask = await WorkflowTask.findOne({
			where: {
				workflow_id: workflowId,
				level: 1,
				is_active: true,
			},
		});

		if (!startTask)
			throw new Error("Workflow configuration error: No start task found.");

		return await WorkflowTransaction.create({
			workflow_id: workflowId,
			workflow_status_id: startTask.workflow_status_id,
			designation_id: user.designation_id || startTask.designation_id,
			department_id: user.department_id,
			organization_id: user.organization_id,
			district_id: user.district_id,
			workflow_name: workflow.name,
			status_name: startTask.status_name,
			workflow_transaction_no: transactionNo,
			parent_id: 0,
			workflow_task_id: startTask.id,
			comments: comments,
			start_date: new Date(),
			created_by: user.user_id || user.id,
		});
	} catch (error) {
		console.error("Error initiating workflow:", error);
		throw error;
	}
};

/**
 * Process a workflow step (Approve/Forward).
 */
export const processStep = async (
	transactionNo,
	user,
	comments,
	targetStatusId = null,
) => {
	try {
		if (!comments || comments.trim() === "")
			throw new Error("Comments are mandatory for processing a step.");

		const lastTransaction = await WorkflowTransaction.findOne({
			where: { workflow_transaction_no: transactionNo },
			order: [["id", "DESC"]],
		});

		if (!lastTransaction) throw new Error("Transaction not found.");
		if (lastTransaction.status_name === "Rejected")
			throw new Error("Workflow is already rejected.");

		const currentTaskId = lastTransaction.workflow_task_id;

		let nextTask;
		if (lastTransaction.status_name === "Returned") {
			nextTask = await WorkflowTask.findOne({
				where: {
					id: currentTaskId,
					workflow_id: lastTransaction.workflow_id,
					is_active: true,
				},
			});
		} else {
			nextTask = await WorkflowTask.findOne({
				where: {
					parent_id: currentTaskId,
					workflow_id: lastTransaction.workflow_id,
					is_active: true,
				},
			});
		}

		if (!nextTask)
			throw new Error(
				"Workflow end reached or configuration error: No next step found.",
			);

		if (user.designation_id !== nextTask.designation_id) {
			throw new Error(
				`Unauthorized: User designation (${user.designation_id}) does not match the required designation (${nextTask.designation_id}) for the next step.`,
			);
		}

		if (targetStatusId && parseInt(targetStatusId, 10) === 2) {
			return await rejectWorkflow(transactionNo, user, comments);
		}

		if (targetStatusId && parseInt(targetStatusId, 10) === 3) {
			return await revertStep(transactionNo, user, comments);
		}

		if (
			targetStatusId &&
			parseInt(targetStatusId, 10) !== nextTask.workflow_status_id
		) {
			if (
				parseInt(targetStatusId, 10) === 2 ||
				parseInt(targetStatusId, 10) === 0
			) {
				return await rejectWorkflow(transactionNo, user, comments);
			}

			if (currentTaskId) {
				const currentTaskObj = await WorkflowTask.findByPk(currentTaskId);
				if (currentTaskObj?.parent_id) {
					const prevTask = await WorkflowTask.findByPk(
						currentTaskObj.parent_id,
					);
					if (
						prevTask &&
						prevTask.workflow_status_id === parseInt(targetStatusId, 10)
					) {
						return await revertStep(transactionNo, user, comments);
					}
				}
			}

			throw new Error(
				`Invalid Target Status: Expected ${nextTask.workflow_status_id}, got ${targetStatusId}`,
			);
		}

		const newTransaction = await WorkflowTransaction.create({
			workflow_id: lastTransaction.workflow_id,
			workflow_status_id: nextTask.workflow_status_id,
			designation_id: user.designation_id || nextTask.designation_id,
			department_id: user.department_id,
			organization_id: user.organization_id,
			district_id: user.district_id,
			workflow_name: nextTask.workflow_name || lastTransaction.workflow_name,
			status_name: nextTask.status_name,
			workflow_transaction_no: transactionNo,
			parent_id: nextTask.id || 0,
			workflow_task_id: nextTask.id,
			comments: comments,
			start_date: new Date(),
			created_by: user.id || user.user_id,
		});

		if (nextTask.id) {
			try {
				const taskTableUpdates = await WorkflowTaskTable.findAll({
					where: {
						workflow_task_id: nextTask.id,
						workflow_status_id: nextTask.workflow_status_id,
						is_active: true,
					},
				});

				if (taskTableUpdates && taskTableUpdates.length > 0) {
					for (const updateConfig of taskTableUpdates) {
						const ModelToUpdate = models[updateConfig.model_name];
						if (ModelToUpdate) {
							await ModelToUpdate.update(
								{
									[updateConfig.column_name]: updateConfig.column_value,
									updated_by: user.id || user.user_id,
									updated_ip: user.ip_address || "::1",
									updated_on: new Date(),
								},
								{ where: { workflow_transaction_no: transactionNo } },
							);
						}
					}
				}
			} catch (innerError) {
				console.error("Error executing dynamic table updates:", innerError);
			}
		}

		return newTransaction;
	} catch (error) {
		console.error("Error processing workflow step:", error);
		throw error;
	}
};

/**
 * Revert the workflow to the previous step (Return to previous office).
 */
export const revertStep = async (transactionNo, user, comments) => {
	try {
		if (!comments || comments.trim() === "")
			throw new Error("Comments are mandatory for reverting a step.");

		const lastTransaction = await WorkflowTransaction.findOne({
			where: { workflow_transaction_no: transactionNo },
			order: [["id", "DESC"]],
		});

		if (!lastTransaction) throw new Error("Transaction not found.");

		const startTask = await WorkflowTask.findOne({
			where: {
				workflow_id: lastTransaction.workflow_id,
				level: 1,
				is_active: true,
			},
		});

		const targetTaskId = startTask
			? startTask.id
			: lastTransaction.workflow_task_id;

		return await WorkflowTransaction.create({
			workflow_id: lastTransaction.workflow_id,
			workflow_status_id: 3,
			designation_id: user.designation_id,
			department_id: user.department_id,
			organization_id: user.organization_id,
			district_id: user.district_id,
			workflow_name: lastTransaction.workflow_name,
			status_name: "Returned",
			workflow_transaction_no: transactionNo,
			parent_id: targetTaskId,
			workflow_task_id: targetTaskId,
			comments: comments,
			start_date: new Date(),
			created_by: user.id || user.user_id,
		});
	} catch (error) {
		console.error("Error reverting workflow step:", error);
		throw error;
	}
};

/**
 * Reject the workflow (Stop Application).
 */
export const rejectWorkflow = async (transactionNo, user, comments) => {
	try {
		if (!comments || comments.trim() === "")
			throw new Error("Comments are mandatory for rejection.");

		const lastTransaction = await WorkflowTransaction.findOne({
			where: { workflow_transaction_no: transactionNo },
			order: [["id", "DESC"]],
		});

		if (!lastTransaction) throw new Error("Transaction not found.");

		return await WorkflowTransaction.create({
			workflow_id: lastTransaction.workflow_id,
			workflow_status_id: 2,
			designation_id: user.designation_id,
			department_id: user.department_id,
			organization_id: user.organization_id,
			district_id: user.district_id,
			workflow_name: lastTransaction.workflow_name,
			status_name: "Rejected",
			workflow_transaction_no: transactionNo,
			parent_id: lastTransaction.parent_id,
			workflow_task_id: lastTransaction.workflow_task_id,
			comments: comments,
			start_date: new Date(),
			created_by: user.id || user.user_id,
		});
	} catch (error) {
		console.error("Error rejecting workflow:", error);
		throw error;
	}
};

/**
 * Get workflow progress including Task details and Timeline.
 */
export const getWorkflowProgress = async (transactionNo) => {
	try {
		const history = await WorkflowTransaction.findAll({
			where: { workflow_transaction_no: transactionNo },
			include: [
				{ model: WorkflowTask, required: false },
				{
					model: models.User,
					attributes: ["id", "name", "username"],
					required: false,
				},
			],
			order: [["id", "ASC"]],
		});

		if (!history.length) return { timeline: [] };

		const workflowId = history[0].workflow_id;
		const lastTransaction = history[history.length - 1];

		const allTasks = await WorkflowTask.findAll({
			where: { workflow_id: workflowId, is_active: true },
			order: [["level", "ASC"]],
		});

		const timeline = [];
		for (const h of history) {
			const dt = new Date(h.created_on);
			let taskDef = allTasks.find((t) => t.id === h.workflow_task_id);
			if (!taskDef && h.parent_id === 0)
				taskDef = allTasks.find((t) => t.level === 1);

			let designationName = "N/A";
			const actorTaskDef = allTasks.find(
				(t) => t.designation_id === h.designation_id,
			);
			if (actorTaskDef) designationName = actorTaskDef.designation_name;
			else if (taskDef) designationName = taskDef.designation_name;

			const actor = await models.User.findByPk(h.created_by);

			timeline.push({
				task_id: taskDef ? taskDef.id : h.workflow_task_id || 0,
				level: taskDef ? taskDef.level : 0,
				title: h.status_name,
				status: "Completed",
				designation_name: designationName,
				designation_id: h.designation_id,
				date: dt.toISOString().split("T")[0],
				time: dt.toTimeString().split(" ")[0],
				remarks: h.comments,
				actor_id: h.created_by,
				actor_name: actor?.name,
				transaction_no: transactionNo,
			});
		}

		if (lastTransaction.status_name !== "Approved") {
			let pendingTaskId = null;
			if (lastTransaction.status_name === "Returned") {
				pendingTaskId = lastTransaction.workflow_task_id;
			} else if (lastTransaction.status_name !== "Rejected") {
				const currentTaskId = lastTransaction.workflow_task_id;
				const currentTaskDef =
					allTasks.find((t) => t.id === currentTaskId) ||
					(lastTransaction.parent_id === 0
						? allTasks.find((t) => t.level === 1)
						: null);
				if (currentTaskDef) {
					const nextTask = allTasks.find(
						(t) => t.level === currentTaskDef.level + 1,
					);
					if (nextTask) pendingTaskId = nextTask.id;
				}
			}

			if (pendingTaskId) {
				const pendingTask = allTasks.find((t) => t.id === pendingTaskId);
				if (pendingTask) {
					timeline.push({
						task_id: pendingTask.id,
						level: pendingTask.level,
						title: pendingTask.status_name,
						status: "Current",
						designation_name: pendingTask.designation_name,
						designation_id: pendingTask.designation_id,
						transaction_no: transactionNo,
					});

					allTasks
						.filter((t) => t.level > pendingTask.level)
						.forEach((ft) => {
							timeline.push({
								task_id: ft.id,
								level: ft.level,
								title: ft.status_name,
								status: "Pending",
								designation_name: ft.designation_name,
								designation_id: ft.designation_id,
								transaction_no: transactionNo,
							});
						});
				}
			}
		}

		return { timeline };
	} catch (error) {
		console.error("Error getting workflow progress:", error);
		throw error;
	}
};

/**
 * Get available next status options for a transaction.
 */
export const getNextStatusOptions = async (transactionNo, user) => {
	try {
		const lastTransaction = await WorkflowTransaction.findOne({
			where: { workflow_transaction_no: transactionNo },
			order: [["id", "DESC"]],
		});

		if (!lastTransaction || lastTransaction.status_name === "Rejected")
			return [];

		const currentTaskId =
			lastTransaction.workflow_task_id ||
			(lastTransaction.parent_id !== 0
				? lastTransaction.parent_id
				: lastTransaction.id);

		let nextTask;
		if (lastTransaction.status_name === "Returned") {
			nextTask = await WorkflowTask.findOne({
				where: {
					id: currentTaskId,
					workflow_id: lastTransaction.workflow_id,
					is_active: true,
				},
			});
		} else {
			nextTask = await WorkflowTask.findOne({
				where: {
					parent_id: currentTaskId,
					workflow_id: lastTransaction.workflow_id,
					is_active: true,
				},
			});
		}

		const options = [];
		if (nextTask && user.designation_id === nextTask.designation_id) {
			options.push({
				id: nextTask.workflow_status_id,
				name: nextTask.status_name,
				type: "forward",
			});
			options.push({ id: 2, name: "Reject", type: "reject" });

			const currentTask = await WorkflowTask.findByPk(currentTaskId);
			if (currentTask?.parent_id) {
				const prevTask = await WorkflowTask.findByPk(currentTask.parent_id);
				if (prevTask) options.push({ id: 3, name: "Return", type: "backward" });
			}
		}

		return options;
	} catch (error) {
		console.error("Error getting status options:", error);
		throw error;
	}
};
