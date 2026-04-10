import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { getEnv } from "./env.js";

// Document model import removed as validation moves to controller

// Temp storage configuration
function createTempStorage() {
	return multer.diskStorage({
		destination: async (_req, _file, cb) => {
			try {
				const folder = path.join(process.cwd(), "uploads", "temp");
				await fs.mkdir(folder, { recursive: true });
				cb(null, folder);
			} catch (err) {
				cb(err);
			}
		},
		filename: (_req, file, cb) => {
			// Keep original name or random name for temp
			// We use a simple timestamp prefix to avoid collisions in temp
			const uniqueName = `${Date.now()}-${file.originalname}`;
			cb(null, uniqueName);
		},
	});
}

// File type check
function _checkFileType(file, cb, allowedExtensions) {
	if (!allowedExtensions) return cb(null, true); // allow any if not provided

	const extname = new RegExp(
		allowedExtensions.replace(/\./g, "").replace(/,/g, "|"),
	);
	const mimetype = extname.test(file.mimetype);
	if (mimetype && extname.test(path.extname(file.originalname).toLowerCase())) {
		cb(null, true);
	} else {
		cb(new Error(`Allowed extensions: ${allowedExtensions}`));
	}
}

// Create multer upload middleware
export const createUpload = ({
	fileSize = getEnv("MAX_FILE_SIZE") || 5000000,
} = {}) => {
	const storage = createTempStorage();

	const upload = multer({
		storage,
		limits: { fileSize },
		// No fileFilter here - we accept all and validate in controller
	});

	return upload.any();
};

export const moveFileToFinalDestination = async (
	tempPath,
	destinationFolder,
	finalFilename,
) => {
	try {
		const fullDestDir = path.join(process.cwd(), "uploads", destinationFolder);
		await fs.mkdir(fullDestDir, { recursive: true });

		const fullDestPath = path.join(fullDestDir, finalFilename);
		await fs.rename(tempPath, fullDestPath);

		return fullDestPath;
	} catch (error) {
		console.error("Error moving file:", error);
		throw error;
	}
};

export const deleteFile = async (filePath) => {
	try {
		await fs.unlink(filePath);
	} catch (_error) {
		// Ignore error if file doesn't exist
	}
};
