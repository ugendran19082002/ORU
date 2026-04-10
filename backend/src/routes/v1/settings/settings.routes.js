import express from "express";
import * as ComponentController from "../../../controllers/settings/component.controller.js";
import * as MenuController from "../../../controllers/settings/menu.controller.js";
import * as MenuComponentController from "../../../controllers/settings/menuComponent.controller.js";
import * as PermissionController from "../../../controllers/settings/permission.controller.js";
import {
	authenticateToken,
} from "../../../middleware/auth/authMiddleware.js";
import { validateResponse } from "../../../utils/validateResult.js";

const router = express.Router();

// 🔹 MIDDLEWARE
router.use(authenticateToken);

// 🔹 COMPONENT ROUTES
router.post(
	"/component/list",
	validateResponse,
	ComponentController.getComponent,
);
router.post(
	"/component/add",
	validateResponse,
	ComponentController.addComponent,
);
router.get(
	"/component/view/:id",
	validateResponse,
	ComponentController.viewComponent,
);
router.put(
	"/component/edit/:id",
	validateResponse,
	ComponentController.editComponent,
);

// 🔹 MENU ROUTES
router.post("/menu/list", validateResponse, MenuController.getMenu);
router.post("/menu/add", validateResponse, MenuController.addMenu);
router.get("/menu/view/:id", validateResponse, MenuController.viewMenu);
router.put("/menu/edit/:id", validateResponse, MenuController.editMenu);

// 🔹 MENU COMPONENT ROUTES
router.post(
	"/menu-component/add",
	validateResponse,
	MenuComponentController.addMenuComponent,
);
router.put(
	"/menu-component/edit/:id",
	validateResponse,
	MenuComponentController.editMenuComponent,
);
router.get("/route-api", validateResponse, MenuComponentController.getRouteApi);

// 🔹 PERMISSION ROUTES
router.post(
	"/permission/role/add",
	validateResponse,
	PermissionController.addRolePermissions,
);
router.post(
	"/permission/user/add",
	validateResponse,
	PermissionController.addUserPermissions,
);
router.put(
	"/permission/role/edit/:id",
	validateResponse,
	PermissionController.editPermissionRole,
);
router.put(
	"/permission/user/edit/:id",
	validateResponse,
	PermissionController.editPermissionUser,
);

export default router;
