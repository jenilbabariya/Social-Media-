import express from 'express';
import { getNotificationsPage, markAllRead, markAsRead, acceptFollowRequest, rejectFollowRequest } from '../controllers/notifications.controller.js';

const router = express.Router();

router.get("/", getNotificationsPage);
router.put("/mark-all-read", markAllRead);
router.put("/mark-as-read/:id", markAsRead);
router.put("/follow-request/:requestId/accept", acceptFollowRequest);
router.put("/follow-request/:requestId/reject", rejectFollowRequest);
export default router;