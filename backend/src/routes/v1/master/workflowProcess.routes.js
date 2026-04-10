import express from "express";
import {
	getWorkflowProgress,
	getWorkflowStatusOptions,
	processWorkflowStep,
} from "../../../controllers/master/workflowProcess.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

/**
 * GET Workflow Progress
 */
router.get(
	"/progress/:transaction_no",
	authenticateToken,
	validateResponse,
	getWorkflowProgress,
);

/**
 * GET Workflow Status Options
 */
router.get(
	"/status-options/:transaction_no",
	authenticateToken,
	getWorkflowStatusOptions,
);

/**
 * PROCESS Workflow Step
 */
router.post("/process", authenticateToken, processWorkflowStep);

export default router;
