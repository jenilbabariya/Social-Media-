import express from "express";
import authmiddleware from "../middlewares/auth.middleware.js";
import notifCountMiddleware from "../middlewares/notifCount.middleware.js";
import settingsRoutes from "./settings.routes.js";
import { renderLogin, renderRegister, renderdashboard, renderForgotPassword, renderResetPassword, renderVerifyPage, renderCreatePost, renderSinglePost, renderSearchPage } from "../controllers/pages.controller.js";
import profileRoutes from "./profile.routes.js";
import postRoutes from "./post.routes.js";
import notificationsRoutes from "./notifications.routes.js";
const router = express.Router();

router.get("/register-page", renderRegister);
router.get("/login-page", renderLogin);
router.get("/forgot-password", renderForgotPassword)
router.get("/reset-password/:token", renderResetPassword);
router.get("/verify-email/:id", renderVerifyPage);
router.use(authmiddleware);
router.use(notifCountMiddleware);
router.get("/dashboard", renderdashboard);
router.get("/create-post", renderCreatePost);
router.get("/search", renderSearchPage);
router.get("/p/:postId", renderSinglePost);

router.use("/profile", profileRoutes);
router.use("/settings", settingsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/post", postRoutes);




export default router;