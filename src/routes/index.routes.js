import express from "express";
import authRoutes from "./auth.routes.js";
import pagesRoutes from "./pages.routes.js";
import feedRoutes from "./feed.routes.js";
import postRoutes from "./post.routes.js";
import userRoutes from "./user.routes.js";

const router = express.Router();

router.use("/api/auth", authRoutes);
router.use("/api/feed", feedRoutes);
router.use("/api/posts", postRoutes);
router.use("/api/users", userRoutes);
router.use("/", pagesRoutes);


export default router;