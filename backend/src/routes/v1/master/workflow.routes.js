import express from "express";
import {
	addWorkflow,
	getWorkflowById,
	getWorkflows,
	updateWorkflow,
} from "../../../controllers/master/workflow.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateWorkflow } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getWorkflows,
);

router.post(
	"/add",
	authenticateToken,
	validateWorkflow,
	validateResponse,
	addWorkflow,
);

router.get("/:id", authenticateToken, getWorkflowById);

router.put(
	"/:id",
	authenticateToken,
	validateWorkflow,
	validateResponse,
	updateWorkflow,
);

export default router;
