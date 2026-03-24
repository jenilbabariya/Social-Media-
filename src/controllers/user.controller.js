import { User, Profile } from "../models/user.model.js";
import { errorResponse, successResponse } from "../lib/general.js";

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(200).json(successResponse("Success", []));
        }

        // Search for users matching partial username (case-insensitive)
        const users = await User.find({
            username: { $regex: q, $options: "i" },
            isDeleted: false
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
