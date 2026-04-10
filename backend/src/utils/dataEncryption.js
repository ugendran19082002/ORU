export const encodeToData = (data) => {
	const buffer = Buffer.from(data, "utf-8");
	return buffer.toString("base64");
};

export const decodeToData = (data) => {
	const buffer = Buffer.from(data, "base64");
	return buffer.toString("utf-8");
};
// Example: Base64 encoding a string
