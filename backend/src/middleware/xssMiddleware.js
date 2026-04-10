import xss from "xss";

/**
 * Recursively sanitize objects, arrays, and strings
 */
const sanitize = (data) => {
    if (typeof data === "string") {
        return xss(data);
    }
    if (Array.isArray(data)) {
        return data.map((item) => sanitize(item));
    }
    if (typeof data === "object" && data !== null) {
        const sanitizedData = {};
        for (const key in data) {
            sanitizedData[key] = sanitize(data[key]);
        }
        return sanitizedData;
    }
    return data;
};

/**
 * Middleware to sanitize request body, query, and params
 */
const xssMiddleware = (req, _res, next) => {
    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }
    next();
};

export default xssMiddleware;
