import express from "express";
import { getProfilePage } from "../controllers/profile.controller.js";
import { renderEditPost } from "../controllers/pages.controller.js";
import { renderUpdatePage, updateProfile } from "../controllers/updateProfile.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { followUser, unfollowUser, getConnectionsPage } from "../controllers/profile.controller.js";
const router = express.Router();

router.get("/:username", getProfilePage);
router.get("/edit/:id", renderUpdatePage);
router.get("/edit-post/:postId", renderEditPost);
router.post("/update-profile", upload.fields([
    { name: "coverPhoto", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 }
]), updateProfile);
router.get("/:userId/connections", getConnectionsPage);
router.post("/follow/:userId", followUser);
router.delete("/unfollow/:userId", unfollowUser);


export default router;