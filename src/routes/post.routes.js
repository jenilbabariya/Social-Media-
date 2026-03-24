import express from "express";
import { createPost, deletePost, editPost, getPost, getUserPosts, createDraft, getDrafts, publishPost, deleteDraft, schedulePost, getScheduledPosts, cancelScheduledPost, toggleLike, addComment, getComments, addReply } from "../controllers/posts.controller.js";
import upload from "../middlewares/multer.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = express.Router();

router.use(authMiddleware);

router.post("/create", upload.array("postMedia", 10), createPost);
router.put("/edit/:postId", upload.array("postMedia", 10), editPost);
router.delete("/delete/:postId", deletePost);
router.get("/drafts", getDrafts);
router.get("/scheduled", getScheduledPosts);
router.get("/user/:username", getUserPosts);
router.get("/:postId", getPost);
router.post("/draft", upload.array("postMedia", 10), createDraft);
router.put("/publish/:postId", publishPost);
router.delete("/draft/:postId", deleteDraft);
router.post("/schedule", upload.array("postMedia", 10), schedulePost);
router.delete("/scheduled/:postId", cancelScheduledPost);
router.post("/like/:postId", toggleLike);
router.post("/comment/:postId", addComment);
router.get("/comments/:postId", getComments);
router.post("/reply/:commentId", addReply);
export default router;