/**
 * Calculate pagination offset
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} - { limit, offset }
 */
export const getPagination = (page, limit) => {
	const limitNumber = Number(limit) || 10;
	const pageNumber = Number(page) || 1;
	const offset = (pageNumber - 1) * limitNumber;

	return {
		limit: limitNumber,
		offset: offset,
		page: pageNumber,
	};
};

/**
 * Format paginated data
 * @param {Object} data - Sequelize findAndCountAll result { count, rows }
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object}Formatted pagination object
 */
export const getPagingData = (data, page, limit) => {
	const { count: totalItems, rows: items } = data;
	const currentPage = page ? Number(page) : 1;
	// Calculate total pages, handle division by zero or default limit if needed (though limit is sanitized in getPagination)
	const totalPages = Math.ceil(totalItems / limit);

	return {
		totalItems,
		totalPages,
		currentPage,
		items,
	};
};
