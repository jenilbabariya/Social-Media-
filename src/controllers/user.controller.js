import { User, Profile, Follow } from "../models/user.model.js";
import FollowRequest from "../models/followRequest.model.js";
import { errorResponse, successResponse } from "../lib/general.js";

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(200).json(successResponse("Success", []));
        }

        // Search for users matching partial username or fullname (case-insensitive)
        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: "i" } },
                { fullname: { $regex: q, $options: "i" } }
            ],
            isDeleted: false,
            verified: true
        })
        .select("username fullname _id")
        .limit(10)
        .lean();

        // Populate results with profile pictures from the Profile model
        const userIds = users.map(u => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } }, "userId profilePicture");

        const profileMap = {};
        profiles.forEach(p => profileMap[p.userId.toString()] = p.profilePicture);

        const usersWithPictures = users.map(u => ({
            ...u,
            profilePicture: profileMap[u._id.toString()] || null
        }));

        return res.status(200).json(successResponse("Success", usersWithPictures));

    } catch (error) {
        console.error("Search Users Error:", error);
        return res.status(500).json(errorResponse("Server error"));
    }
};

export const getFollowSuggestions = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // 1. Find users the current user is already following
        const following = await Follow.find({ follower: currentUserId }).select("following");
        const followingIds = following.map(f => f.following);

        // 2. Find users current user has already sent follow requests to
        const requests = await FollowRequest.find({ sender: currentUserId }).select("recipient");
        const requestIds = requests.map(r => r.recipient);

        // 3. Find users who are NOT:
        // - the current user
        // - already followed
        // - already requested
        // AND ARE verified
        const suggestions = await User.find({
            _id: { $nin: [currentUserId, ...followingIds, ...requestIds] },
            isDeleted: false,
            verified: true
        })
        .select("username fullname _id")
        .limit(5)
        .lean();

        // 3. Populate with profile pictures
        const userIds = suggestions.map(u => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } }, "userId profilePicture");

        const profileMap = {};
        profiles.forEach(p => profileMap[p.userId.toString()] = p.profilePicture);

        const formattedSuggestions = suggestions.map(u => ({
            ...u,
            profilePicture: profileMap[u._id.toString()] || null
        }));

        return res.status(200).json(successResponse("Suggestions fetched successfully", formattedSuggestions));

    } catch (error) {
        console.error("Get Suggestions Error:", error);
        return res.status(500).json(errorResponse("Server error"));
    }
};
