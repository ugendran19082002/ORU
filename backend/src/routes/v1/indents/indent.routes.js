import express from "express";
import {
	addIndent,
	getIndentById,
	getIndents,
	updateIndent,
} from "../../../controllers/indents/indent.controller.js";
import { authenticateToken } from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import {
	validateIndent,
	validateUpdateIndent,
} from "../../../validations/master.validation.js";

const router = express.Router();

/**
 * @route POST /api/v1/indents/list
 * @desc Get all indents with pagination and search
 * @access Private
 */
router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getIndents,
);

/**
 * @route POST /api/v1/indents/add
 * @desc Create a new indent
 * @access Private
 */
router.post(
	"/add",
	authenticateToken,
	validateIndent,
	validateResponse,
	addIndent,
);

/**
 * @route GET /api/v1/indents/:id
 * @desc Get indent by ID
 * @access Private
 */
router.get(
	"/:id",
	authenticateToken,
	validateResponse,
	getIndentById,
);

/**
 * @route PUT /api/v1/indents/:id
 * @desc Update an indent
 * @access Private
 */
router.put(
	"/:id",
	authenticateToken,
	validateUpdateIndent,
	validateResponse,
	updateIndent,
);

export default router;

