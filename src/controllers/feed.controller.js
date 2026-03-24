import Post from "../models/post.model.js";
import { User, Profile, Follow } from "../models/user.model.js";
import Like from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { errorResponse, successResponse } from "../lib/general.js";

export const getFeedPosts = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // 1. Get all users the current user is following
        const following = await Follow.find({ follower: currentUserId }).select("following");
        const followingIds = following.map(f => f.following);

        // Include the current user's own posts in the feed too
        const targetUserIds = [...followingIds, currentUserId];

        // 2. Query posts from these users that are published
        const query = {
            user: { $in: targetUserIds },
            status: "published"
        };

        const total = await Post.countDocuments(query);

        // Fetch the posts
        const posts = await Post.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit)
            .populate("user", "username fullname"); // Populate user details

        // 3. Fetch top 2 comments for each post
        const commentsPromises = posts.map(post => 
            Comment.find({ post: post._id })
                .sort({ createdAt: 1 }) // Chronological, so older comments first. Or -1 for newest. Let's do -1 for newest 2, then reverse them so they display chronologically? Actually Instagram shows the newest or pinned. Let's just do -1 for newest 2 but reverse.
                .limit(2)
                .populate("user", "username")
        );
        const commentsResults = await Promise.all(commentsPromises);

        // 4. Fetch profile pictures for post authors AND commenters
        const allUserIds = new Set(posts.map(post => post.user._id.toString()));
        commentsResults.forEach(postComments => {
            postComments.forEach(c => allUserIds.add(c.user._id.toString()));
        });

        const profiles = await Profile.find({ userId: { $in: [...allUserIds] } }, "userId profilePicture");
        const profilePicMap = {};
        profiles.forEach(p => {
            profilePicMap[p.userId.toString()] = p.profilePicture;
        });

        // 5. Check which posts the current user has liked
        const postIds = posts.map(post => post._id);
        const userLikes = await Like.find({ user: currentUserId, post: { $in: postIds } }).select("post");
        const likedPostIds = new Set(userLikes.map(l => l.post.toString()));

        // 6. Attach profile picture, isLiked status, and top comments to each post
        const formattedPosts = posts.map((post, index) => {
            const postObj = post.toObject();
            postObj.userProfilePic = profilePicMap[postObj.user._id.toString()] || null;
            postObj.isLiked = likedPostIds.has(postObj._id.toString());
            
            // Format comments
            const postComments = commentsResults[index].map(c => {
                const cObj = c.toObject();
                cObj.user.profilePicture = profilePicMap[cObj.user._id.toString()] || null;
                return cObj;
            }).reverse(); // Reverse so newest is at bottom

            postObj.topComments = postComments;
            
            return postObj;
        });

        res.status(200).json(successResponse("Feed fetched successfully", {
            posts: formattedPosts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }));

    } catch (error) {
        console.error("Get Feed Posts Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};
