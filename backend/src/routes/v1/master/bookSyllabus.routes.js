import express from "express";
import {
	addBookSyllabus,
	getBookSyllabusById,
	getBookSyllabuses,
	updateBookSyllabus,
} from "../../../controllers/master/bookSyllabus.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateBookSyllabus } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getBookSyllabuses,
);

router.post(
	"/add",
	authenticateToken,
	validateBookSyllabus,
	validateResponse,
	addBookSyllabus,
);

router.get("/:id", authenticateToken, getBookSyllabusById);

router.put(
	"/:id",
	authenticateToken,
	validateBookSyllabus,
	validateResponse,
	updateBookSyllabus,
);

export default router;
