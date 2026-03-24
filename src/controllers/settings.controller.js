import { User, Profile } from "../models/user.model.js";
import { successResponse, errorResponse } from "../lib/general.js";
import { validate } from "../utills/auth.validator.js";
import { rules } from "../validators/rules.js";

export const getSettingsPage = async (req, res) => {
    try {

        const user = await User.findById(req.user._id).select("-password -refreshToken");

        res.render("settings.ejs", {
            header: {
                title: "Settings"
            },
            body: {
                user,
                isPrivate: user?.accountMeta?.isPrivate || false
            },
            footer: {
                js: ["settings"]
            }

        });

    } catch (error) {
        return res.status(500).render("layout.ejs", {
            header: {
                title: "Settings Error" 
            },
            body: {
                msg: "An error occurred while loading the settings page."
            },
            footer: {
                js: []
            }
        });
    }
};

export const togglePrivacy = async (req, res) => {
    try {
        const { isPrivate } = req.body;
        const user = await User.findById(req.user._id);
        user.accountMeta.isPrivate = isPrivate;
        await user.save();
        console.log("Privacy setting updated to:", user.accountMeta.isPrivate);
        return res.status(200).json(successResponse("Privacy setting updated", { isPrivate: user.accountMeta.isPrivate }));
    } catch (error) {
        return res.status(500).json(errorResponse("Failed to update privacy setting"));
    }
};
export const deleteAccount = async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.user._id, {
        isDeleted: true,
        deletedAt: new Date(),
      });
      return res.status(200).json(successResponse("Account deleted successfully")); 
    } catch (error) {
        return res.status(500).json(errorResponse("Failed to delete account"));
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.user._id);


        if (!user) {
            return res.status(404).json(errorResponse("User not found"));
        }
        const validationError = validate({ currentPassword, newPassword, confirmPassword }, rules.settings.changePassword);
        if (validationError) {
            return res.status(400).json(validationError);
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json(errorResponse("Current password is incorrect"));
        }


        user.password = newPassword;
        await user.save();
        return res.status(200).json(successResponse("Password changed successfully"));
    } catch (error) {
        return res.status(500).json(errorResponse("Failed to change password"));
    }
};

export const getChangePasswordPage = async (req, res) => {
    try {
        res.render("changePassword.ejs", {
            header: {
                title: "Change Password"
            },
            body: {},
            footer: {
                js: ["changePassword"]
            }
        });
    }
    catch (error) {
        return res.status(500).render("layout.ejs", {
            header: {
                title: "Change Password Error"
            },
            body: {
                msg: "An error occurred while loading the change password page."
            },
            footer: {
                js: [""]
            }
        });
    }
};