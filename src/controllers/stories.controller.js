import Story from "../models/story.model.js";
import { Follow, Profile } from "../models/user.model.js";
import { successResponse, errorResponse } from "../lib/general.js";

const createStory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(errorResponse("Please upload an image for your story"));
        }

        const mediaUrl = `/uploads/stories/${req.file.filename}`;
        const newStory = new Story({
            user: req.user._id,
            mediaUrl,
            type: "image", // For now we only support images as per requirements
        });

        await newStory.save();
        return res.status(201).json(successResponse("Story created successfully", newStory));
    } catch (error) {
        console.error("Create Story Error:", error);
        return res.status(500).json(errorResponse("Internal server error"));
    }
};

const getStories = async (req, res) => {
    try {
        // Get list of followed users
        const following = await Follow.find({ follower: req.user._id }).select("following");
        const userIds = following.map((f) => f.following);
        userIds.push(req.user._id); // Include current user's stories

        // Fetch stories from these users
        const stories = await Story.find({
            user: { $in: userIds },
        })
            .populate("user", "username fullname")
            .sort({ createdAt: 1 });

        // Fetch profile pictures for these users
        const uniqueUserIds = [...new Set(stories.map(s => s.user._id.toString()))];
        const profiles = await Profile.find({ userId: { $in: uniqueUserIds } }, "userId profilePicture");

        const profilePicMap = {};
        profiles.forEach(p => {
            profilePicMap[p.userId.toString()] = p.profilePicture;
        });

        // Group stories by user
        const groupedStories = stories.reduce((acc, story) => {
            const userId = story.user._id.toString();
            if (!acc[userId]) {
                const userObj = story.user.toObject();
                userObj.profilePicture = profilePicMap[userId] || null;

                acc[userId] = {
                    user: userObj,
                    stories: [],
                };
            }
            acc[userId].stories.push(story);
            return acc;
        }, {});

        const result = Object.values(groupedStories).map(group => {
            // Check if current user has viewed ALL stories in this group
            const isViewed = group.stories.every(s =>
                s.viewers && s.viewers.some(v => v.toString() === req.user._id.toString())
            );

            // Add viewer count to each story (excluding the owner)
            const storiesWithCount = group.stories.map(s => {
                const storyObj = s.toObject();
                // Filter out the owner from the viewers count
                const actualViewers = s.viewers ? s.viewers.filter(v => v.toString() !== s.user._id.toString()) : [];
                storyObj.viewerCount = actualViewers.length;
                return storyObj;
            });

            return {
                ...group,
                stories: storiesWithCount,
                isViewed
            };
        });

        return res.status(200).json(successResponse("Stories fetched successfully", result));
    } catch (error) {
        console.error("Get Stories Error:", error);
        return res.status(500).json(errorResponse("Internal server error"));
    }
};

const markStoryAsViewed = async (req, res) => {
    try {
        const { storyId } = req.params;
        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json(errorResponse("Story not found"));
        }

        // Add user to viewers if not already there
        if (!story.viewers.includes(req.user._id)) {
            story.viewers.push(req.user._id);
            await story.save();
        }

        return res.status(200).json(successResponse("Story marked as viewed"));
    } catch (error) {
        console.error("Mark Story Viewed Error:", error);
        return res.status(500).json(errorResponse("Internal server error"));
    }
};

const getStoryViewers = async (req, res) => {
    try {
        const { storyId } = req.params;
        const story = await Story.findById(storyId)
            .populate({
                path: "viewers",
                select: "username fullname",
            });

        if (!story) {
            return res.status(404).json(errorResponse("Story not found"));
        }

        // Only allow story owner to see the viewers list
        if (story.user.toString() !== req.user._id.toString()) {
            return res.status(403).json(errorResponse("Unauthorized to see viewers list"));
        }

        // Fetch profile pictures for viewers
        const viewerIds = story.viewers.map(v => v._id);
        const profiles = await Profile.find({ userId: { $in: viewerIds } }, "userId profilePicture");

        const profilePicMap = {};
        profiles.forEach(p => {
            profilePicMap[p.userId.toString()] = p.profilePicture;
        });

        const viewersWithProfiles = story.viewers
            .filter(v => v._id.toString() !== story.user.toString())
            .map(v => {
                const viewerObj = v.toObject();
                viewerObj.profilePicture = profilePicMap[v._id.toString()] || null;
                return viewerObj;
            });

        return res.status(200).json(successResponse("Viewers fetched successfully", viewersWithProfiles));
    } catch (error) {
        console.error("Get Story Viewers Error:", error);
        return res.status(500).json(errorResponse("Internal server error"));
    }
};

export { createStory, getStories, markStoryAsViewed, getStoryViewers };