import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
        text: {
            type: String,
            required: true,
            maxlength: 500,
        },
        replies: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                text: {
                    type: String,
                    required: true,
                    maxlength: 500,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        repliesCount: {
            type: Number,
            default: 0,
        },
    },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
