import { User, Profile, Follow } from "../models/user.model.js";
import { errorResponse, successResponse } from "../lib/general.js";
import FollowRequest from "../models/followRequest.model.js";
import Notification from "../models/notifications.model.js";
export const getProfilePage = async (req, res) => {
  try {
    const { username } = req.params;

    const currentUser = req.user || null;

    const profileUser = await User.findOne({ username })
      .select("-password -refreshToken");

    if (!profileUser) {
      return res.status(500).render("layout.ejs", {
        header: {
          title: "profile"
        },

        body: {
          msg: "User not found."
        },

        footer: {
          js: []
        }
      });
    }

    const profile = await Profile.findOne({
      userId: profileUser._id
    });

    const isOwner =
      currentUser &&
      currentUser._id.toString() === profileUser._id.toString();
    const isRequested =
      currentUser &&
      (await FollowRequest.exists({
        sender: currentUser._id,
        recipient: profileUser._id,
        status: "pending",
      }));
    const isFollower =
      currentUser &&
      (await Follow.exists({
        follower: currentUser._id,
        following: profileUser._id,
      }));

    const isPrivate = profileUser.accountMeta?.isPrivate;

    let viewType = "public";

    if (isOwner) {
      viewType = "owner";
    } else if (isPrivate && !isFollower) {
      viewType = "private";
    }

    const followersCount = await Follow.countDocuments({ following: profileUser._id });
    const followingCount = await Follow.countDocuments({ follower: profileUser._id });
    return res.render("profile-page.ejs", {
      header: {
        title: "profile || Social Media"
      },

      body: {
        user: profileUser,
        profileUser,
        profile,
        viewType,
        isOwner,
        isRequested,
        isFollower,
        followersCount,
        followingCount
      },

      footer: {
        js: ["profile"]
      }
    });

  } catch (error) {

    return res.status(500).render("layout.ejs", {
      header: {
        title: "profile || Social Media"
      },

      body: {
        msg: "An error occurred while fetching the profile."
      },

      footer: {
        js: []
      }
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;

    if (followerId.toString() === followingId) {
      return res.status(400).json(errorResponse("You cannot follow yourself"));
    }

    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      return res.status(404).json(errorResponse("User not found"));
    }

    if (targetUser.accountMeta.isPrivate) {

      const existingRequest = await FollowRequest.findOne({
        sender: followerId,
        recipient: followingId,
      });

      if (existingRequest) {
        return res.status(400).json(errorResponse("Follow request already sent"));
      }

      await FollowRequest.create({
        sender: followerId,
        recipient: followingId,
        status: "pending"
      });

      await Notification.create({
        recipient: followingId,
        sender: followerId,
        type: "follow_request",
        message: `${req.user.username} sent you a follow request`,
      });

      const followersCount = await Follow.countDocuments({ following: followingId });
      const followingCount = await Follow.countDocuments({ follower: followingId });

      return res.status(200).json(
        successResponse("Follow request sent", {
          requested: true,
          followersCount,
          followingCount
        })
      );
    }

    await Follow.create({
      follower: followerId,
      following: followingId,
    });

    const followersCount = await Follow.countDocuments({ following: followingId });
    const followingCount = await Follow.countDocuments({ follower: followingId });

    await Notification.create({
      recipient: followingId,
      sender: followerId,
      type: "follow",
      message: `${req.user.username} started following you`,
    });

    res.status(200).json(
      successResponse("Followed successfully", {
        followersCount,
        followingCount
      })
    );

  } catch (error) {
    console.error("Follow User Error:", error);
    if (error.code === 11000) {
      return res.status(400).json(errorResponse("Already following"));
    }
    res.status(500).json(errorResponse("Server error"));
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;

    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      return res.status(404).json(errorResponse("User not found"));
    }

    if (!targetUser.accountMeta.isPrivate) {
      await Follow.findOneAndDelete({
        follower: followerId,
        following: followingId,
      });
    }


    else {
      await Follow.findOneAndDelete({
        follower: followerId,
        following: followingId,
      });

      await FollowRequest.findOneAndDelete({
        sender: followerId,
        recipient: followingId,
      });
    }

    const followersCount = await Follow.countDocuments({ following: followingId });
    const followingCount = await Follow.countDocuments({ follower: followingId });

    return res.json(
      successResponse("Unfollowed successfully", {
        followersCount,
        followingCount
      })
    );

  } catch (error) {
    console.error("Unfollow Error:", error);
    return res.status(500).json(errorResponse("Server error"));
  }
};



export const getConnectionsPage = async (req, res) => {
  try {
    const { userId } = req.params;
    const type = req.query.type || "followers";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    let query = {};
    if (type === "followers") {
      query = { following: userId };
    } else {
      query = { follower: userId };
    }

    const total = await Follow.countDocuments(query);

    const data = await Follow.find(query)
      .populate(
        type === "followers" ? "follower" : "following",
        "username"
      )
      .skip(skip)
      .limit(limit);

    const users = data.map(d =>
      type === "followers" ? d.follower : d.following
    );

    const userIds = users.map(u => u._id);
    const profiles = await Profile.find({ userId: { $in: userIds } }, "userId profilePicture");

    const profileMap = {};
    profiles.forEach(p => profileMap[p.userId.toString()] = p.profilePicture);

    const usersWithPictures = users.map(u => ({
      _id: u._id,
      username: u.username,
      profilePicture: profileMap[u._id.toString()] || null
    }));

    res.render("connections.ejs", {
      header: {
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} || Social Media`
      },
      footer: {
        js: []
      },
      body: {
        users: usersWithPictures,
        type,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        userId,
      },
    });

  } catch (error) {
    res.status(500).render("layout.ejs", {
      header: {
        title: "Connections || Social Media"
      },
      body: {
        msg: "An error occurred while loading connections."
      },
      footer: {
        js: []
      }
    });
  }
};

