import express from "express";
import {
	addBookMedium,
	getBookMediumById,
	getBookMediums,
	updateBookMedium,
} from "../../../controllers/master/bookMedium.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateBookMedium } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getBookMediums,
);
router.post(
	"/add",
	authenticateToken,
	validateBookMedium,
	validateResponse,
	addBookMedium,
);
router.get("/:id", authenticateToken, getBookMediumById);
router.put(
	"/:id",
	authenticateToken,
	validateBookMedium,
	validateResponse,
	updateBookMedium,
);

export default router;
