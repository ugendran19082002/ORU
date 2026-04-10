import path from "node:path";
import Document from "../../model/Document.js";
import { date } from "../../utils/date.js";
import {
	deleteFile,
	moveFileToFinalDestination,
} from "../../utils/uploadFile.js";

/**
 * Validate file extension against allowed extensions
 */
export const isValidExtension = (filename, allowedExtensions) => {
	if (!allowedExtensions) return true;
	const ext = path.extname(filename).toLowerCase().replace(".", "");
	const allowed = allowedExtensions.toLowerCase().replace(/\s/g, "").split(",");
	return allowed.includes(ext);
};

/**
 * Get document settings by code
 */
export const getDocumentByCode = async (code) => {
	return await Document.findOne({ where: { code } });
};

/**
 * Process and move uploaded files
 */
export const processUploadedFiles = async (tempFiles, docSettings, code) => {
	const uploadedFiles = [];

	for (const file of tempFiles) {
		// Validate Extension
		if (!isValidExtension(file.originalname, docSettings.extensions)) {
			throw new Error(
				`Invalid file type: ${file.originalname}. Allowed: ${docSettings.extensions}`,
			);
		}

		// Generate Final Filename
		const uniqueName = `${code}-${date("YYYYMMDDHHMMss")}-${file.originalname}`;

		// Move File
		await moveFileToFinalDestination(file.path, docSettings.path, uniqueName);

		uploadedFiles.push(`/uploads/${docSettings.path}/${uniqueName}`);
	}

	return uploadedFiles;
};

/**
 * Cleanup temporary files
 */
export const cleanupTempFiles = async (tempFiles) => {
	for (const file of tempFiles) {
		await deleteFile(file.path);
	}
};
