import express from "express";
import * as OptionController from "../../../controllers/option/option.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

// Middleware
router.use(authenticateToken);

// Specific/Custom Routes
router.get("/menu", validateResponse, OptionController.optionMenu);
router.get(
	"/menu-component",
	validateResponse,
	OptionController.optionMenuComponent,
);
router.get(
	"/role-user/:id",
	validateResponse,
	OptionController.optionRoleByUser,
);
router.get(
	"/role-by-organization/:id",
	validateResponse,
	OptionController.optionRoleByOrganization,
);
router.get(
	"/department-by-organization/:id",
	validateResponse,
	OptionController.optionDepartmentByOrganization,
);
router.get(
	"/designation-by-department/:id",
	validateResponse,
	OptionController.optionDesignationByDepartment,
);
router.get(
	"/role-all-field",
	validateResponse,
	OptionController.optionRoleAllField,
);
router.get(
	"/parent-book",
	validateResponse,
	OptionController.optionParentBooks,
);
router.post("/book-list", validateResponse, OptionController.optionBooksList);
router.get(
	"/work-allocation-user",
	validateResponse,
	OptionController.optionWorkAllocationUser,
);
router.get(
	"/error-category/:id",
	validateResponse,
	OptionController.optionErrorCategory,
);
router.get(
	"/error-sub-category/:id",
	validateResponse,
	OptionController.optionErrorSubCategory,
);
router.get(
	"/approve-academic-year",
	validateResponse,
	OptionController.optionApproveAcademicYear,
);

// Standard Alpha-Sorted Routes
router.get(
	"/academic-year",
	validateResponse,
	OptionController.optionAcademicYear,
);
router.get("/bank", validateResponse, OptionController.optionBank);
router.get(
	"/binding-type",
	validateResponse,
	OptionController.optionBindingType,
);
router.get("/book", validateResponse, OptionController.optionBook);
router.get("/book-medium", validateResponse, OptionController.optionBookMedium);
router.get(
	"/book-standard",
	validateResponse,
	OptionController.optionBookStandard,
);
router.get("/book-term", validateResponse, OptionController.optionBookTerm);
router.get(
	"/book-syllabus",
	validateResponse,
	OptionController.optionBookSyllabus,
);
router.get("/component", validateResponse, OptionController.optionComponent);
router.get(
	"/defect-category",
	validateResponse,
	OptionController.optionDefectCategory,
);
router.get(
	"/defect-sub-category",
	validateResponse,
	OptionController.optionDefectSubCategory,
);
router.get("/defect-type", validateResponse, OptionController.optionDefectType);
router.get(
	"/delivery-point",
	validateResponse,
	OptionController.optionDeliveryPoint,
);
router.get("/department", validateResponse, OptionController.optionDepartment);
router.get(
	"/designation",
	validateResponse,
	OptionController.optionDesignation,
);
router.get("/district", validateResponse, OptionController.optionDistrict);
router.get("/document", validateResponse, OptionController.optionDocument);
router.get(
	"/edition-type",
	validateResponse,
	OptionController.optionEditionType,
);
router.get("/error-type", validateResponse, OptionController.optionErrorType);
router.get("/godown", validateResponse, OptionController.optionGodown);
router.get(
	"/indenting-department",
	validateResponse,
	OptionController.optionIndentingDepartment,
);
router.get(
	"/machine-category",
	validateResponse,
	OptionController.optionMachineCategory,
);
router.get(
	"/organization",
	validateResponse,
	OptionController.optionOrganization,
);
router.get("/paper-type", validateResponse, OptionController.optionPaperType);
router.get("/printer", validateResponse, OptionController.optionPrinter);
router.get(
	"/printer-bank",
	validateResponse,
	OptionController.optionPrinterBank,
);
router.get(
	"/printer-document-type",
	validateResponse,
	OptionController.optionPrinterDocumentType,
);
router.get(
	"/printer-technical-detail",
	validateResponse,
	OptionController.optionPrinterTechnicalDetail,
);
router.get(
	"/printer-type",
	validateResponse,
	OptionController.optionPrinterType,
);
router.get(
	"/printing-type",
	validateResponse,
	OptionController.optionPrintingType,
);
router.get("/role", validateResponse, OptionController.optionRole);
router.get(
	"/transportation-type",
	validateResponse,
	OptionController.optionTransportationType,
);
router.get("/user", validateResponse, OptionController.optionUser);
router.get(
	"/vehicle-type",
	validateResponse,
	OptionController.optionVehicleType,
);
router.get("/workflow", validateResponse, OptionController.optionWorkflow);
router.get(
	"/workflow-status",
	validateResponse,
	OptionController.optionWorkflowStatus,
);

export default router;
