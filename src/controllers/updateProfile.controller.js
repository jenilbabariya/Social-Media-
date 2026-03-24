import { User, Profile } from "../models/user.model.js";
import { successResponse, errorResponse } from "../lib/general.js";
import fs from "fs";
import path from "path";


export const renderUpdatePage = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.render("layout.ejs", {
        header: {
          title: "Update Profile || Social Media"
        },

        body: {
          msg: "User not found."
        },

        footer: {
          js: []
        }
      });
    }

    const profile = await Profile.findOne({ userId });

    return res.render("updateProfile.ejs", {
      header: {
        title: "Update Profile || Social Media",
        css: ["edit-profile"],
        active: "profile"
      },

      body: {
        user,
        profile,
        bodyClass: "edit-profile-body"
      },

      footer: {
        js: ["profileEdit"]
      }
    });
  }
  catch (error) {
    console.error("Render Update Profile Error:", error);

    return res.status(500).render("layout.ejs", {
      header: {
        title: "Update Profile || Social Media"
      },

      body: {
        msg: "An error occurred while loading the update profile page."
      },

      footer: {
        js: []
      }
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullname, username, bio, isPrivate } = req.body;

    const profile = await Profile.findOne({ userId });
    const user = await User.findById(userId);
    if (!profile) {
      return res.status(404).json(errorResponse("Profile not found"));
    }

    // Store old image paths before updating
    const oldCoverPhoto = profile.coverPhoto;
    const oldProfilePicture = profile.profilePicture;

    user.fullname = fullname;
    user.username = username;
    profile.bio = bio;

    if (req.files?.coverPhoto) {
      profile.coverPhoto = "/" + req.files.coverPhoto[0].path.replace(/\\/g, "/");
    }
    if (req.files?.profilePicture) {
      profile.profilePicture = "/" + req.files.profilePicture[0].path.replace(/\\/g, "/");
    }

    await profile.save();
    await user.save();

    // Delete old images after successful save
    if (req.files?.coverPhoto && oldCoverPhoto) {
      const oldCoverPath = path.join(process.cwd(), oldCoverPhoto);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
    }

    if (req.files?.profilePicture && oldProfilePicture) {
      const oldProfilePath = path.join(process.cwd(), oldProfilePicture);
      if (fs.existsSync(oldProfilePath)) {
        fs.unlinkSync(oldProfilePath);
      }
    }

    return res.json(successResponse("Profile updated successfully", {
      username: user.username,
    }));
  }
  catch (error) {

    return res.status(500).json(errorResponse("An error occurred while updating the profile"));
  }
};  