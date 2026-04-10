/**
 * Application Messages
 */
export const MESSAGES = {
    // Generic Success
    CREATE_SUCCESS: "Created successfully",
    UPDATE_SUCCESS: "Updated successfully",
    DELETE_SUCCESS: "Deleted successfully",
    FETCH_SUCCESS: "Data fetched successfully",
    LOGIN_SUCCESS: "Logged in successfully",
    LOGOUT_SUCCESS: "Logout successfully",
    PASSWORD_CHANGED: "Password changed successfully",

    // Generic Errors
    INTERNAL_SERVER_ERROR: "Internal Server Error",
    DATA_NOT_FOUND: "Data not found",
    BAD_REQUEST: "Bad Request",
    UNAUTHORIZED: "Unauthorized access",
    INVALID_ID: "Invalid ID",

    // Specific Errors (Keep only if unique context is needed)
    INVALID_CREDENTIALS: "Invalid Username and Password",
    INVALID_PASSWORD: "Invalid password combination",
    PASSWORD_SAME_AS_USERNAME: "Password cannot be same as username",
    INVALID_CAPTCHA: "Invalid Captcha",
    FILE_UPLOAD_FAILED: "File upload failed",
    NO_FILES_UPLOADED: "No files uploaded",
    MISSING_DOCUMENT_CODE: "Missing document code",
    INVALID_DOCUMENT_CODE: "Invalid document code",
};
