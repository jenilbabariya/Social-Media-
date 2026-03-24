import express from "express";
import { getFeedPosts } from "../controllers/feed.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getFeedPosts);

export default router;
