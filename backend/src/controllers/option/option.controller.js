import * as models from "../../model/index.js";
import * as OptionService from "../../services/option/OptionService.js";
import { logger } from "../../utils/logger.js";
import { sendError, sendSuccess } from "../../utils/response.js";

const {
	AcademicYear,
	Bank,
	BindingType,
	Book,
	BookMedium,
	BookStandard,
	BookSyllabus,
	BookTerm,
	Component,
	DefectCategory,
	DefectSubCategory,
	DefectType,
	DeliveryPoint,
	Department,
	Designation,
	District,
	Document,
	EditionType,
	ErrorType,
	Godown,
	IndentingDepartment,
	MachineCategory,
	Organization,
	PaperType,
	Printer,
	PrinterBank,
	PrinterDocumentType,
	PrinterTechnicalDetail,
	PrinterType,
	PrintingType,
	Role,
	TransportationType,
	User,
	VehicleType,
	Workflow,
	WorkflowStatus,
} = models;

/**
 * Controller Factory for Standard Options
 */
const standardOption = (Model, displayField, alias) => async (_req, res) => {
	try {
		const data = await OptionService.getStandardOptions(Model, displayField);
		return sendSuccess(
			res,
			data,
			`Option ${alias || Model.name} fetched successfully`,
		);
	} catch (error) {
		logger.error(
			`OPTION_${(alias || Model.name).toUpperCase()}_ERROR: ${error.message}`,
		);
		return sendError(res, `Failed to get option ${alias || Model.name}`);
	}
};

/**
 * Custom Option Controllers
 */

export const optionApproveAcademicYear = async (_req, res) => {
	try {
		const data = await OptionService.getApproveAcademicYears();
		const result = data.map((item) => ({
			id: String(item.id),
			name: item.name,
		}));
		return sendSuccess(
			res,
			result,
			"Option academic year fetched successfully",
		);
	} catch (error) {
		logger.error(`OPTION_APPROVE_ACADEMIC_YEAR_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option academic year");
	}
};

export const optionMenu = async (_req, res) => {
	try {
		const data = await OptionService.getMenus();
		return sendSuccess(res, data, "Option menu fetched successfully");
	} catch (error) {
		logger.error(`OPTION_MENU_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option menu");
	}
};

export const optionMenuComponent = async (_req, res) => {
	try {
		const data = await OptionService.getMenuComponents();
		return sendSuccess(res, data, "Option menu component fetched successfully");
	} catch (error) {
		logger.error(`OPTION_MENU_COMPONENT_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option menu component");
	}
};

export const optionRoleByUser = async (req, res) => {
	try {
		const { id } = req.params;
		const data = await OptionService.getRolesByCriteria({ id });
		const result = data.map((item) => ({
			id: String(item.id),
			name: item.name,
		}));
		return sendSuccess(res, result, "Option role fetched successfully");
	} catch (error) {
		logger.error(`OPTION_ROLE_BY_USER_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option role by user");
	}
};

export const optionRoleByOrganization = async (req, res) => {
	try {
		const { id: organizationId } = req.params;
		const data = await OptionService.getRolesByCriteria({
			organization_id: organizationId,
		});
		const result = data.map((role) => ({
			id: String(role.id),
			name: role.name,
			organization_id: role.organization_id,
			is_admin: role.is_admin,
			is_delivery_point: role.is_delivery_point,
			is_district: role.is_district,
			is_printer: role.is_printer,
			is_godown: role.is_godown,
		}));
		return sendSuccess(res, result, "Option role fetched successfully");
	} catch (error) {
		logger.error(`OPTION_ROLE_BY_ORGANIZATION_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option role by organization");
	}
};

export const optionDepartmentByOrganization = async (req, res) => {
	try {
		const { id: orgId } = req.params;
		const data = await OptionService.getDepartmentsByOrganization(orgId);
		const result = data.map((item) => ({
			id: String(item.id),
			name: item.name,
		}));
		return sendSuccess(res, result, "Option department fetched successfully");
	} catch (error) {
		logger.error(`OPTION_DEPARTMENT_BY_ORGANIZATION_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option department by organization");
	}
};

export const optionDesignationByDepartment = async (req, res) => {
	try {
		const { id: deptId } = req.params;
		const data = await OptionService.getDesignationsByDepartment(deptId);
		const result = data.map((item) => ({
			id: String(item.id),
			name: item.name,
		}));
		return sendSuccess(res, result, "Option designation fetched successfully");
	} catch (error) {
		logger.error(`OPTION_DESIGNATION_BY_DEPARTMENT_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option designation by department");
	}
};

export const optionRoleAllField = async (_req, res) => {
	try {
		const data = await OptionService.getRolesByCriteria({});
		const result = data.map((role) => ({
			id: String(role.id),
			name: role.name,
			organization_id: role.organization_id,
			is_admin: role.is_admin,
			is_delivery_point: role.is_delivery_point,
			is_district: role.is_district,
			is_printer: role.is_printer,
			is_godown: role.is_godown,
		}));
		return sendSuccess(res, result, "Option role fetched successfully");
	} catch (error) {
		logger.error(`OPTION_ROLE_ALL_FIELD_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option role all field");
	}
};

export const optionParentBooks = async (_req, res) => {
	try {
		const data = await OptionService.getParentBooks();
		return sendSuccess(res, data, "Option parent books fetched successfully");
	} catch (error) {
		logger.error(`OPTION_PARENT_BOOKS_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option parent books");
	}
};

export const optionBooksList = async (req, res) => {
	try {
		const { book_standard_id, book_medium_id, book_syllabus_id } = req.body;
		if (!book_standard_id || !book_medium_id || !book_syllabus_id) {
			return sendError(
				res,
				"book stand id, book medium id, book syllabus id Not Found",
				400,
			);
		}
		const data = await OptionService.getBooksFiltered(req.body);
		return sendSuccess(res, data, "Books retrieved successfully");
	} catch (error) {
		logger.error(`OPTION_BOOK_LIST_ERROR: ${error.message}`);
		return sendError(res, "Internal server error");
	}
};

export const optionWorkAllocationUser = async (_req, res) => {
	try {
		const data = await OptionService.getWorkAllocationUsers();
		const result = data.map((user) => ({
			id: String(user.id),
			name: user.name,
		}));
		return sendSuccess(
			res,
			result,
			"Option work allocation user fetched successfully",
		);
	} catch (error) {
		logger.error(`OPTION_WORK_ALLOCATION_USER_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option work allocation user");
	}
};

export const optionErrorCategory = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return sendError(res, "Error Type id Not Found", 400);
		const data = await OptionService.getErrorCategories(id);
		const result = data.map((item) => ({
			id: String(item.id),
			name: item.name,
		}));
		return sendSuccess(
			res,
			result,
			"Option error category fetched successfully",
		);
	} catch (error) {
		logger.error(`OPTION_ERROR_CATEGORY_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option error category");
	}
};

export const optionErrorSubCategory = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return sendError(res, "Error category id Not Found", 400);
		const data = await OptionService.getErrorSubCategories(id);
		const result = data.map((item) => ({
			id: String(item.id),
			name: item.name,
		}));
		return sendSuccess(
			res,
			result,
			"Option error sub category fetched successfully",
		);
	} catch (error) {
		logger.error(`OPTION_ERROR_SUB_CATEGORY_ERROR: ${error.message}`);
		return sendError(res, "Failed to get option error sub category");
	}
};

/**
 * Standard Mapped Controllers
 */
export const optionAcademicYear = standardOption(
	AcademicYear,
	"name",
	"Academic Year",
);
export const optionBank = standardOption(Bank, "name", "Bank");
export const optionBindingType = standardOption(
	BindingType,
	"name",
	"Binding Type",
);
export const optionBook = standardOption(Book, "name", "Book");
export const optionBookMedium = standardOption(
	BookMedium,
	"name",
	"Book Medium",
);
export const optionBookStandard = standardOption(
	BookStandard,
	"name",
	"Book Standard",
);
export const optionBookTerm = standardOption(BookTerm, "name", "Book Term");
export const optionBookSyllabus = standardOption(
	BookSyllabus,
	"name",
	"Book Syllabus",
);
export const optionComponent = standardOption(Component, "title", "Component");
export const optionDefectCategory = standardOption(
	DefectCategory,
	"name",
	"Defect Category",
);
export const optionDefectSubCategory = standardOption(
	DefectSubCategory,
	"name",
	"Defect Sub Category",
);
export const optionDefectType = standardOption(
	DefectType,
	"name",
	"Defect Type",
);
export const optionDeliveryPoint = standardOption(
	DeliveryPoint,
	"name",
	"Delivery Point",
);
export const optionDepartment = standardOption(
	Department,
	"name",
	"Department",
);
export const optionDesignation = standardOption(
	Designation,
	"name",
	"Designation",
);
export const optionDistrict = standardOption(District, "name", "District");
export const optionDocument = standardOption(Document, "name", "Document");
export const optionEditionType = standardOption(
	EditionType,
	"name",
	"Edition Type",
);
export const optionErrorType = standardOption(ErrorType, "name", "Error Type");
export const optionGodown = standardOption(Godown, "name", "Godown");
export const optionIndentingDepartment = standardOption(
	IndentingDepartment,
	"name",
	"Indenting Department",
);
export const optionMachineCategory = standardOption(
	MachineCategory,
	"name",
	"Machine Category",
);
export const optionOrganization = standardOption(
	Organization,
	"name",
	"Organization",
);
export const optionPaperType = standardOption(PaperType, "name", "Paper Type");
export const optionPrinter = standardOption(Printer, "name", "Printer");
export const optionPrinterBank = standardOption(
	PrinterBank,
	"holder_name",
	"Printer Bank",
);
export const optionPrinterDocumentType = standardOption(
	PrinterDocumentType,
	"name",
	"Printer Document Type",
);
export const optionPrinterTechnicalDetail = standardOption(
	PrinterTechnicalDetail,
	"name",
	"Printer Technical Detail",
);
export const optionPrinterType = standardOption(
	PrinterType,
	"name",
	"Printer Type",
);
export const optionPrintingType = standardOption(
	PrintingType,
	"name",
	"Printing Type",
);
export const optionRole = standardOption(Role, "name", "Role");
export const optionTransportationType = standardOption(
	TransportationType,
	"name",
	"Transportation Type",
);
export const optionUser = standardOption(User, "name", "User");
export const optionVehicleType = standardOption(
	VehicleType,
	"name",
	"Vehicle Type",
);
export const optionWorkflow = standardOption(Workflow, "name", "Workflow");
export const optionWorkflowStatus = standardOption(
	WorkflowStatus,
	"name",
	"Workflow Status",
);
