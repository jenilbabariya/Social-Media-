import mongoose from "mongoose";

const followRequestSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

followRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

const FollowRequest = mongoose.model("FollowRequest", followRequestSchema);

export default FollowRequest;