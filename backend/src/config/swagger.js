import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
	openapi: "3.0.0",
	info: {
		title: "Textbook Corporation API",
		version: "1.0.0",
		description:
			"Enterprise-grade API documentation for the Textbook Corporation system.",
		license: {
			name: "Private",
			url: "https://textbookcorp.tn.gov.in",
		},
	},
	servers: [
		{
			url: "http://localhost:3000/api",
			description: "Local Development Server",
		},
		{
			url: "http://localhost:3000/api/v1",
			description: "Enterprise V1 Server",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
	security: [
		{
			bearerAuth: [],
		},
	],
};

const options = {
	swaggerDefinition,
	// Paths to files containing OpenAPI definitions
	apis: ["./src/routes/**/*.js", "./src/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
