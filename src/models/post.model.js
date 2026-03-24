import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        caption: {
            type: String,
            default: "",
            maxlength: 2200,
        },

        media: [
            {
                url: {
                    type: String,
                    required: true,
                },
                type: {
                    type: String,
                    enum: ["image", "video"],
                    required: true,
                },
            }
        ],

        location: {
            type: String,
            default: null,
        },

        visibility: {
            type: String,
            enum: ["public", "followers", "private"],
            default: "public",
        },

        likesCount: {
            type: Number,
            default: 0,
        },

        commentsCount: {
            type: Number,
            default: 0,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["draft", "published", "scheduled"],
            default: "draft",
        },
        publishAt: {
            type: Date,
        }
    },
    { timestamps: true }
);

// same soft delete pattern as your User model
postSchema.pre(/^find/, function () {
    if (!this.getOptions().includeDeleted) {
        this.where({ isDeleted: false });
    }
});

postSchema.query.withDeleted = function () {
    return this.setOptions({ includeDeleted: true });
};

const Post = mongoose.model("Post", postSchema);

export default Post;