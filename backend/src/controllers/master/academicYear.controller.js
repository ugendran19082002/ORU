import { Op } from "sequelize";
import { sequelizeDb } from "../../config/database.js";
import { AcademicYear } from "../../model/index.js";
import * as WorkflowService from "../../services/WorkflowService.js";
import { logger } from "../../utils/logger.js";
import { getPagination, getPagingData } from "../../utils/pagination.js";
import { sendError, sendSuccess } from "../../utils/response.js";

// GET Academic Years (with pagination, search, and optional organization filter if needed)
export const getAcademicYears = async (req, res) => {
	try {
		const { page, limit, search = "" } = req.body;
		const {
			limit: limitValue,
			offset,
			page: pageValue,
		} = getPagination(page, limit);

		const { count, rows } = await AcademicYear.findAndCountAll({
			where: {
				name: { [Op.like]: `%${search}%` },
			},
			attributes: [
				"id",
				"name",
				"from_date",
				"to_date",
				"remarks",
				"is_active",
				"created_on",
				"is_approved",
				"workflow_transaction_no",
			],
			limit: limitValue,
			offset: offset,
			order: [["id", "DESC"]],
		});

		const pagingData = getPagingData({ count, rows }, pageValue, limitValue);
		return sendSuccess(
			res,
			pagingData,
			count
				? "Academic years retrieved successfully"
				: "No academic years found",
		);
	} catch (error) {
		logger.error(`MASTER005: Error fetching academic years - ${error.message}`);
		return sendError(res, "Failed to get academic years");
	}
};

// CREATE Academic Year
export const addAcademicYear = async (req, res) => {
	const t = await sequelizeDb.transaction();
	try {
		const { name, from_date, to_date, remarks } = req.body;
		const userId = req.user?.user_id || 0;

		// Generate Transaction Number
		const transactionNo = `WF-${Date.now()}`;

		// 1. Initiate Workflow (ID 1 = Academic Year Plan)
		await WorkflowService.initiateWorkflow(
			1,
			transactionNo,
			req.user,
			remarks,
			"AcademicYear",
		);

		// 2. Create Academic Year
		const academicYear = await AcademicYear.create(
			{
				name: name.trim(),
				from_date,
				to_date,
				remarks: remarks || null,
				workflow_transaction_no: transactionNo, // Save the link
				is_active: true,
				created_by: userId,
				created_ip: req.ip,
			},
			{ transaction: t },
		);

		await t.commit();
		logger.info("Academic year created successfully");
		return sendSuccess(
			res,
			academicYear,
			"Academic year created and workflow initiated successfully",
			201,
		);
	} catch (error) {
		await t.rollback();
		logger.error(`MASTER006: Error creating academic year - ${error.message}`);
		return sendError(res, "Failed to create academic year");
	}
};

// UPDATE Academic Year
export const updateAcademicYear = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, from_date, to_date, remarks, is_active } = req.body;
		const userId = req.user?.user_id || 0;

		const academicYear = await AcademicYear.findOne({
			where: { id },
		});

		if (!academicYear) {
			return sendError(res, "Academic year not found", 404);
		}

		await academicYear.update({
			name: name.trim(),
			from_date,
			to_date,
			remarks: remarks || null,
			is_active: is_active,
			updated_by: userId,
			updated_ip: req.ip,
			updated_on: new Date(),
		});

		return sendSuccess(res, [], "Academic year updated successfully");
	} catch (error) {
		logger.error(`MASTER007: Error updating academic year - ${error.message}`);
		return sendError(res, "Failed to update academic year");
	}
};

// GET Single Academic Year by ID
export const getAcademicYearById = async (req, res) => {
	try {
		const { id } = req.params;

		const academicYear = await AcademicYear.findOne({
			where: { id },
			attributes: [
				"id",
				"name",
				"from_date",
				"to_date",
				"remarks",
				"created_on",
			],
		});

		if (!academicYear) {
			return sendError(res, "Academic year not found", 404);
		}

		return sendSuccess(
			res,
			academicYear,
			"Academic year retrieved successfully",
		);
	} catch (error) {
		logger.error(
			`MASTER008: Error fetching academic year by id - ${error.message}`,
		);
		return sendError(res, "Failed to get academic year");
	}
};
