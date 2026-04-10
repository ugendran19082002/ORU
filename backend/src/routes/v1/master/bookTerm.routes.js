import express from "express";
import {
	addBookTerm,
	getBookTermById,
	getBookTerms,
	updateBookTerm,
} from "../../../controllers/master/bookTerm.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateBookTerm } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getBookTerms,
);

router.post(
	"/add",
	authenticateToken,
	validateBookTerm,
	validateResponse,
	addBookTerm,
);

router.get("/:id", authenticateToken, getBookTermById);

router.put(
	"/:id",
	authenticateToken,
	validateBookTerm,
	validateResponse,
	updateBookTerm,
);

export default router;
