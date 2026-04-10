import { MESSAGES } from "../../constants/messages.js";
import { STATUS_CODES } from "../../constants/statusCodes.js";
import * as UploadService from "../../services/upload/UploadService.js";
import { logger } from "../../utils/logger.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { createUpload } from "../../utils/uploadFile.js";

/**
 * Handle File Upload
 */
export const uploadFile = async (req, res) => {
	try {
		const uploadMiddleware = createUpload();

		uploadMiddleware(req, res, async (err) => {
			if (err) {
				logger.error(`UPLOAD_MIDDLEWARE_ERROR: ${err.message}`);
				return sendError(
					res,
					`${MESSAGES.FILE_UPLOAD_FAILED}: ${err.message}`,
					STATUS_CODES.BAD_REQUEST,
				);
			}

			const tempFiles = req.files || [];
			const code = req.body.code;

			if (!code) {
				await UploadService.cleanupTempFiles(tempFiles);
				return sendError(
					res,
					MESSAGES.MISSING_DOCUMENT_CODE,
					STATUS_CODES.BAD_REQUEST,
				);
			}

			const docSettings = await UploadService.getDocumentByCode(code);
			if (!docSettings) {
				await UploadService.cleanupTempFiles(tempFiles);
				return sendError(
					res,
					MESSAGES.INVALID_DOCUMENT_CODE,
					STATUS_CODES.BAD_REQUEST,
				);
			}

			try {
				const uploadedFiles = await UploadService.processUploadedFiles(
					tempFiles,
					docSettings,
					code,
				);

				if (uploadedFiles.length === 0) {
					return sendError(
						res,
						MESSAGES.NO_FILES_UPLOADED,
						STATUS_CODES.BAD_REQUEST,
					);
				}

				return sendSuccess(res, uploadedFiles, MESSAGES.CREATE_SUCCESS);
			} catch (processError) {
				await UploadService.cleanupTempFiles(tempFiles);
				logger.error(`UPLOAD_PROCESS_ERROR: ${processError.message}`);
				return sendError(res, processError.message, STATUS_CODES.BAD_REQUEST);
			}
		});
	} catch (error) {
		logger.error(`UPLOAD_CONTROLLER_ERROR: ${error.message}`);
		return sendError(
			res,
			MESSAGES.INTERNAL_SERVER_ERROR,
			STATUS_CODES.INTERNAL_ERROR,
		);
	}
};
