import Post from "../models/post.model.js";
import { Follow, User, Profile } from "../models/user.model.js";
import Like from "../models/like.model.js";
import Notification from "../models/notifications.model.js";
import { Comment } from "../models/comment.model.js";
import Bookmark from "../models/bookmark.model.js";
import { errorResponse, successResponse } from "../lib/general.js";
import { getIO } from "../config/socket.js";

export const createPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { caption, location } = req.body;
        const files = req.files || [];

        if (files.length === 0) {
            return res.status(400).json(errorResponse("Post must have a media"));
        }

        if (files.length > 10) {
            return res.status(400).json(errorResponse("Maximum 10 files allowed"));
        }

        const media = files.map(file => ({
            url: "/" + file.path.replace(/\\/g, "/"),
            type: file.mimetype.startsWith("video/") ? "video" : "image",
        }));

        const post = await Post.create({
            user: userId,
            caption: caption?.trim() || "",
            location: location || null,
            media,
            status: "published",
        });

        res.status(201).json(successResponse("Post created successfully", { post }));

    } catch (error) {
        console.error("Create Post Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};
export const editPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const { caption, location, publishAt } = req.body;
        const status = req.body.status || req.query.status;
        const files = req.files || []; // Ensure files is defined

        const post = await Post.findOne({ _id: postId, user: userId });
        if (!post) {
            return res.status(404).json(errorResponse("Post not found"));
        }

        if (caption !== undefined) post.caption = caption.trim();
        if (location !== undefined) post.location = location;

        // Backend enforcement: Only allow media updates if NOT already published
        if (post.status !== "published" && files.length > 0) {
            const newMedia = files.map(file => ({
                url: "/" + file.path.replace(/\\/g, "/"),
                type: file.mimetype.startsWith("video/") ? "video" : "image",
            }));
            post.media = newMedia;
        }

        // Handle Status Transitions AFTER checking original status for media
        if (status) {
            post.status = status;
        } else if (post.status === "draft" || post.status === "scheduled") {
            // If editing a draft/scheduled post and hitting 'Update Post' without status param, 
            // it means we want to publish it now.
            post.status = "published";
        }

        if (publishAt && post.status === "scheduled") {
            const scheduledDate = new Date(publishAt);
            const now = new Date();

            if (scheduledDate <= now) {
                return res.status(400).json(errorResponse("Scheduled time must be in the future"));
            }

            if (scheduledDate.getMinutes() % 5 !== 0) {
                return res.status(400).json(errorResponse("Scheduled time must be in 5-minute intervals"));
            }
            post.publishAt = scheduledDate;
        }

        // Backend enforcement: Only allow media updates if NOT an edit (or if we really want to allow it later)
        // For now, based on "cant change the picture", we ignore req.files for edits
        // if (files.length > 0) { ... } 


        await post.save();
        res.status(200).json(successResponse("Post updated successfully", { post }));

    } catch (error) {
        console.error("Edit Post Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const deletePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;

        const post = await Post.findOne({ _id: postId, user: userId });
        if (!post) {
            return res.status(404).json(errorResponse("Post not found"));
        }

        post.isDeleted = true;
        post.deletedAt = new Date();
        await post.save();

        res.status(200).json(successResponse("Post deleted successfully"));

    } catch (error) {
        console.error("Delete Post Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const getPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findOne({ _id: postId, status: "published" })
            .populate("user", "username");

        const isLiked = await Like.exists({ user: userId, post: postId });
        const isBookmarked = await Bookmark.exists({ user: userId, posts: postId });

        res.status(200).json(successResponse("Post fetched successfully", {
            post: { ...post.toObject(), isLiked: !!isLiked, isBookmarked: !!isBookmarked }
        }));

    } catch (error) {
        console.error("Get Post Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // find the user by username
        const targetUser = await User.findOne({ username });
        if (!targetUser) {
            return res.status(404).json(errorResponse("User not found"));
        }

        const query = { user: targetUser._id, status: "published" };

        const total = await Post.countDocuments(query);

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "username");

        const postIds = posts.map(p => p._id);
        const userLikes = await Like.find({ user: userId, post: { $in: postIds } }).select("post");
        const likedPostIds = new Set(userLikes.map(l => l.post.toString()));

        const bookmark = await Bookmark.findOne({ user: userId });
        const bookmarkedPostIds = new Set(bookmark ? bookmark.posts.map(id => id.toString()) : []);

        const formattedPosts = posts.map(p => {
            const pObj = p.toObject();
            pObj.isLiked = likedPostIds.has(pObj._id.toString());
            pObj.isBookmarked = bookmarkedPostIds.has(pObj._id.toString());
            return pObj;
        });

        res.status(200).json(successResponse("Posts fetched successfully", {
            posts: formattedPosts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }));

    } catch (error) {
        console.error("Get User Posts Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};
export const createDraft = async (req, res) => {
    try {
        const userId = req.user._id;
        const { caption, location } = req.body;
        const files = req.files || [];

        if (files.length > 10) {
            return res.status(400).json(errorResponse("Maximum 10 files allowed"));
        }

        const media = files.map(file => ({
            url: "/" + file.path.replace(/\\/g, "/"),
            type: file.mimetype.startsWith("video/") ? "video" : "image",
        }));

        const draft = await Post.create({
            user: userId,
            caption: caption?.trim() || "",
            location: location || null,
            media,
            status: "draft",
        });

        res.status(201).json(successResponse("Draft saved successfully", { draft }));

    } catch (error) {
        console.error("Create Draft Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const getDrafts = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const total = await Post.countDocuments({ user: userId, status: "draft" });

        const drafts = await Post.find({ user: userId, status: "draft" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json(successResponse("Drafts fetched successfully", {
            drafts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }));

    } catch (error) {
        console.error("Get Drafts Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const publishPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;

        const post = await Post.findOne({
            _id: postId,
            user: userId,
            status: { $in: ["draft", "scheduled"] }
        });

        if (!post) {
            return res.status(404).json(errorResponse("Post/Draft not found"));
        }

        post.status = "published";
        post.publishAt = new Date(); // Update to current time for immediate publishing
        await post.save();

        res.status(200).json(successResponse("Published successfully", { post }));

    } catch (error) {
        console.error("Publish Post Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const deleteDraft = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;

        const draft = await Post.findOne({ _id: postId, user: userId, status: "draft" });
        if (!draft) {
            return res.status(404).json(errorResponse("Draft not found"));
        }

        draft.isDeleted = true;
        draft.deletedAt = new Date();
        await draft.save();

        res.status(200).json(successResponse("Draft deleted successfully"));

    } catch (error) {
        console.error("Delete Draft Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};
export const schedulePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { caption, location, publishAt } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json(errorResponse("Please upload at least one image or video."));
        }

        if (req.files.length > 10) {
            return res.status(400).json(errorResponse("Maximum 10 files allowed."));
        }

        if (!publishAt) {
            return res.status(400).json(errorResponse("Publish date and time is required"));
        }

        const scheduledDate = new Date(publishAt);
        const now = new Date();

        if (scheduledDate <= now) {
            return res.status(400).json(errorResponse("Scheduled time must be in the future"));
        }

        if (scheduledDate.getMinutes() % 5 !== 0) {
            return res.status(400).json(errorResponse("Scheduled time must be in 5-minute intervals"));
        }

        const media = req.files.map(file => ({
            url: "/" + file.path.replace(/\\/g, "/"),
            type: file.mimetype.startsWith("video/") ? "video" : "image",
        }));

        const post = await Post.create({
            user: userId,
            caption: caption?.trim() || "",
            location: location || null,
            media,
            status: "scheduled",
            publishAt: scheduledDate,
        });

        res.status(201).json(successResponse("Post scheduled successfully", { post }));

    } catch (error) {
        console.error("Schedule Post Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const getScheduledPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const total = await Post.countDocuments({ user: userId, status: "scheduled" });

        const posts = await Post.find({ user: userId, status: "scheduled" })
            .sort({ publishAt: 1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json(successResponse("Scheduled posts fetched successfully", {
            posts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }));

    } catch (error) {
        console.error("Get Scheduled Posts Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const cancelScheduledPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;

        const post = await Post.findOne({ _id: postId, user: userId, status: "scheduled" });
        if (!post) {
            return res.status(404).json(errorResponse("Scheduled post not found"));
        }

        post.isDeleted = true;
        post.deletedAt = new Date();
        await post.save();

        res.status(200).json(successResponse("Scheduled post cancelled successfully"));

    } catch (error) {
        console.error("Cancel Scheduled Post Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const toggleLike = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json(errorResponse("Post not found"));
        }

        const existingLike = await Like.findOne({ user: userId, post: postId });

        if (existingLike) {
            // Unlike
            await Like.deleteOne({ _id: existingLike._id });
            post.likesCount = Math.max(0, post.likesCount - 1);
            await post.save();

            // Delete the corresponding notification if it exists (optional but good)
            await Notification.findOneAndDelete({
                recipient: post.user,
                sender: userId,
                type: "like",
                reference: post._id,
                referenceModel: "Post"
            });

            // After unliking: emit socket event
            const io = getIO();
            io.to(`post:${postId}`).emit("post:unliked", {
                userId,
                likesCount: post.likesCount,
                isLiked: false
            });

            return res.status(200).json(successResponse("Post unliked", { likesCount: post.likesCount, isLiked: false }));
        } else {
            // Like
            await Like.create({ user: userId, post: postId });
            post.likesCount += 1;
            await post.save();

            // Create notification (if not liking own post)
            if (post.user.toString() !== userId.toString()) {
                await Notification.create({
                    recipient: post.user,
                    sender: userId,
                    type: "like",
                    reference: post._id,
                    referenceModel: "Post",
                    message: `${req.user.username} liked your post.`,
                });

                // Fetch sender's profile picture
                const senderProfile = await Profile.findOne({ userId: userId }, "profilePicture");

                // Emit notification socket event
                const io = getIO();
                io.to(`user:${post.user}`).emit("notification:new", {
                    type: "like",
                    sender: {
                        _id: userId,
                        username: req.user.username,
                        profilePicture: senderProfile?.profilePicture || null
                    },
                    message: `${req.user.username} liked your post.`,
                    postId: post._id
                });
            }

            // After liking: emit socket event
            const io = getIO();
            io.to(`post:${postId}`).emit("post:liked", {
                userId,
                likesCount: post.likesCount,
                isLiked: true
            });

            return res.status(200).json(successResponse("Post liked", { likesCount: post.likesCount, isLiked: true }));
        }

    } catch (error) {
        console.error("Toggle Like Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const addComment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json(errorResponse("Comment text is required"));
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json(errorResponse("Post not found"));
        }

        const comment = await Comment.create({
            user: userId,
            post: postId,
            text: text.trim(),
        });

        post.commentsCount += 1;
        await post.save();

        const populatedComment = await Comment.findById(comment._id).populate("user", "username");
        
        // Fetch commenter's profile picture
        const commenterProfile = await Profile.findOne({ userId: userId }, "profilePicture");
        const commentObj = populatedComment.toObject();
        commentObj.user.profilePicture = commenterProfile?.profilePicture || null;

        // Create notification (if not commenting on own post)
        if (post.user.toString() !== userId.toString()) {
            await Notification.create({
                recipient: post.user,
                sender: userId,
                type: "comment",
                reference: post._id,
                referenceModel: "Post",
                message: `${req.user.username} commented: ${text.substring(0, 30)}${text.length > 30 ? "..." : ""}`,
            });

            // Emit notification socket event
            const io = getIO();
            io.to(`user:${post.user}`).emit("notification:new", {
                type: "comment",
                sender: {
                    _id: userId,
                    username: req.user.username,
                    profilePicture: commenterProfile?.profilePicture || null
                },
                message: `${req.user.username} commented on your post.`,
                postId: post._id
            });
        }

        // Emit post:commented event
        const io = getIO();
        io.to(`post:${postId}`).emit("post:commented", commentObj);

        res.status(201).json(successResponse("Comment added successfully", { comment: commentObj }));

    } catch (error) {
        console.error("Add Comment Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await Comment.countDocuments({ post: postId });
        const comments = await Comment.find({ post: postId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "username profilePicture") // Populate main user
            .populate("replies.user", "username profilePicture"); // Populate reply user

        // Extract commenter IDs (main comment and replies) to fetch profile pictures if needed
        const commenterIds = new Set();
        comments.forEach(c => {
            commenterIds.add(c.user._id.toString());
            if (c.replies) {
                c.replies.forEach(r => {
                    commenterIds.add(r.user._id.toString());
                });
            }
        });
        
        const profiles = await Profile.find({ userId: { $in: [...commenterIds] } }, "userId profilePicture");
        const profileMap = {};
        profiles.forEach(p => profileMap[p.userId.toString()] = p.profilePicture);

        const formattedComments = comments.map(c => {
            const commentObj = c.toObject();
            // Handle main comment profile picture
            if (commentObj.user) {
                commentObj.user.profilePicture = profileMap[commentObj.user._id.toString()] || null;
            }
            
            // Handle reply user profile pictures
            if (commentObj.replies && commentObj.replies.length > 0) {
                commentObj.replies.forEach(r => {
                    if (r.user) {
                        r.user.profilePicture = profileMap[r.user._id.toString()] || null;
                    }
                });
            }
            
            return commentObj;
        });

        res.status(200).json(successResponse("Comments fetched successfully", {
            comments: formattedComments,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }));

    } catch (error) {
        console.error("Get Comments Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const addReply = async (req, res) => {
    try {
        const userId = req.user._id;
        const { commentId } = req.params;
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json(errorResponse("Reply text is required"));
        }

        const comment = await Comment.findById(commentId).populate('post');
        if (!comment) {
            return res.status(404).json(errorResponse("Comment not found"));
        }

        const newReply = {
            user: userId,
            text: text.trim(),
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        comment.repliesCount += 1;
        await comment.save();

        // Get the newly created reply with its _id
        const savedComment = await Comment.findById(commentId)
            .populate("user", "username")
            .populate("replies.user", "username profilePicture");
        
        const addedReply = savedComment.replies[savedComment.replies.length - 1];
        const replyObj = addedReply.toObject();
        
        // Fetch profile picture for reply user
        const commenterProfile = await Profile.findOne({ userId: userId }, "profilePicture");
        if (replyObj.user) {
            replyObj.user.profilePicture = commenterProfile?.profilePicture || null;
        }

        // Create notification for comment owner
        if (comment.user.toString() !== userId.toString()) {
            await Notification.create({
                recipient: comment.user,
                sender: userId,
                type: "comment",
                reference: comment.post._id,
                referenceModel: "Post",
                message: `${req.user.username} replied to your comment.`,
            });
            
            const io = getIO();
            io.to(`user:${comment.user}`).emit("notification:new", {
                type: "comment",
                sender: {
                    _id: userId,
                    username: req.user.username,
                    profilePicture: commenterProfile?.profilePicture || null
                },
                message: `${req.user.username} replied to your comment.`,
                postId: comment.post._id
            });
        }

        const io = getIO();
        io.to(`post:${comment.post._id}`).emit("post:replied", { commentId, reply: replyObj });

        res.status(201).json(successResponse("Reply added successfully", { reply: replyObj }));

    } catch (error) {
        console.error("Add Reply Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const toggleBookmark = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json(errorResponse("Post not found"));
        }

        let bookmark = await Bookmark.findOne({ user: userId });

        if (!bookmark) {
            bookmark = await Bookmark.create({ user: userId, posts: [postId] });
            return res.status(200).json(successResponse("Post bookmarked", { isBookmarked: true }));
        }

        const postIndex = bookmark.posts.indexOf(postId);
        let isBookmarked = false;

        if (postIndex > -1) {
            // Remove from bookmarks
            bookmark.posts.splice(postIndex, 1);
            isBookmarked = false;
        } else {
            // Add to bookmarks
            bookmark.posts.push(postId);
            isBookmarked = true;
        }

        await bookmark.save();
        res.status(200).json(successResponse(isBookmarked ? "Post bookmarked" : "Post unbookmarked", { isBookmarked }));

    } catch (error) {
        console.error("Toggle Bookmark Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};

export const getBookmarkedPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const bookmark = await Bookmark.findOne({ user: userId });
        if (!bookmark || bookmark.posts.length === 0) {
            return res.status(200).json(successResponse("No bookmarks found", {
                posts: [],
                page,
                limit,
                total: 0,
                totalPages: 0,
            }));
        }

        const total = bookmark.posts.length;
        // Paginate the array of IDs manually or use $in with sort/limit
        // However, bookmark.posts is just an array of IDs. 
        // We want the posts in the order they were bookmarked (or reverse)?
        // The array order is usually sufficient.
        const postIds = bookmark.posts.slice().reverse().slice(skip, skip + limit);

        const posts = await Post.find({ _id: { $in: postIds } })
            .populate("user", "username fullname");

        // Fetch user profiles for profile pictures
        const postUserIds = posts.map(p => p.user._id);
        const profiles = await Profile.find({ userId: { $in: postUserIds } }, "userId profilePicture");
        const profileMap = {};
        profiles.forEach(p => profileMap[p.userId.toString()] = p.profilePicture);

        // Check likes and bookmarks for these posts
        const userLikes = await Like.find({ user: userId, post: { $in: postIds } }).select("post");
        const likedPostIds = new Set(userLikes.map(l => l.post.toString()));

        const formattedPosts = posts.map(p => {
            const pObj = p.toObject();
            pObj.userProfilePic = profileMap[pObj.user._id.toString()] || null;
            pObj.isLiked = likedPostIds.has(pObj._id.toString());
            pObj.isBookmarked = true; // Since they are from the bookmark collection
            return pObj;
        });

        // Re-sort to maintain the "bookmarked order" if needed, 
        // because Post.find order is not guaranteed to match postIds order.
        formattedPosts.sort((a, b) => {
            return postIds.indexOf(b._id.toString()) - postIds.indexOf(a._id.toString());
        });

        res.status(200).json(successResponse("Bookmarked posts fetched successfully", {
            posts: formattedPosts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }));

    } catch (error) {
        console.error("Get Bookmarked Posts Error:", error);
        res.status(500).json(errorResponse("Server error"));
    }
};