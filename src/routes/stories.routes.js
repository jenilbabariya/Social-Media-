import express from "express";
import { createStory, getStories, markStoryAsViewed, getStoryViewers } from "../controllers/stories.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create", upload.single("storyMedia"), createStory);
router.get("/", getStories);
router.post("/:storyId/view", markStoryAsViewed);
router.get("/:storyId/viewers", getStoryViewers);

export default router;
