import express from "express";
import { searchUsers, getFollowSuggestions } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);


router.get("/search", searchUsers);
router.get("/suggestions", getFollowSuggestions);

export default router;
