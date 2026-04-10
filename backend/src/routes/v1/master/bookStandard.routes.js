import express from "express";
import {
	addBookStandard,
	getBookStandardById,
	getBookStandards,
	updateBookStandard,
} from "../../../controllers/master/bookStandard.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateBookStandard } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getBookStandards,
);
router.post(
	"/add",
	authenticateToken,
	validateBookStandard,
	validateResponse,
	addBookStandard,
);
router.get("/:id", authenticateToken, getBookStandardById);
router.put(
	"/:id",
	authenticateToken,
	validateBookStandard,
	validateResponse,
	updateBookStandard,
);

export default router;
