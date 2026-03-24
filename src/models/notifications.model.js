import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["follow", "like", "comment", "mention", "follow_request"],
            required: true,
        },

        // reference to the post/comment if applicable
        reference: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "referenceModel",
            default: null,
        },

        referenceModel: {
            type: String,
            enum: ["Post", "Comment"],
            default: null,
        },

        message: {
            type: String,
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;