import express from "express";
import { getSettingsPage, togglePrivacy, deleteAccount, getChangePasswordPage, changePassword } from "../controllers/settings.controller.js";

const router = express.Router();

router.get("/", getSettingsPage);
router.post("/toggle-privacy", togglePrivacy);
router.post("/delete-account", deleteAccount);
router.get("/change-password", getChangePasswordPage);
router.post("/change-password", changePassword);
    
export default router;
