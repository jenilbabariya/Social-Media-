import Notification from "../models/notifications.model.js";
import FollowRequest from "../models/followRequest.model.js";

/**
 * Injects `res.locals.sidebarNotifCount` for every authenticated request.
 * Value = unread notifications (excl. follow_request type) + pending follow requests.
 * Silently falls back to 0 on any error so the sidebar never breaks.
 */
const notifCountMiddleware = async (req, res, next) => {
    try {
        if (!req.user) return next();

        const userId = req.user._id;

        const [unreadCount, requestCount] = await Promise.all([
            Notification.countDocuments({ recipient: userId, isRead: false, type: { $ne: "follow_request" } }),
            FollowRequest.countDocuments({ recipient: userId, status: "pending" }),
        ]);

        res.locals.sidebarNotifCount = unreadCount + requestCount;
    } catch (_) {
        res.locals.sidebarNotifCount = 0;
    }
    next();
};

export default notifCountMiddleware;
