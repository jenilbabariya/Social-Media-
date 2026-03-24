import Notification from "../models/notifications.model.js";
import { User, Profile, Follow } from "../models/user.model.js";
import FollowRequest from "../models/followRequest.model.js";
import { successResponse, errorResponse } from "../lib/general.js";
import { timeAgo } from "../utills/timeAgo.js";
import { getIO } from "../config/socket.js";

export const getNotificationsPage = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const reqPage = parseInt(req.query.reqPage) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const reqSkip = (reqPage - 1) * limit;

        // ── Notifications (exclude follow_request type) ──────────────────────
        const total = await Notification.countDocuments({ recipient: userId, type: { $ne: "follow_request" } });
        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false, type: { $ne: "follow_request" } });

        const notifications = await Notification.find({ recipient: userId, type: { $ne: "follow_request" } })
            .populate("sender", "username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const senderIds = notifications.map(n => n.sender?._id).filter(Boolean);
        const profiles = await Profile.find({ userId: { $in: senderIds } }, "userId profilePicture");

        const profileMap = {};
        profiles.forEach(p => profileMap[p.userId.toString()] = p);

        const formatted = notifications.map(n => ({
            _id: n._id,
            type: n.type,
            message: n.message,
            isRead: n.isRead,
            sender: n.sender,
            senderProfile: profileMap[n.sender?._id?.toString()] || null,
            reference: n.reference,
            timeAgo: timeAgo(n.createdAt),
        }));

        // ── Follow Requests (paginated) ──────────────────────────────────────
        const totalRequests = await FollowRequest.countDocuments({ recipient: userId, status: "pending" });

        const rawRequests = await FollowRequest.find({ recipient: userId, status: "pending" })
            .populate("sender", "username")
            .sort({ createdAt: -1 })
            .skip(reqSkip)
            .limit(limit);

        const requestSenderIds = rawRequests.map(r => r.sender?._id).filter(Boolean);
        const requestProfiles = await Profile.find({ userId: { $in: requestSenderIds } }, "userId profilePicture");
        const requestProfileMap = {};
        requestProfiles.forEach(p => requestProfileMap[p.userId.toString()] = p);

        const followRequests = rawRequests.map(r => ({
            _id: r._id,
            sender: r.sender,
            senderProfile: requestProfileMap[r.sender?._id?.toString()] || null,
            timeAgo: timeAgo(r.createdAt),
        }));

        res.render("notifications.ejs", {
            header: {
                title: "Notifications || Social Media"
            },
            footer: {
                js: ["notifications"]
            },
            body: {
                notifications: formatted,
                unreadCount,
                page,
                totalPages: Math.ceil(total / limit),
                followRequests,
                requestCount: totalRequests,
                reqPage,
                reqTotalPages: Math.ceil(totalRequests / limit),
                activeTab: req.query.tab || "notifications",
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).render("layout.ejs", {
            header: { title: "Notifications || Social Media" },
            body: { msg: "An error occurred while loading notifications." },
            footer: { js: [] }
        });
    }
};

export const markAllRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const notification = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json(successResponse("Notification marked as read"));
    } catch (error) {
        console.error(error);
        res.status(500).json(errorResponse("Failed to mark notification as read"));
    }
};

export const markAsRead = async (req, res) => {
    try {
        const notifId = req.params.id
        await Notification.findByIdAndUpdate(notifId, { isRead: true });
        res.status(200).json(successResponse("Notification marked as read"));
    } catch (error) {
        console.error(error);
        res.status(500).json(errorResponse("Failed to mark notification as read"));
    }
};

export const acceptFollowRequest = async (req, res) => {
    try {
        const userId = req.user._id;
        const { requestId } = req.params;

        const request = await FollowRequest.findOne({ _id: requestId, recipient: userId, status: "pending" });
        if (!request) return res.status(404).json(errorResponse("Follow request not found"));

        request.status = "accepted";
        await request.save();

        // Create follow relationship
        await Follow.create({ follower: request.sender, following: request.recipient });

        // Mark related notification as read
        await Notification.findOneAndUpdate(
            { recipient: userId, sender: request.sender, type: "follow_request" },
            { isRead: true }
        );

        // Notify the requester that their follow request was accepted
        await Notification.create({
            recipient: request.sender,
            sender: userId,
            type: "follow",
            message: `${req.user.username} accepted your follow request`,
        });

        // Fetch sender's profile picture
        const senderProfile = await Profile.findOne({ userId: userId }, "profilePicture");

        const io = getIO();
        io.to(`user:${request.sender}`).emit("notification:new", {
            type: "follow",
            sender: {
                _id: userId,
                username: req.user.username,
                profilePicture: senderProfile?.profilePicture || null
            },
            message: `${req.user.username} accepted your follow request`
        });


        res.status(200).json(successResponse("Follow request accepted"));

    } catch (error) {
        console.error(error);
        res.status(500).json(errorResponse("Failed to accept follow request"));
    }
};

export const rejectFollowRequest = async (req, res) => {
    try {
        const userId = req.user._id;
        const { requestId } = req.params;

        const request = await FollowRequest.findOne({ _id: requestId, recipient: userId, status: "pending" });
        if (!request) return res.status(404).json(errorResponse("Follow request not found"));

        request.status = "rejected";
        await request.save();

        // Mark related notification as read
        await Notification.findOneAndUpdate(
            { recipient: userId, sender: request.sender, type: "follow_request" },
            { isRead: true }
        );

        res.status(200).json(successResponse("Follow request rejected"));
    } catch (error) {
        console.error(error);
        res.status(500).json(errorResponse("Failed to reject follow request"));
    }
};
