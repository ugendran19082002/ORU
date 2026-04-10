import express from "express";
import {
	contentVerificationList,
	getContentVerificationById,
	getProofReaderErrorlog,
	getWorkAllocationList,
	updateContentForBook,
	updateContentVerification,
	updateProofReaderErrorlog,
	updateReturnStatus,
	updateVerifiedStatus,
	updateWorkAllocation,
} from "../../../controllers/contentVerification/contentVerification.controller.js";
import { authenticateToken } from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

/**
 * @route POST /api/v1/content-verification/list
 */
router.post(
	"/list",
	authenticateToken,
	validateResponse,
	contentVerificationList,
);

/**
 * @route PUT /api/v1/content-verification/edit/:id
 */
router.put(
	"/edit/:id",
	authenticateToken,
	validateResponse,
	updateContentVerification,
);

/**
 * @route GET /api/v1/content-verification/view/:id
 */
router.get(
	"/view/:id",
	authenticateToken,
	validateResponse,
	getContentVerificationById,
);

/**
 * @route POST /api/v1/content-verification/update-work-allocation
 */
router.post(
	"/update-work-allocation",
	authenticateToken,
	validateResponse,
	updateWorkAllocation,
);

/**
 * @route POST /api/v1/content-verification/work-allocation-list
 */
router.post(
	"/work-allocation-list",
	authenticateToken,
	validateResponse,
	getWorkAllocationList,
);

/**
 * @route POST /api/v1/content-verification/update-error
 */
router.post(
	"/update-error",
	authenticateToken,
	validateResponse,
	updateProofReaderErrorlog,
);

/**
 * @route POST /api/v1/content-verification/get-error-log
 */
router.post(
	"/get-error-log",
	authenticateToken,
	validateResponse,
	getProofReaderErrorlog,
);

/**
 * @route POST /api/v1/content-verification/return-error
 */
router.post(
	"/return-error",
	authenticateToken,
	validateResponse,
	updateReturnStatus,
);

/**
 * @route POST /api/v1/content-verification/verified-error
 */
router.post(
	"/verified-error",
	authenticateToken,
	validateResponse,
	updateVerifiedStatus,
);

/**
 * @route POST /api/v1/content-verification/save-book-master
 */
router.post(
	"/save-book-master",
	authenticateToken,
	validateResponse,
	updateContentForBook,
);

export default router;

