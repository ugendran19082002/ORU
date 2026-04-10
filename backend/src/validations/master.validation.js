import { body } from "express-validator";

const nameValidation = (fieldName = "name") =>
	body(fieldName)
		.trim()
		.notEmpty()
		.withMessage(`${fieldName.replace(/_/g, " ")} is required`);

const idValidation = (fieldName) =>
	body(fieldName)
		.isInt({ min: 1 })
		.withMessage(`${fieldName.replace(/_/g, " ")} must be a positive integer`);

export const validateRole = [
	nameValidation(),
	body("organization_id")
		.optional()
		.isInt()
		.withMessage("Organization ID must be an integer"),
	body("is_admin")
		.optional()
		.isBoolean()
		.withMessage("is_admin must be a boolean"),
];

export const validateAcademicYear = [
	nameValidation(),
	body("from_date")
		.notEmpty()
		.withMessage("From date is required")
		.isDate()
		.withMessage("Invalid from date format"),
	body("to_date")
		.notEmpty()
		.withMessage("To date is required")
		.isDate()
		.withMessage("Invalid to date format"),
];

export const validateBank = [nameValidation()];

export const validateUpdateBank = [
	nameValidation(),
	body("is_active")
		.optional()
		.isBoolean()
		.withMessage("is_active must be a boolean"),
];

export const validateBindingType = [nameValidation()];

export const validateBook = [
	nameValidation(),
	idValidation("book_medium_id"),
	idValidation("book_standard_id"),
	idValidation("paper_type_id").optional(),
	idValidation("binding_type_id").optional(),
	idValidation("edition_type_id").optional(),
];

export const validateBookMedium = [nameValidation()];

export const validateBookStandard = [nameValidation()];

export const validateDefectType = [nameValidation()];

export const validateDefectCategory = [
	nameValidation(),
	idValidation("defect_type_id"),
];

export const validateDefectSubCategory = [
	nameValidation(),
	idValidation("defect_category_id"),
	body("defect_amount_percent")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("Defect amount percent must be a positive number"),
];

export const validateErrorType = [nameValidation()];

export const validateErrorCategory = [
	nameValidation(),
	idValidation("error_type_id"),
];

export const validateErrorSubCategory = [
	nameValidation(),
	idValidation("error_category_id"),
];
export const validateDepartment = [
	nameValidation(),
	idValidation("organization_id"),
];

export const validateDesignation = [
	nameValidation(),
	idValidation("department_id"),
];

export const validateDistrict = [nameValidation()];

export const validateEditionType = [nameValidation()];

export const validateOrganization = [nameValidation()];

export const validatePaperType = [nameValidation()];

export const validateDeliveryPoint = [
	nameValidation(),
	idValidation("district_id").optional(),
	body("mobile_no")
		.optional()
		.isMobilePhone()
		.withMessage("Invalid mobile number"),
	body("email").optional().isEmail().withMessage("Invalid email format"),
];

export const validateGodown = [
	nameValidation(),
	idValidation("district_id").optional(),
	body("mobile_no")
		.optional()
		.isMobilePhone()
		.withMessage("Invalid mobile number"),
	body("email").optional().isEmail().withMessage("Invalid email format"),
];

export const validatePrinter = [
	nameValidation(),
	idValidation("district_id").optional(),
	body("email").optional().isEmail().withMessage("Invalid email format"),
	body("office_email")
		.optional()
		.isEmail()
		.withMessage("Invalid office email format"),
	body("gst_no")
		.optional()
		.trim()
		.notEmpty()
		.withMessage("GST number cannot be empty if provided"),
];

export const validatePrinterType = [nameValidation()];

export const validatePrinterBank = [
	idValidation("printer_id"),
	idValidation("bank_id"),
	body("account_number")
		.trim()
		.notEmpty()
		.withMessage("Account number is required"),
];

export const validatePrinterCommercialDetail = [
	idValidation("printer_id"),
	nameValidation("type"),
	body("start_date").optional().isDate().withMessage("Invalid start date"),
	body("valid_date").optional().isDate().withMessage("Invalid valid date"),
];

export const validatePrinterContact = [
	idValidation("printer_id"),
	nameValidation("contact_person"),
	body("email").optional().isEmail().withMessage("Invalid email format"),
	body("mobile_no")
		.optional()
		.isMobilePhone()
		.withMessage("Invalid mobile number"),
];

export const validatePrinterDocumentType = [
	nameValidation(),
	idValidation("printer_id"),
];
export const validatePrinterTechnicalDetail = [
	nameValidation(),
	idValidation("printer_id"),
	idValidation("printing_type_id"),
	idValidation("machine_category_id"),
	body("capacity_per_month")
		.optional()
		.isInt({ min: 0 })
		.withMessage("Capacity must be a positive integer"),
];

export const validatePrintingType = [nameValidation()];

export const validatePrintingFlow = [
	idValidation("printer_id"),
	idValidation("book_id"),
];
export const validateTransportationType = [nameValidation()];

export const validateVehicleType = [nameValidation()];

export const validateTransportationRate = [
	idValidation("transportation_type_id"),
	idValidation("vehicle_type_id"),
	body("unit").trim().notEmpty().withMessage("Unit is required"),
	body("rate")
		.isFloat({ min: 0 })
		.withMessage("Rate must be a positive number"),
];

export const validateWorkflow = [nameValidation()];

export const validateUser = [
	body("username").trim().notEmpty().withMessage("Username is required"),
	body("password")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters"),
	idValidation("role_id"),
	idValidation("designation_id"),
	nameValidation(),
	body("email").optional().isEmail().withMessage("Invalid email format"),
];

export const validateUpdateUser = [
	body("username").trim().notEmpty().withMessage("Username is required"),
	idValidation("role_id"),
	idValidation("designation_id"),
	nameValidation(),
	body("email").optional().isEmail().withMessage("Invalid email format"),
	body("is_active")
		.optional()
		.isBoolean()
		.withMessage("is_active must be a boolean"),
];

export const validateBookTerm = [nameValidation()];

export const validateSubDistrict = [
	nameValidation(),
	idValidation("district_id"),
];

export const validateBookSyllabus = [nameValidation()];

export const validateIndent = [
	idValidation("book_id"),
	body("quantity")
		.notEmpty()
		.withMessage("Quantity is required")
		.isInt({ min: 1 })
		.withMessage("Quantity must be a positive integer"),
	idValidation("book_standard_id").optional(),
	idValidation("book_medium_id").optional(),
	idValidation("book_term_id").optional(),
	idValidation("book_syllabus_id").optional(),
	idValidation("indenting_department_id").optional(),
];

export const validateUpdateIndent = [
	idValidation("book_id").optional(),
	body("quantity")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Quantity must be a positive integer"),
	idValidation("book_standard_id").optional(),
	idValidation("book_medium_id").optional(),
	idValidation("book_term_id").optional(),
	idValidation("book_syllabus_id").optional(),
	idValidation("indenting_department_id").optional(),
];
