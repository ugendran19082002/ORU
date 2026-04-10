import express from "express";
import * as UploadController from "../../../controllers/upload/upload.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

/**
 * @route POST /api/v1/upload
 * @desc Handle file upload(s)
 * @access Private
 */
router.post(
	"/",
	authenticateToken,
	validateResponse,
	UploadController.uploadFile,
);

export default router;
