import express from "express";
import {
	addBook,
	getBookById,
	getBooks,
	updateBook,
} from "../../../controllers/master/book.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateBook } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getBooks,
);
router.post(
	"/add",
	authenticateToken,
	validateBook,
	validateResponse,
	addBook,
);
router.get("/:id", authenticateToken, getBookById);
router.put(
	"/:id",
	authenticateToken,
	validateBook,
	validateResponse,
	updateBook,
);

export default router;
