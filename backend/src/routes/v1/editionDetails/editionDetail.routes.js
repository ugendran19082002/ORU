import express from "express";
import * as EditionDetailController from "../../../controllers/editionDetails/editionDetail.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

// Middleware
router.use(authenticateToken);
router.use(validateResponse);

/**
 * @route POST /api/v1/edition-detail/list
 * @desc Get list of edition details with pagination
 */
router.post("/list", EditionDetailController.editionDetailList);

/**
 * @route POST /api/v1/edition-detail/add
 * @desc Create a new edition detail
 */
router.post("/add", EditionDetailController.addEditionDetail);

/**
 * @route PUT /api/v1/edition-detail/edit/:id
 * @desc Update an existing edition detail
 */
router.put("/edit/:id", EditionDetailController.updateEditionDetail);

/**
 * @route GET /api/v1/edition-detail/view/:id
 * @desc Get edition detail by ID
 */
router.get("/view/:id", EditionDetailController.getEditionDetailById);

/**
 * @route GET /api/v1/edition-detail/book-list/:id
 * @desc Get list of books for edition detail (1 = approval, others = others)
 */
router.get("/book-list/:id", EditionDetailController.getApprovedBooksList);

export default router;
