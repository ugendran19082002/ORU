import express from "express";
import {
	addOrganization,
	getOrganizationById,
	getOrganizations,
	updateOrganization,
} from "../../../controllers/master/organization.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";
import { validateOrganization } from "../../../validations/master.validation.js";

const router = express.Router();

router.post(
	"/list",
	authenticateToken,
	validateResponse,
	getOrganizations,
);
router.post(
	"/add",
	authenticateToken,
	validateOrganization,
	validateResponse,
	addOrganization,
);
router.get("/:id", authenticateToken, getOrganizationById);
router.put(
	"/:id",
	authenticateToken,
	validateOrganization,
	validateResponse,
	updateOrganization,
);

export default router;
