import moment from "moment-timezone";

export const date = (format) => {
	// Use moment-timezone to get the current date in Asia/Kolkata timezone
	const now = moment.tz("Asia/Kolkata");

	// Mapping format tokens to moment format strings
	const formatTokens = {
		YYYY: "YYYY",
		MM: "MM",
		DD: "DD",
		HH: "HH",
		mm: "mm",
		ss: "ss",
	};

	// Replace format tokens in the user-defined format string
	const momentFormat = format.replace(
		/YYYY|MM|DD|HH|mm|ss/g,
		(match) => formatTokens[match],
	);

	// Format the date using moment
	const formattedDate = now.format(momentFormat);

	return formattedDate;
};

// // Example usage:
// console.log(date("YYYY-MM-DD HH:mm:ss")); // Output: e.g., 2024-07-26 08:37:02
// console.log(date("DD/MM/YYYY")); // Output: e.g., 26/07/2024
// console.log(date("HH:mm:ss")); // Output: e.g., 08:37:02
