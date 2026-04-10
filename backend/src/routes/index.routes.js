import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";

import authRouters from "./v1/auth/auth.routes.js";
import captchaRouters from "./v1/captcha/captcha.routes.js";
import contentVerificationRouters from "./v1/contentVerification/contentVerification.routes.js";
import editionDetailRouters from "./v1/editionDetails/editionDetail.routes.js";
import indentRouters from "./v1/indents/indent.routes.js";
import masterRouters from "./v1/master/index.js";
import optionRouters from "./v1/option/option.routes.js";
import settingRouters from "./v1/settings/settings.routes.js";
import uploadRouters from "./v1/upload/upload.routes.js";
import userRouters from "./v1/user/user.routes.js";

export const configureRoutes = (app) => {
   /* =====================================================
      API DOCUMENTATION (SWAGGER)
   ===================================================== */
   app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

   /* =====================================================
      API ROUTES
   ===================================================== */
   app.use("/api/auth", authRouters);
   app.use("/api/master", masterRouters);
   app.use("/api/setting", settingRouters);
   app.use("/api/user", userRouters);
   app.use("/api/content-verification", contentVerificationRouters);
   app.use("/api/indents", indentRouters);
   app.use("/api/captcha", captchaRouters);
   app.use("/api/edition-detail", editionDetailRouters);
   app.use("/api/option", optionRouters);
   app.use("/api/upload", uploadRouters);

   /* =====================================================
      STATIC FILES
   ===================================================== */
   app.use("/uploads", express.static("uploads"));

   /* =====================================================
      404 HANDLER
   ===================================================== */
   app.use((_req, res) => {
      return res.status(404).json({ message: "Page not found" });
   });
};
