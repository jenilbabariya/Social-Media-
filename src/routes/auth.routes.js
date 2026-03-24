import express from "express";
import { login, register, forgotPassword, resetPassword, verifyOTP, resendOTP, logout } from "../controllers/auth.controller.js";
import authmiddleware from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/verify-email/:id", verifyOTP);
router.post("/resend-otp/:id", resendOTP);
router.post("/logout", logout);




export default router;